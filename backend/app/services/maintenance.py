"""Vehicle Maintenance Service Module for RouteWise."""

import logging
from typing import Optional
from sqlalchemy.orm import Session

from app.config import SERVICE_INTERVAL_KM
from app.models.maintenance_ticket import MaintenanceTicket
from app.models.vehicle import Vehicle

logger = logging.getLogger("routewise.maintenance")


def check_maintenance(vehicle: Vehicle, db: Session) -> Optional[MaintenanceTicket]:
    """Check if a vehicle has reached or exceeded the service mileage interval.

    Opens a maintenance ticket with trigger_type="mileage" when
    (mileage_km - last_service_mileage_km) >= SERVICE_INTERVAL_KM,
    ONLY if the vehicle does not already have an open ticket (preventing duplicates).

    Args:
        vehicle: Vehicle SQLAlchemy model instance.
        db: Database session.

    Returns:
        The created MaintenanceTicket if opened, or None.
    """
    curr_mileage = float(vehicle.mileage_km or 0.0)
    last_service_mileage = float(vehicle.last_service_mileage_km or 0.0)
    delta_km = curr_mileage - last_service_mileage

    if delta_km >= SERVICE_INTERVAL_KM:
        # Check if an open maintenance ticket already exists for this vehicle
        existing_open_ticket = (
            db.query(MaintenanceTicket)
            .filter(
                MaintenanceTicket.vehicle_id == vehicle.id,
                MaintenanceTicket.status == "open",
            )
            .first()
        )
        if not existing_open_ticket:
            description = (
                f"{int(delta_km):,} km since last service "
                f"(service threshold: {int(SERVICE_INTERVAL_KM):,} km)"
            )
            ticket = MaintenanceTicket(
                vehicle_id=vehicle.id,
                trigger_type="mileage",
                description=description,
                status="open",
            )
            db.add(ticket)
            db.commit()
            db.refresh(ticket)
            logger.info(
                f"Opened maintenance ticket #{ticket.id} for vehicle {vehicle.plate_no}: {description}"
            )
            return ticket
    return None


def run_maintenance_sweep(db: Session) -> int:
    """Run a maintenance check over all registered vehicles (e.g. at server startup).

    Returns:
        Count of newly opened tickets.
    """
    vehicles = db.query(Vehicle).all()
    opened_count = 0
    for v in vehicles:
        ticket = check_maintenance(v, db)
        if ticket:
            opened_count += 1
    return opened_count
