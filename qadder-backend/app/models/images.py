import uuid
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Numeric, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from app.database import Base


class Image(Base):
    __tablename__ = "images"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    case_id = Column(
        UUID(as_uuid=True),
        ForeignKey("cases.id", ondelete="CASCADE"),
        nullable=False,
    )
    original_image_path = Column(Text, nullable=False)
    annotated_image_path = Column(Text)
    parts_mask_path = Column(Text)
    parts_overlay_path = Column(Text)
    damage_parts_annotated_path = Column(Text)
    accepted_side = Column(String(30))
    najm_damage_area = Column(String(30))
    api_damage_area = Column(String(30))
    api_confidence = Column(Numeric(6, 4))
    #hadeel added
    part_damage_area = Column(String(30))
    accepted_source = Column(String(30))
    rejection_reason = Column(Text)
    detected_parts = Column(Text)
    ##hadeel added

    # Step3 additions By Raghad
    severity_en = Column(String(20))
    severity_ar = Column(String(20))
    severity_confidence = Column(Numeric(6, 4))
    severity_status = Column(String(40))
    # Step3 additions By Raghad
    
    is_accepted = Column(Boolean)
    created_at = Column(DateTime, server_default=func.current_timestamp())