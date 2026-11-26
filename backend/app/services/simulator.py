# GPS is simulated because there are no real devices.
# In a production environment with real hardware, telematics IoT devices / OBD-II trackers
# would publish live coordinates to an MQTT broker or webhook endpoint, replacing this module.

import asyncio
import logging
from typing import Dict, Optional, Tuple
from sqlalchemy.orm import Session

from app.algorithms.haversine import haversine_km
from app.config import (
    AVG_SPEED_KMPH,
    DEPOT_LAT,
    DEPOT_LNG,
    SIM_AUTOSTART,
    SIM_SPEED_MULTIPLIER,
    SIM_TICK_SECONDS,
)
from app.database import SessionLocal
from app.models.route import Route
from app.models.route_stop import RouteStop
from app.models.vehicle import Vehicle

logger = logging.getLogger("routewise.simulator")


def step_position(
    current: Tuple[float, float],
    target: Tuple[float, float],
    distance_km: float,
) -> Tuple[Tuple[float, float], bool]:
    """Pure function to advance a geographic point toward a target coordinate.

    Uses haversine distance and linear interpolation. Never overshoots the target.
    
    Args:
        current: (latitude, longitude) of starting position.
        target: (latitude, longitude) of destination position.
        distance_km: Distance in kilometers to advance in this step.

    Returns:
        A tuple of ((new_lat, new_lng), arrived: bool).
        - arrived is True if the vehicle reached or was already at the target.
        - arrived is False if still en route.
    """
    curr_lat, curr_lng = float(current[0]), float(current[1])
    target_lat, target_lng = float(target[0]), float(target[1])

    total_dist = haversine_km(curr_lat, curr_lng, target_lat, target_lng)

    # Already at destination or step distance covers the remaining distance
    if total_dist <= distance_km or total_dist < 1e-6:
        return (target_lat, target_lng), True

    if distance_km <= 0.0:
        return (curr_lat, curr_lng), False

    fraction = distance_km / total_dist
    new_lat = curr_lat + (target_lat - curr_lat) * fraction
    new_lng = curr_lng + (target_lng - curr_lng) * fraction

    return (round(new_lat, 6), round(new_lng, 6)), False


def simulate_tick(
    db: Session,
    speed_multiplier: float = SIM_SPEED_MULTIPLIER,
    tick_seconds: int = SIM_TICK_SECONDS,
    vehicle_id: Optional[int] = None,
) -> Dict[int, Dict]:
    """Execute one simulation tick over vehicles with active delivery routes.

    Rules:
    - Moves each vehicle toward its next undelivered stop along its active route.
    - Speed is AVG_SPEED_KMPH * speed_multiplier.
    - When it arrives at a stop, it waits at that stop until the driver marks it delivered.
    - Updates vehicle current_lat and current_lng.
    - NEVER modifies vehicle mileage_km (mileage is added upon route completion).

    Args:
        db: Database session for this tick.
        speed_multiplier: Speed factor multiplier.
        tick_seconds: Duration represented by this tick in seconds.
        vehicle_id: Optional filter to simulate a single vehicle.

    Returns:
        Dictionary mapping vehicle_id to tick update information.
    """
    updates: Dict[int, Dict] = {}

    # Find vehicles with active routes
    query = db.query(Route).filter(Route.status == "active")
    if vehicle_id is not None:
        query = query.filter(Route.vehicle_id == vehicle_id)
    active_routes = query.all()

    for route in active_routes:
        vehicle = db.query(Vehicle).filter(Vehicle.id == route.vehicle_id).first()
        if not vehicle:
            continue

        # Target is the next stop not yet delivered, in sequence order
        next_stop = (
            db.query(RouteStop)
            .filter(
                RouteStop.route_id == route.id,
                RouteStop.status != "delivered",
            )
            .order_by(RouteStop.sequence_no.asc())
            .first()
        )

        if not next_stop or next_stop.stop_lat is None or next_stop.stop_lng is None:
            continue

        # Starting point: current vehicle coordinates, or depot if not yet set
        curr_lat = float(vehicle.current_lat) if vehicle.current_lat is not None else float(DEPOT_LAT)
        curr_lng = float(vehicle.current_lng) if vehicle.current_lng is not None else float(DEPOT_LNG)

        target_lat = float(next_stop.stop_lat)
        target_lng = float(next_stop.stop_lng)

        # Calculate step distance: (speed km/h * time in hours)
        speed_kmph = AVG_SPEED_KMPH * speed_multiplier
        step_dist_km = (speed_kmph * tick_seconds) / 3600.0

        new_pos, arrived = step_position(
            (curr_lat, curr_lng),
            (target_lat, target_lng),
            step_dist_km,
        )

        # Update vehicle coordinates (do NOT touch mileage_km)
        vehicle.current_lat = new_pos[0]
        vehicle.current_lng = new_pos[1]

        updates[vehicle.id] = {
            "vehicle_id": vehicle.id,
            "plate_no": vehicle.plate_no,
            "current_lat": new_pos[0],
            "current_lng": new_pos[1],
            "target_stop_id": next_stop.id,
            "target_stop_seq": next_stop.sequence_no,
            "arrived": arrived,
        }

    db.commit()
    return updates


class VehiclePositionSimulator:
    """Manages the background simulation loop and operational state."""

    def __init__(self):
        self.running: bool = SIM_AUTOSTART
        self.tick_seconds: int = SIM_TICK_SECONDS
        self.speed_multiplier: float = SIM_SPEED_MULTIPLIER
        self._shutdown_event: asyncio.Event = asyncio.Event()
        self._task: Optional[asyncio.Task] = None

    def start(self) -> None:
        """Start or resume the simulation loop."""
        self.running = True
        logger.info("Vehicle position simulator started.")

    def stop(self) -> None:
        """Pause the simulation loop."""
        self.running = False
        logger.info("Vehicle position simulator stopped.")

    def set_speed(self, multiplier: float) -> None:
        """Set simulation speed multiplier (1 to 200)."""
        if not (1.0 <= multiplier <= 200.0):
            raise ValueError("Speed multiplier must be between 1 and 200")
        self.speed_multiplier = float(multiplier)
        logger.info(f"Simulator speed multiplier set to {self.speed_multiplier}x")

    def get_status(self) -> Dict:
        """Return current status of the simulator."""
        return {
            "running": self.running,
            "tick_seconds": self.tick_seconds,
            "speed_multiplier": self.speed_multiplier,
        }

    async def run_loop(self) -> None:
        """Background asynchronous loop running every SIM_TICK_SECONDS."""
        logger.info("Simulator background loop initialized.")
        while not self._shutdown_event.is_set():
            try:
                if self.running:
                    # Execute tick in a separate thread to keep asyncio event loop unblocked
                    loop = asyncio.get_running_loop()
                    await loop.run_in_executor(None, self._execute_tick_safely)
            except Exception as e:
                logger.exception(f"Unhandled simulator exception: {e}")

            # Sleep in short increments for responsive shutdown
            for _ in range(self.tick_seconds * 2):
                if self._shutdown_event.is_set():
                    break
                await asyncio.sleep(0.5)

    def _execute_tick_safely(self) -> None:
        """Safely run a tick with a fresh DB session and robust error handling."""
        db = SessionLocal()
        try:
            simulate_tick(
                db=db,
                speed_multiplier=self.speed_multiplier,
                tick_seconds=self.tick_seconds,
            )
        except Exception as e:
            logger.error(f"Simulator tick execution error: {e}", exc_info=True)
            db.rollback()
        finally:
            db.close()

    def shutdown(self) -> None:
        """Signal clean shutdown of the simulator loop."""
        self._shutdown_event.set()
        self.running = False
        logger.info("Simulator shutdown signaled.")


# Global simulator instance
simulator = VehiclePositionSimulator()
