"""Manager SQLAlchemy Model (Dedicated login table for Managers)."""

from sqlalchemy import Column, DateTime, Integer, String, func

from app.database import Base


class Manager(Base):
    __tablename__ = "managers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
