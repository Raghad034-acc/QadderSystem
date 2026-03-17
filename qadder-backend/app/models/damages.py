import uuid
from sqlalchemy import Column, String, Text, Integer, DateTime, ForeignKey, Numeric, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from app.database import Base


class Damage(Base):
    __tablename__ = "damages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    case_id = Column(
        UUID(as_uuid=True),
        ForeignKey("cases.id", ondelete="CASCADE"),
        nullable=False,
    )
    image_id = Column(
        UUID(as_uuid=True),
        ForeignKey("images.id", ondelete="CASCADE"),
        nullable=False,
    )
    damage_no = Column(Integer, nullable=False)
    damage_type_en = Column(String(50))
    damage_type_ar = Column(String(50))
    damage_confidence = Column(Numeric(6, 4))
    severity_en = Column(String(20))
    severity_ar = Column(String(20))
    severity_confidence = Column(Numeric(6, 4))
    part_name_en = Column(String(100))
    part_name_ar = Column(String(100))
    bbox_x1 = Column(Integer)
    bbox_y1 = Column(Integer)
    bbox_x2 = Column(Integer)
    bbox_y2 = Column(Integer)
    crop_path = Column(Text)
    area_ratio = Column(Numeric(10, 6))
    mask_pixels = Column(Integer)
    vote_ratio = Column(Numeric)
    vote_label = Column(String(100))
    created_at = Column(DateTime, server_default=func.current_timestamp())

    __table_args__ = (
        UniqueConstraint("case_id", "damage_no", name="unique_damage_per_case"),
    )