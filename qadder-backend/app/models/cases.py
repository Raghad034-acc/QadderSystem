# --------------------------------------------------
# Imports
# --------------------------------------------------
import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.database import Base


# --------------------------------------------------
# Case Model
# Represents a damage/report case linked to user and vehicle
# --------------------------------------------------
class Case(Base):
    __tablename__ = "cases"

    # Primary key (UUID)
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Unique case number (used for tracking/reporting)
    case_number = Column(String(50), unique=True, nullable=False)

    # Foreign key → linked to user profile
    user_profile_id = Column(
        UUID(as_uuid=True),
        ForeignKey("user_profiles.id", ondelete="CASCADE"),
        nullable=False,
    )

    # Foreign key → linked to vehicle
    vehicle_id = Column(
        UUID(as_uuid=True),
        ForeignKey("vehicles.id", ondelete="CASCADE"),
        nullable=False,
    )

    # Case status (e.g., draft, completed, rejected)
    status = Column(String(30), nullable=False, server_default="draft")

     # Record creation timestamp
    created_at = Column(DateTime, nullable=False, server_default=func.current_timestamp())
    
    # Last update timestamp (auto-updated on change)
    updated_at = Column(
        DateTime,
        nullable=False,
        server_default=func.current_timestamp(),
        onupdate=func.current_timestamp(),
    )