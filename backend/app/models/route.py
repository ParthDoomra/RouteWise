"""Route SQLAlchemy Model."""

from sqlalchemy import Column, Date, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import relationship

from app.database import Base


class Route(Base):
    __tablename__ = "routes"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id", ondelete="CASCADE"), nullable=False)
    route_date = Column(Date, nullable=False)
    total_distance_km = Column(Numeric(10, 2), nullable=True)
    total_time_min = Column(Numeric(10, 2), nullable=True)
    status = Column(String(20), default="active", nullable=False)

    # Relationships
    vehicle = relationship("Vehicle", back_populates="routes")
    stops = relationship("RouteStop", back_populates="route", cascade="all, delete-orphan", order_by="RouteStop.sequence_no")
