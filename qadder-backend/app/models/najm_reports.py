import uuid
from sqlalchemy import Column, String, Text, Integer, Date, DateTime, ForeignKey, Numeric, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from app.database import Base


class NajmReport(Base):
    __tablename__ = "najm_reports"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    case_id = Column(
        UUID(as_uuid=True),
        ForeignKey("cases.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    report_file_path = Column(Text, nullable=False)
    report_number = Column(String(100), nullable=False)
    accident_id = Column(String(100), nullable=False)
    accident_date = Column(Date)
    accident_time = Column(DateTime)
    accident_coordinates = Column(String(255), nullable=False)
    fault_percentage = Column(Numeric(5, 2))
    damage_area = Column(String(100), nullable=False)
    damage_area_ar = Column(String(100), nullable=False)
    party_full_name = Column(String(255), nullable=False)
    license_type = Column(String(100), nullable=False)
    license_expiry_date = Column(Date)
    party_national_id = Column(String(10), nullable=False)
    party_mobile = Column(String(10), nullable=False)
    party_nationality = Column(String(100), nullable=False)
    vehicle_plate_number = Column(String(50), nullable=False)
    vehicle_brand = Column(String(100), nullable=False)
    vehicle_model = Column(String(100), nullable=False)
    vehicle_year = Column(Integer)
    vehicle_color = Column(String(50), nullable=False)
    created_at = Column(DateTime, nullable=False, server_default=func.current_timestamp())

    __table_args__ = (
        CheckConstraint(
            "fault_percentage >= 0 AND fault_percentage <= 100",
            name="ck_najm_reports_fault_percentage_range",
        ),
        CheckConstraint(
            "vehicle_year >= 1900 AND vehicle_year <= EXTRACT(YEAR FROM CURRENT_DATE) + 1",
            name="ck_najm_reports_vehicle_year_range",
        ),
    )