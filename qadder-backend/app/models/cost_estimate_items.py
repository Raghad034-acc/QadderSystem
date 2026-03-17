import uuid
from sqlalchemy import Column, DateTime, ForeignKey, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from app.database import Base


class CostEstimateItem(Base):
    __tablename__ = "cost_estimate_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    damage_id = Column(
        UUID(as_uuid=True),
        ForeignKey("damages.id", ondelete="CASCADE"),
        nullable=False,
    )
    part_price = Column(Numeric(12, 2), nullable=False)
    labor_cost = Column(Numeric(12, 2), nullable=False)
    subtotal_before_fault = Column(Numeric(12, 2), nullable=False)
    subtotal_after_fault = Column(Numeric(12, 2), nullable=False)
    created_at = Column(DateTime, nullable=False, server_default=func.current_timestamp())