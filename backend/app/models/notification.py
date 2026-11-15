"""Notification SQLAlchemy Model."""

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import relationship

from app.database import Base


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=True)
    message = Column(Text, nullable=False)
    channel = Column(String(20), default="sms", nullable=False)  # sms, email
    is_ai_generated = Column(Boolean, default=False, nullable=False)
    sent_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    order = relationship("Order", back_populates="notifications")
