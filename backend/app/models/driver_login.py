"""Driver Login SQLAlchemy Model (Dedicated login table for Drivers)."""

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import relationship

from app.database import Base


class DriverLogin(Base):
    __tablename__ = "driver_logins"

    id = Column(Integer, primary_key=True, index=True)
    driver_id = Column(Integer, ForeignKey("drivers.id", ondelete="CASCADE"), unique=True, nullable=False)
    phone = Column(String(50), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    driver = relationship("Driver", back_populates="login")
