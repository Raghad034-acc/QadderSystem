# --------------------------------------------------
# Imports
# --------------------------------------------------
import uuid
from sqlalchemy import Column, DateTime, ForeignKey, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.database import Base

# Cost Estimate Item Model (Step7 Pricing)
class CostEstimateItem(Base):
    __tablename__ = "cost_estimate_items"

    # Primary Key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    # Foreign Key
    damage_id = Column(
        UUID(as_uuid=True),
        ForeignKey("damages.id", ondelete="CASCADE"),
        nullable=False,
    )
    # Pricing Details
    part_price = Column(Numeric(12, 2), nullable=False)
    labor_cost = Column(Numeric(12, 2), nullable=False)
    # Cost Calculations
    subtotal_after_fault = Column(Numeric(12, 2), nullable=False)
    # Metadata
    created_at = Column(DateTime, nullable=False, server_default=func.current_timestamp())