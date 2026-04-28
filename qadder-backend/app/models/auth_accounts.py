# --------------------------------------------------
# Imports
# --------------------------------------------------
import uuid
from sqlalchemy import Column, String, Text, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.database import Base

# --------------------------------------------------
# AuthAccount Model
# Represents user authentication account data
# --------------------------------------------------
class AuthAccount(Base):
    __tablename__ = "auth_accounts"
    
     # Primary key (UUID)
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

     # User login credentials
    email = Column(String(255), unique=True)
    phone_number = Column(String(10), unique=True)
    password_hash = Column(Text, nullable=False)

    # Account status (e.g., active, inactive)
    account_status = Column(String(20), nullable=False, server_default="active")
    
    # Record creation timestamp
    created_at = Column(DateTime, nullable=False, server_default=func.current_timestamp())