"""Maintenance Management Router for RouteWise (require_manager)."""

import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.maintenance_ticket import MaintenanceTicket
from app.schemas.maintenance import MaintenanceTicketResponse
from app.services.auth_deps import require_manager

router = APIRouter(tags=["Maintenance"])


@router.get("/maintenance", response_model=List[MaintenanceTicketResponse])
def get_maintenance_tickets(
    db: Session = Depends(get_db),
    _current_user: dict = Depends(require_manager),
):
    """List all maintenance tickets (Manager only)."""
    return db.query(MaintenanceTicket).order_by(MaintenanceTicket.id.desc()).all()


@router.patch("/maintenance/{ticket_id}/resolve", response_model=MaintenanceTicketResponse)
def resolve_maintenance_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    _current_user: dict = Depends(require_manager),
):
    """Mark a maintenance ticket as resolved (Manager only)."""
    ticket = db.query(MaintenanceTicket).filter(MaintenanceTicket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Maintenance ticket with ID {ticket_id} not found",
        )

    ticket.status = "resolved"
    ticket.resolved_at = datetime.datetime.now(datetime.timezone.utc)

    # Reset vehicle service clock
    from app.models.vehicle import Vehicle
    vehicle = db.query(Vehicle).filter(Vehicle.id == ticket.vehicle_id).first()
    if vehicle:
        vehicle.last_service_mileage_km = vehicle.mileage_km
        vehicle.last_service_date = datetime.date.today()

    db.commit()
    db.refresh(ticket)
    return ticket
