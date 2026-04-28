import uuid
from sqlalchemy import Column, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from app.database import Base

# Qadder Report Model (Step8 Final Report)
class QadderReport(Base):
    __tablename__ = "qadder_reports"
    
    # Primary Key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    # Foreign Key
    case_id = Column(
        UUID(as_uuid=True),
        ForeignKey("cases.id", ondelete="CASCADE"),
        nullable=False,
    )
    # Report Data
    report_path = Column(Text, nullable=False)
    # Metadata
    created_at = Column(DateTime, nullable=False, server_default=func.current_timestamp())