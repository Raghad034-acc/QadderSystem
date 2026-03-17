import uuid
from sqlalchemy import Column, Integer, DateTime, ForeignKey, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from app.database import Base


class TotalCostEstimate(Base):
    __tablename__ = "total_cost_estimates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    case_id = Column(
        UUID(as_uuid=True),
        ForeignKey("cases.id", ondelete="CASCADE"),
        nullable=False,
    )
    damages_count = Column(Integer, nullable=False)
    total_parts = Column(Numeric(12, 2), nullable=False)
    total_labor = Column(Numeric(12, 2), nullable=False)
    total_estimated_cost = Column(Numeric(12, 2), nullable=False)
    adjusted_cost = Column(Numeric(12, 2), nullable=False)
    created_at = Column(DateTime, nullable=False, server_default=func.current_timestamp())