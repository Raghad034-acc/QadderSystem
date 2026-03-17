import uuid
from sqlalchemy import Column, String, Text, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from app.database import Base


class AuthAccount(Base):
    __tablename__ = "auth_accounts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True)
    phone_number = Column(String(10), unique=True)
    password_hash = Column(Text, nullable=False)
    account_status = Column(String(20), nullable=False, server_default="active")
    created_at = Column(DateTime, nullable=False, server_default=func.current_timestamp())