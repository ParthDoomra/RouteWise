"""RouteStop SQLAlchemy Model."""

from sqlalchemy import Column, DateTime, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import relationship

from app.database import Base


class RouteStop(Base):
    __tablename__ = "route_stops"

    id = Column(Integer, primary_key=True, index=True)
    route_id = Column(Integer, ForeignKey("routes.id", ondelete="CASCADE"), nullable=False)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="SET NULL"), nullable=True)
    sequence_no = Column(Integer, nullable=False)
    stop_lat = Column(Numeric(10, 6), nullable=True)
    stop_lng = Column(Numeric(10, 6), nullable=True)
    eta = Column(DateTime, nullable=True)
    actual_arrival = Column(DateTime, nullable=True)
    delay_reason = Column(String(255), nullable=True)
    status = Column(String(20), default="pending", nullable=False)

    # Relationships
    route = relationship("Route", back_populates="stops")
    order = relationship("Order", back_populates="route_stops")
