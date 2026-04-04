import uuid
from sqlalchemy import Column, String, Text, Integer, DateTime, ForeignKey, Numeric, UniqueConstraint, Boolean
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
    # Step 5 add by shroug
    part_status = Column(String(40))
    part_reason = Column(Text)
    part_method = Column(String(120))
    part_post_rules = Column(Text)
    allowed_groups = Column(Text, nullable=True)
    unsupported_by_parts_model = Column(Boolean, default=False)
    
    # Step 6 add by shroug
    severity_status = Column(String(40), nullable=True)
    severity_raw_label = Column(String(50), nullable=True)
    severity_policy_status = Column(String(20), nullable=True)
    severity_probabilities = Column(Text, nullable=True)

    __table_args__ = (
        UniqueConstraint("case_id", "damage_no", name="unique_damage_per_case"),
    )


  