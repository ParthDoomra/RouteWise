"""Order SQLAlchemy Model."""

import uuid
from sqlalchemy import Column, DateTime, ForeignKey, Integer, Numeric, String, func
from sqlalchemy.orm import relationship

from app.database import Base


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    order_code = Column(String(50), unique=True, nullable=False, index=True)  # Human-readable e.g. ORD-8942
    tracking_uuid = Column(String(36), unique=True, nullable=False, index=True, default=lambda: str(uuid.uuid4()))  # UUID4
    customer_name = Column(String(100), nullable=True)
    customer_phone = Column(String(50), nullable=True)
    pickup_address = Column(String(255), nullable=True)
    drop_address = Column(String(255), nullable=True)
    pickup_lat = Column(Numeric(10, 6), nullable=False)
    pickup_lng = Column(Numeric(10, 6), nullable=False)
    drop_lat = Column(Numeric(10, 6), nullable=False)
    drop_lng = Column(Numeric(10, 6), nullable=False)
    weight_kg = Column(Numeric(10, 2), nullable=True)
    time_window_start = Column(DateTime, nullable=True)
    time_window_end = Column(DateTime, nullable=True)
    status = Column(String(20), default="pending", nullable=False)  # pending, assigned, picked_up, in_transit, delivered, delayed
    delay_reason = Column(String(255), nullable=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    vehicle = relationship("Vehicle", back_populates="orders")
    route_stops = relationship("RouteStop", back_populates="order")
    notifications = relationship("Notification", back_populates="order", cascade="all, delete-orphan")
