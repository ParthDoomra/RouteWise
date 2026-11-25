"""Vehicles & Drivers Management Router for RouteWise (require_manager)."""

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.driver import Driver
from app.models.vehicle import Vehicle
from app.schemas.drivers import DriverResponse
from app.schemas.vehicles import VehicleCreate, VehicleResponse
from app.services.auth_deps import require_manager

router = APIRouter(tags=["Vehicles & Drivers"])


@router.get("/vehicles", response_model=List[VehicleResponse])
def get_vehicles(
    db: Session = Depends(get_db),
    _current_user: dict = Depends(require_manager),
):
    """List all vehicles with live status and capacity (Manager only)."""
    return db.query(Vehicle).order_by(Vehicle.id.asc()).all()


@router.post("/vehicles", response_model=VehicleResponse, status_code=status.HTTP_201_CREATED)
def create_vehicle(
    payload: VehicleCreate,
    db: Session = Depends(get_db),
    _current_user: dict = Depends(require_manager),
):
    """Register a new vehicle in the fleet (Manager only)."""
    existing = db.query(Vehicle).filter(Vehicle.plate_no == payload.plate_no.strip()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Vehicle with plate_no '{payload.plate_no.strip()}' already exists",
        )

    new_vehicle = Vehicle(
        plate_no=payload.plate_no.strip(),
        model=payload.model,
        capacity_kg=payload.capacity_kg,
        status=payload.status or "available",
        current_lat=payload.current_lat,
        current_lng=payload.current_lng,
        mileage_km=payload.mileage_km or 0.0,
        last_service_date=payload.last_service_date,
    )
    db.add(new_vehicle)
    db.commit()
    db.refresh(new_vehicle)
    return new_vehicle


@router.get("/drivers", response_model=List[DriverResponse])
def get_drivers(
    db: Session = Depends(get_db),
    _current_user: dict = Depends(require_manager),
):
    """List all drivers with shift hours and assigned vehicle ID (Manager only)."""
    return db.query(Driver).order_by(Driver.id.asc()).all()
