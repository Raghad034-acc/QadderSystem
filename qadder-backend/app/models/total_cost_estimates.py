import uuid
from sqlalchemy import Column, Integer, DateTime, ForeignKey, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from app.database import Base

# Total Cost Estimate Model (Step7 Summary)
class TotalCostEstimate(Base):
    __tablename__ = "total_cost_estimates"
    
    # Primary Key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Foreign Key
    case_id = Column(
        UUID(as_uuid=True),
        ForeignKey("cases.id", ondelete="CASCADE"),
        nullable=False,
    )
    # Summary Data
    damages_count = Column(Integer, nullable=False)
    # Cost Totals
    total_parts = Column(Numeric(12, 2), nullable=False)
    total_labor = Column(Numeric(12, 2), nullable=False)
    total_estimated_cost = Column(Numeric(12, 2), nullable=False)
    # Adjusted Cost
    adjusted_cost = Column(Numeric(12, 2), nullable=False)
    # Metadata
    created_at = Column(DateTime, nullable=False, server_default=func.current_timestamp())