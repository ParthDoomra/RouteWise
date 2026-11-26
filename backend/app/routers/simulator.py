"""Vehicle Position Simulator Router for RouteWise (require_manager)."""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.services.auth_deps import require_manager
from app.services.simulator import simulator

router = APIRouter(tags=["Simulator"])


class SimulatorSpeedRequest(BaseModel):
    speed_multiplier: Optional[float] = Field(None, ge=1.0, le=200.0, description="Speed multiplier (1 to 200)")
    multiplier: Optional[float] = Field(None, ge=1.0, le=200.0, description="Alternative field name for speed multiplier")


class SimulatorStatusResponse(BaseModel):
    running: bool
    tick_seconds: int
    speed_multiplier: float


@router.post("/simulator/start", response_model=SimulatorStatusResponse)
def start_simulator(_current_user: dict = Depends(require_manager)):
    """Start or resume the vehicle position simulator (Manager only)."""
    simulator.start()
    return simulator.get_status()


@router.post("/simulator/stop", response_model=SimulatorStatusResponse)
def stop_simulator(_current_user: dict = Depends(require_manager)):
    """Pause the vehicle position simulator (Manager only)."""
    simulator.stop()
    return simulator.get_status()


@router.get("/simulator/status", response_model=SimulatorStatusResponse)
def get_simulator_status(_current_user: dict = Depends(require_manager)):
    """Retrieve the current running status and configuration of the simulator (Manager only)."""
    return simulator.get_status()


@router.post("/simulator/speed", response_model=SimulatorStatusResponse)
def set_simulator_speed(
    payload: SimulatorSpeedRequest,
    _current_user: dict = Depends(require_manager),
):
    """Update the simulation speed multiplier (1 to 200) (Manager only)."""
    val = payload.speed_multiplier if payload.speed_multiplier is not None else payload.multiplier
    if val is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Either 'speed_multiplier' or 'multiplier' must be provided",
        )

    if not (1.0 <= val <= 200.0):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Speed multiplier must be between 1 and 200",
        )

    simulator.set_speed(val)
    return simulator.get_status()
