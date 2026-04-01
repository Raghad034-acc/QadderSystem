"""
Step 1 API — Upload Najm Report

Flow
----
1. Receive PDF upload
2. Validate user & vehicle
3. Create new case
4. Save PDF file
5. Extract Najm data
6. Prevent duplicate reports
7. Compare Najm data with system data
8. Validate required fields
9. Save Najm report
10. Update case status
11. Return structured response
"""

from __future__ import annotations
import re
# Standard library
import os
import shutil
from pathlib import Path
from uuid import UUID, uuid4

# FastAPI
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile

# Database
from sqlalchemy.orm import Session

# Local imports
from app.database import get_db
from app.models.cases import Case
from app.models.najm_reports import NajmReport
from app.models.user_profiles import UserProfile
from app.models.vehicles import Vehicle
from app.models.auth_accounts import AuthAccount
from app.services.step1_najm import extract_najm_report



# ---------------------------------------------------
# Router
# ---------------------------------------------------
router = APIRouter(prefix="/step1", tags=["Step1 Najm"])


# ---------------------------------------------------
# Upload directory
# ---------------------------------------------------
UPLOAD_DIR = Path("uploads/najm")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


# ---------------------------------------------------
# Generate internal Qadder case number
# ---------------------------------------------------
def generate_case_number() -> str:
    return f"CASE-{uuid4().hex[:10].upper()}"


# ---------------------------------------------------
# Upload Najm Report Endpoint
# ---------------------------------------------------
@router.post("/upload-najm-report")
def upload_najm_report(
    user_profile_id: UUID = Form(...),
    vehicle_id: UUID = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """
    Upload Najm PDF and extract accident data.
    Creates a new case and saves the Najm report.
    """

    # ---------------------------------------------------
    # Validate file
    # ---------------------------------------------------
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file name provided.")

    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed.")

    # ---------------------------------------------------
    # Validate user and account
    # ---------------------------------------------------
    user = db.query(UserProfile).filter(UserProfile.id == user_profile_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User profile not found.")
    auth_account = (db.query(AuthAccount).filter(AuthAccount.id == user.auth_account_id).first())
    if not auth_account:
        raise HTTPException(status_code=404, detail="Auth account not found.")
    # ---------------------------------------------------
    # Validate vehicle ownership
    # ---------------------------------------------------
    vehicle = (
        db.query(Vehicle)
        .filter(
            Vehicle.id == vehicle_id,
            Vehicle.user_profile_id == user_profile_id,
        )
        .first()
    )

    if not vehicle:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found or does not belong to this user.",
        )

    # ---------------------------------------------------
    # Create a new case
    # ---------------------------------------------------
    case = Case(
        case_number=generate_case_number(),
        user_profile_id=user_profile_id,
        vehicle_id=vehicle_id,
        status="draft",
    )
    db.add(case)
    db.flush()

    saved_pdf_path = UPLOAD_DIR / f"{case.id}.pdf"

    try:
        # ---------------------------------------------------
        # Save uploaded PDF
        # ---------------------------------------------------
        with saved_pdf_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # ---------------------------------------------------
        # Extract Najm report fields
        # ---------------------------------------------------
        extraction_result = extract_najm_report(
            pdf_path=str(saved_pdf_path),
            report_file_path=str(saved_pdf_path),
        )

        najm_record = extraction_result["najm_record"]
        missing_fields = extraction_result["missing_fields"]

        # ---------------------------------------------------
        # Prevent duplicate Najm report upload
        # ---------------------------------------------------
        existing_najm_report = (
            db.query(NajmReport)
            .filter(NajmReport.accident_id == najm_record["accident_id"])
            .first()
        )

        if existing_najm_report:
            db.rollback()

            if saved_pdf_path.exists():
                os.remove(saved_pdf_path)

            raise HTTPException(
                status_code=409,
                detail="This Najm report has already been uploaded before.",
            )

        # ---------------------------------------------------
        # Compare Najm data with system data
        # ---------------------------------------------------
        comparison = {
            "national_id_match": (
                najm_record["party_national_id"] == user.national_id
            ),
            "mobile_match": (
                (najm_record["party_mobile"] or "").strip()
                == (auth_account.phone_number or "").strip()
            ),
            "nationality_match": (
                (najm_record["party_nationality"] or "").strip().lower()
                == (user.nationality or "").strip().lower()
            ),
            "vehicle_brand_match": (
                (najm_record["vehicle_brand"] or "").strip().lower()
                == (vehicle.brand or "").strip().lower()
            ),
            "vehicle_model_match": (
                (najm_record["vehicle_model"] or "").strip().lower()
                == (vehicle.model or "").strip().lower()
            ),
            "vehicle_year_match": (
                najm_record["vehicle_year"] == vehicle.year
            ),
            "vehicle_color_match": (
                (najm_record["vehicle_color"] or "").strip().lower()
                == (vehicle.color or "").strip().lower()
            ),
        }

        # ---------------------------------------------------
        # Validate required extracted fields
        # ---------------------------------------------------
        if missing_fields:
            db.rollback()

            if saved_pdf_path.exists():
                os.remove(saved_pdf_path)

            raise HTTPException(
                status_code=400,
                detail={
                    "message": "Required Najm fields are missing.",
                    "missing_fields": missing_fields,
                    "debug": extraction_result["debug"],
                    "raw_record": extraction_result["raw_record"],
                },
            )

        # ---------------------------------------------------
        # Save Najm report
        # ---------------------------------------------------
        najm_report = NajmReport(
            case_id=case.id,
            report_file_path=najm_record["report_file_path"],
            accident_id=najm_record["accident_id"],
            accident_date=najm_record["accident_date"],
            accident_time=najm_record["accident_time"],
            accident_coordinates=najm_record["accident_coordinates"],
            fault_percentage=najm_record["fault_percentage"],
            damage_area=najm_record["damage_area"],
            damage_area_ar=najm_record["damage_area_ar"],
            party_full_name=najm_record["party_full_name"],
            license_type=najm_record["license_type"],
            license_expiry_date=najm_record["license_expiry_date"],
            party_national_id=najm_record["party_national_id"],
            party_mobile=najm_record["party_mobile"],
            party_nationality=najm_record["party_nationality"],
            vehicle_plate_number=najm_record["vehicle_plate_number"],
            vehicle_brand=najm_record["vehicle_brand"],
            vehicle_model=najm_record["vehicle_model"],
            vehicle_year=najm_record["vehicle_year"],
            vehicle_color=najm_record["vehicle_color"],
        )

        db.add(najm_report)

        # ---------------------------------------------------
        # Update case status
        # ---------------------------------------------------
        case.status = "step1_completed"

        db.commit()
        db.refresh(case)
        db.refresh(najm_report)

        # ---------------------------------------------------
        # Success response
        # ---------------------------------------------------
        return {
            "message": "Najm report uploaded and processed successfully.",
            "case_id": str(case.id),
            "case_number": case.case_number,
            "status": case.status,
            "najm_report": {
                "accident_id": najm_report.accident_id,
                "accident_date": (
                    str(najm_report.accident_date)
                    if najm_report.accident_date
                    else None
                ),
                "accident_time": (
                    najm_report.accident_time.isoformat()
                    if najm_report.accident_time
                    else None
                ),
                "accident_coordinates": najm_report.accident_coordinates,
                "fault_percentage": (
                    float(najm_report.fault_percentage)
                    if najm_report.fault_percentage is not None
                    else None
                ),
                "damage_area": najm_report.damage_area,
                "damage_area_ar": najm_report.damage_area_ar,
                "party_full_name": najm_report.party_full_name,
                "license_type": najm_report.license_type,
                "license_expiry_date": (
                    str(najm_report.license_expiry_date)
                    if najm_report.license_expiry_date
                    else None
                ),
                "party_national_id": najm_report.party_national_id,
                "party_mobile": najm_report.party_mobile,
                "party_nationality": najm_report.party_nationality,
                "vehicle_plate_number": najm_report.vehicle_plate_number,
                "vehicle_brand": najm_report.vehicle_brand,
                "vehicle_model": najm_report.vehicle_model,
                "vehicle_year": najm_report.vehicle_year,
                "vehicle_color": najm_report.vehicle_color,
            },
            "validation": comparison,
        }

    except HTTPException:
        raise

    except Exception as exc:
        db.rollback()

        if saved_pdf_path.exists():
            os.remove(saved_pdf_path)

        raise HTTPException(
            status_code=500,
            detail=f"Step1 processing failed: {str(exc)}",
        )