"""Vehicle SQLAlchemy Model."""

from sqlalchemy import Column, Date, Integer, Numeric, String
from sqlalchemy.orm import relationship

from app.database import Base


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    plate_no = Column(String(20), unique=True, nullable=False, index=True)
    model = Column(String(100), nullable=True)
    capacity_kg = Column(Numeric(10, 2), nullable=False)
    status = Column(String(20), default="available", nullable=False)  # available, on_route, maintenance, delayed, standby
    current_lat = Column(Numeric(10, 6), nullable=True)
    current_lng = Column(Numeric(10, 6), nullable=True)
    mileage_km = Column(Numeric(10, 2), default=0.0, nullable=False)
    last_service_date = Column(Date, nullable=True)

    # Relationships
    drivers = relationship("Driver", back_populates="vehicle")
    orders = relationship("Order", back_populates="vehicle")
    routes = relationship("Route", back_populates="vehicle", cascade="all, delete-orphan")
    maintenance_tickets = relationship("MaintenanceTicket", back_populates="vehicle", cascade="all, delete-orphan")
