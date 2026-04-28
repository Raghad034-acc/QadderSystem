import uuid
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from app.database import Base

# Vehicle Model
class Vehicle(Base):
    __tablename__ = "vehicles"
    
    # Primary Key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    # Foreign Key
    user_profile_id = Column(
        UUID(as_uuid=True),
        ForeignKey("user_profiles.id", ondelete="CASCADE"),
        nullable=False,
    )
    # Vehicle Information
    brand = Column(String(100), nullable=False)
    model = Column(String(100), nullable=False)
    year = Column(Integer)
    color = Column(String(50))
    plate_number = Column(String(30))
    # Metadata
    created_at = Column(DateTime, nullable=False, server_default=func.current_timestamp())
    
    # Constraints
    __table_args__ = (
        CheckConstraint("year >= 1900 AND year <= 2100", name="ck_vehicles_year_range"),
    )