# --------------------------------------------------
# Imports
# --------------------------------------------------
import uuid
from sqlalchemy import Column, String, Text, Integer, Date, DateTime, ForeignKey, Numeric, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from app.database import Base

# --------------------------------------------------
# NajmReport Model
# Stores accident report data extracted from Najm report file
# --------------------------------------------------
class NajmReport(Base):
    __tablename__ = "najm_reports"

    # Primary key (UUID)
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Foreign key → linked to case
    case_id = Column(
        UUID(as_uuid=True),
        ForeignKey("cases.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )

    # --------------------------------------------------
    # Report File Info
    # --------------------------------------------------
    report_file_path = Column(Text, nullable=False)

    # --------------------------------------------------
    # Accident Information
    # --------------------------------------------------
    accident_id = Column(String(100), nullable=False)
    accident_date = Column(Date)
    accident_time = Column(DateTime)
    accident_coordinates = Column(String(255), nullable=False)
    fault_percentage = Column(Numeric(5, 2))

    # --------------------------------------------------
    # Damage Information
    # --------------------------------------------------
    damage_area = Column(String(100), nullable=False)
    damage_area_ar = Column(String(100), nullable=False)

    # --------------------------------------------------
    # Party (Driver) Information
    # --------------------------------------------------
    party_full_name = Column(String(255), nullable=False)
    license_type = Column(String(100), nullable=False)
    license_expiry_date = Column(Date)
    party_national_id = Column(String(10), nullable=False)
    party_mobile = Column(String(10), nullable=False)
    party_nationality = Column(String(100), nullable=False)

    # --------------------------------------------------
    # Vehicle Information
    # --------------------------------------------------
    vehicle_plate_number = Column(String(50), nullable=False)
    vehicle_brand = Column(String(100), nullable=False)
    vehicle_model = Column(String(100), nullable=False)
    vehicle_year = Column(Integer)
    vehicle_color = Column(String(50), nullable=False)

    # --------------------------------------------------
    # Metadata
    # --------------------------------------------------
    # Record creation timestamp
    created_at = Column(DateTime, nullable=False, server_default=func.current_timestamp())

    # --------------------------------------------------
    # Constraints
    # --------------------------------------------------
    __table_args__ = (

        # Ensure fault percentage is between 0 and 100
        CheckConstraint(
            "fault_percentage >= 0 AND fault_percentage <= 100",
            name="ck_najm_reports_fault_percentage_range",
        ),

          # Ensure vehicle year is within valid range
        CheckConstraint(
            "vehicle_year >= 1900 AND vehicle_year <= EXTRACT(YEAR FROM CURRENT_DATE) + 1",
            name="ck_najm_reports_vehicle_year_range",
        ),
    )