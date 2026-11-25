"""RouteStop SQLAlchemy Model."""

from typing import Optional
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
    picked_up_at = Column(DateTime(timezone=True), nullable=True)
    delivered_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    route = relationship("Route", back_populates="stops")
    order = relationship("Order", back_populates="route_stops")

    @property
    def order_code(self) -> Optional[str]:
        return self.order.order_code if self.order else None

    @property
    def customer_name(self) -> Optional[str]:
        return self.order.customer_name if self.order else None

    @property
    def customer_phone(self) -> Optional[str]:
        return self.order.customer_phone if self.order else None

    @property
    def address(self) -> Optional[str]:
        return self.order.drop_address if self.order else None

    @property
    def weight_kg(self) -> Optional[float]:
        return float(self.order.weight_kg) if (self.order and self.order.weight_kg is not None) else None
