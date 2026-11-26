"""DelayEvent SQLAlchemy Model."""

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import relationship

from app.database import Base


class DelayEvent(Base):
    __tablename__ = "delay_events"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    stop_id = Column(Integer, ForeignKey("route_stops.id", ondelete="SET NULL"), nullable=True)
    reason = Column(String(50), nullable=False)  # traffic, weather, vehicle_issue, address_issue, high_volume, unspecified
    delay_minutes = Column(Integer, nullable=False)
    status = Column(String(20), default="open", nullable=False)  # open, resolved
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    order = relationship("Order", back_populates="delay_events")
    stop = relationship("RouteStop")
