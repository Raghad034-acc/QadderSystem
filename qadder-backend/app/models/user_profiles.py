# --------------------------------------------------
# Imports
# --------------------------------------------------
import uuid
from sqlalchemy import Column, String, Date, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from app.database import Base

# --------------------------------------------------
# UserProfile Model
# Stores personal information linked to an auth account
# --------------------------------------------------
class UserProfile(Base):
    __tablename__ = "user_profiles"

     # Primary key (UUID)
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Foreign key → linked to auth account (one-to-one relationship)
    auth_account_id = Column(
        UUID(as_uuid=True),
        ForeignKey("auth_accounts.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )

    # --------------------------------------------------
    # Personal Information
    # --------------------------------------------------
    national_id = Column(String(10), unique=True, nullable=False)
    first_name = Column(String(100), nullable=False)
    second_name = Column(String(100), nullable=False)
    third_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    nationality = Column(String(100), nullable=False)
    date_of_birth = Column(Date)

    # --------------------------------------------------
    # Metadata
    # --------------------------------------------------
    # Record creation timestamp
    created_at = Column(DateTime, nullable=False, server_default=func.current_timestamp())