"""Driver SQLAlchemy Model."""

from sqlalchemy import Column, ForeignKey, Integer, String, Time
from sqlalchemy.orm import relationship

from app.database import Base


class Driver(Base):
    __tablename__ = "drivers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    phone = Column(String(50), unique=True, nullable=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id", ondelete="SET NULL"), nullable=True)
    shift_start = Column(Time, nullable=True)
    shift_end = Column(Time, nullable=True)

    # Relationships
    vehicle = relationship("Vehicle", back_populates="drivers")
    login = relationship("DriverLogin", back_populates="driver", uselist=False, cascade="all, delete-orphan")
