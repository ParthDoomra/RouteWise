"""MaintenanceTicket SQLAlchemy Model."""

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import relationship

from app.database import Base


class MaintenanceTicket(Base):
    __tablename__ = "maintenance_tickets"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id", ondelete="CASCADE"), nullable=False)
    trigger_type = Column(String(50), nullable=False)  # mileage, manual, scheduled
    description = Column(String(255), nullable=True)
    status = Column(String(20), default="open", nullable=False)  # open, resolved, in_progress
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    resolved_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    vehicle = relationship("Vehicle", back_populates="maintenance_tickets")
