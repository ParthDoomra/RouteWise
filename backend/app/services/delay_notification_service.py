"""Delay Detection and Notification Engine for RouteWise.

Rules:
1. Real SMS or email delivery is NOT built; delivery_status is 'simulated'.
2. Automatic non-AI template notifications (is_ai_generated=False) when an order
   becomes assigned, picked_up, and delivered.
3. Only ONE open delay event per order at a time; repeat reports update the event
   and existing message instead of duplicating.
4. Latest delay message is stored on the order for GET /track/{uuid} and cleared
   when the order is delivered.
5. Background loop checks for delay events based on DELAY_THRESHOLD_MIN.
"""

import asyncio
import datetime
import logging
from typing import Optional, Tuple

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.config import (
    DELAY_CHECK_AUTOSTART,
    DELAY_THRESHOLD_MIN,
)
from app.database import SessionLocal
from app.models.delay_event import DelayEvent
from app.models.notification import Notification
from app.models.order import Order
from app.models.route import Route
from app.models.route_stop import RouteStop
from app.services.ai_delay_message import (
    generate_delay_message,
    local_merge_customer_message,
)

logger = logging.getLogger("routewise.delay_engine")


def send_order_lifecycle_notification(
    db: Session,
    order: Order,
    event_type: str,
) -> Optional[Notification]:
    """Create automatic non-AI template notifications for order lifecycle transitions.

    Supported events: 'assigned', 'picked_up', 'delivered'.
    Always sets is_ai_generated=False and delivery_status='simulated'.
    """
    if not order:
        return None

    msg = ""
    if event_type == "assigned":
        core = f"Your order {order.order_code} has been assigned for delivery."
        msg = local_merge_customer_message(core, order.customer_name, order.tracking_uuid)
    elif event_type == "picked_up":
        core = f"Your order {order.order_code} has been picked up and is on its way."
        msg = local_merge_customer_message(core, order.customer_name, order.tracking_uuid)
    elif event_type == "delivered":
        first_name = "Customer"
        if order.customer_name and order.customer_name.strip():
            parts = order.customer_name.strip().split()
            if parts:
                first_name = parts[0]
        msg = f"Hi {first_name}, your order {order.order_code} has been delivered successfully. Thank you for choosing RouteWise!"

        # Deliver cleanup: resolve open delay events and clear latest_delay_message
        db.query(DelayEvent).filter(
            DelayEvent.order_id == order.id,
            DelayEvent.status == "open",
        ).update({"status": "resolved"})
        order.latest_delay_message = None
        order.delay_reason = None
    else:
        return None

    # Telecommunications disclaimer comment:
    # Real SMS / WhatsApp / Email gateway integration (e.g. Twilio / SendGrid) is simulated.
    notif = Notification(
        order_id=order.id,
        message=msg,
        channel="sms",
        is_ai_generated=False,
        generation_source="template",
        delivery_status="simulated",
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return notif


def record_or_update_delay(
    db: Session,
    order: Order,
    reason: str,
    delay_minutes: int,
    stop_id: Optional[int] = None,
) -> Tuple[DelayEvent, Notification, bool]:
    """Create or update a delay event for an order and dispatch/update its notification.

    Rules:
    - Only ONE open delay event per order at a time.
    - A repeat report updates the existing event and message instead of creating duplicates.
    - Stores the latest delay message on the order.
    """
    delay_minutes = max(1, min(int(delay_minutes), 240))
    reason = str(reason).strip()

    # 1. Generate explanation (Claude or Fallback template)
    core_text, source = generate_delay_message(
        reason=reason,
        delay_minutes=delay_minutes,
        zone=order.zone,
        order_id=order.id,
    )
    is_ai = (source == "claude")

    # 2. Local Merge on our server (Name + Tracking link)
    full_message = local_merge_customer_message(
        core_message=core_text,
        customer_name=order.customer_name,
        tracking_uuid=order.tracking_uuid,
    )

    # 3. Store on order
    order.delay_reason = reason
    order.latest_delay_message = full_message
    if order.status not in ["delivered", "cancelled"]:
        order.status = "delayed"

    # 4. Find open delay event
    open_event = (
        db.query(DelayEvent)
        .filter(DelayEvent.order_id == order.id, DelayEvent.status == "open")
        .first()
    )

    is_repeat = False
    if open_event:
        # Update existing open event
        is_repeat = True
        open_event.reason = reason
        open_event.delay_minutes = delay_minutes
        if stop_id:
            open_event.stop_id = stop_id
        open_event.updated_at = func.now()
        delay_event = open_event

        # Update existing latest notification for this order to avoid duplicates
        existing_notif = (
            db.query(Notification)
            .filter(Notification.order_id == order.id)
            .order_by(Notification.sent_at.desc())
            .first()
        )
        if existing_notif:
            existing_notif.message = full_message
            existing_notif.is_ai_generated = is_ai
            existing_notif.generation_source = source
            existing_notif.delivery_status = "simulated"
            notif = existing_notif
        else:
            notif = Notification(
                order_id=order.id,
                message=full_message,
                channel="sms",
                is_ai_generated=is_ai,
                generation_source=source,
                delivery_status="simulated",
            )
            db.add(notif)
    else:
        # Create fresh open delay event
        delay_event = DelayEvent(
            order_id=order.id,
            stop_id=stop_id,
            reason=reason,
            delay_minutes=delay_minutes,
            status="open",
        )
        db.add(delay_event)

        notif = Notification(
            order_id=order.id,
            message=full_message,
            channel="sms",
            is_ai_generated=is_ai,
            generation_source=source,
            delivery_status="simulated",
        )
        db.add(notif)

    db.commit()
    db.refresh(order)
    db.refresh(delay_event)
    db.refresh(notif)
    return delay_event, notif, is_repeat


def check_active_route_delays(db: Session) -> int:
    """Scan active routes and undelivered stops for delays exceeding DELAY_THRESHOLD_MIN.

    Automatic detection uses reason='unspecified'.
    Returns number of delays detected and recorded.
    """
    detected_count = 0
    active_routes = db.query(Route).filter(Route.status == "active").all()

    now = datetime.datetime.now(datetime.timezone.utc)
    for route in active_routes:
        for stop in route.stops:
            if stop.status in ["delivered", "cancelled"] or not stop.order_id:
                continue

            order = db.query(Order).filter(Order.id == stop.order_id).first()
            if not order or order.status == "delivered":
                continue

            # Compare estimated arrival / eta with original_eta
            ref_eta = stop.original_eta or stop.eta
            if not ref_eta:
                continue

            # Ensure ref_eta has timezone if comparing with now
            if ref_eta.tzinfo is None:
                ref_eta = ref_eta.replace(tzinfo=datetime.timezone.utc)

            # If current ETA is past original ETA by more than threshold
            current_eta = stop.eta
            if current_eta and current_eta.tzinfo is None:
                current_eta = current_eta.replace(tzinfo=datetime.timezone.utc)

            eval_target = current_eta or now
            diff_min = (eval_target - ref_eta).total_seconds() / 60.0

            if diff_min >= DELAY_THRESHOLD_MIN:
                # Check if an open delay already exists
                has_open = (
                    db.query(DelayEvent)
                    .filter(DelayEvent.order_id == order.id, DelayEvent.status == "open")
                    .first()
                )
                if not has_open:
                    record_or_update_delay(
                        db=db,
                        order=order,
                        reason="unspecified",
                        delay_minutes=int(diff_min),
                        stop_id=stop.id,
                    )
                    detected_count += 1

    return detected_count


class DelayDetectorService:
    """Background service for automated delivery delay monitoring."""

    def __init__(self, autostart: bool = DELAY_CHECK_AUTOSTART, interval_seconds: int = 15):
        self.autostart = autostart
        self.interval_seconds = interval_seconds
        self.is_running = False
        self._stop_event = asyncio.Event()

    async def run_loop(self) -> None:
        """Periodic background checking loop."""
        if not self.autostart:
            logger.info("Delay detector autostart is disabled. Background loop dormant.")
            return

        self.is_running = True
        logger.info("Delay detector background loop started (interval=%ss).", self.interval_seconds)
        while not self._stop_event.is_set():
            try:
                db = SessionLocal()
                try:
                    check_active_route_delays(db)
                finally:
                    db.close()
            except Exception as e:
                logger.error("Error during delay detection check: %s", str(e))

            try:
                await asyncio.wait_for(self._stop_event.wait(), timeout=self.interval_seconds)
            except asyncio.TimeoutError:
                pass

    def shutdown(self) -> None:
        """Gracefully shut down the background loop."""
        self._stop_event.set()
        self.is_running = False
        logger.info("Delay detector background loop shut down.")


delay_detector_service = DelayDetectorService()
