from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from sqlalchemy.orm import Session
import os
import uuid
import shutil

from app.database import get_db
from app.models import Case, NajmReport, Image
from app.services.step2_damage_location import verify_damage_location


router = APIRouter(prefix="/step2", tags=["Step2 Image"])


UPLOAD_DIR = "uploads/step2"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/upload-image")
def upload_step2_image(
    case_id: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """
    Step 2:
    Upload vehicle image and verify damage location
    """

    # ---------------------------------------------------
    # Check case exists
    # ---------------------------------------------------
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(
            status_code=404,
            detail="Case not found",
        )

    # ---------------------------------------------------
    # Check Step1 exists
    # ---------------------------------------------------
    najm_report = (
        db.query(NajmReport)
        .filter(NajmReport.case_id == case_id)
        .first()
    )

    if not najm_report:
        raise HTTPException(
            status_code=400,
            detail="Step1 must be completed first",
        )

    # ---------------------------------------------------
    # Check image already exists
    # ---------------------------------------------------
    existing_image = (
        db.query(Image)
        .filter(Image.case_id == case_id)
        .first()
    )

    if existing_image:
        raise HTTPException(
            status_code=409,
            detail="Step2 image already uploaded for this case",
        )

    # ---------------------------------------------------
    # Validate file type
    # ---------------------------------------------------
    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="No file name provided",
        )

    allowed_extensions = {".jpg", ".jpeg", ".png", ".webp"}
    file_ext = os.path.splitext(file.filename)[1].lower()

    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail="Only image files are allowed: jpg, jpeg, png, webp",
        )

    # ---------------------------------------------------
    # Save uploaded image
    # ---------------------------------------------------
    image_uuid = str(uuid.uuid4())
    saved_image_path = os.path.join(UPLOAD_DIR, f"{image_uuid}{file_ext}")

    try:
        with open(saved_image_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # ---------------------------------------------------
        # Run Step2 verification service
        # ---------------------------------------------------
        verification_result = verify_damage_location(
            image_path=saved_image_path,
            najm_damage_area=najm_report.damage_area,
        )

                # ---------------------------------------------------
        # Save Step2 result in images table
        # ---------------------------------------------------
        image_record = Image(
            case_id=case.id,
            original_image_path=saved_image_path,
            accepted_side=verification_result["accepted_side"],
            najm_damage_area=verification_result["najm_damage_area"],
            api_damage_area=verification_result["api_damage_area"],
            api_confidence=verification_result["api_confidence"],
            part_damage_area=verification_result["part_damage_area"],
            accepted_source=verification_result["accepted_source"],
            rejection_reason=verification_result["rejection_reason"],
            detected_parts=",".join(verification_result["detected_parts"])
            if verification_result["detected_parts"]
            else None,
            is_accepted=(verification_result["status"] == "accepted"),
        )

        db.add(image_record)

        # ---------------------------------------------------
        # Update case status
        # ---------------------------------------------------
        if verification_result["status"] == "accepted":
            case.status = "step2_completed"
        else:
            case.status = "step2_rejected"

        db.commit()
        db.refresh(case)
        db.refresh(image_record)

        # ---------------------------------------------------
        # Success / rejection response
        # ---------------------------------------------------
        return {
            "message": "Step2 completed successfully",
            "case_id": str(case.id),
            "status": case.status,
            "step2_result": {
                "image_id": str(image_record.id),
                "is_accepted": image_record.is_accepted,
                "accepted_side": image_record.accepted_side,
                "najm_damage_area": image_record.najm_damage_area,
                "api_damage_area": image_record.api_damage_area,
                "api_confidence": (
                    float(image_record.api_confidence)
                    if image_record.api_confidence is not None
                    else None
                ),
                "part_damage_area": image_record.part_damage_area,
                "accepted_source": image_record.accepted_source,
                "rejection_reason": image_record.rejection_reason,
                "detected_parts": verification_result["detected_parts"],
                "errors": verification_result["errors"],
                "original_image_path": image_record.original_image_path,
            },
        }

    except HTTPException:
        raise

    except Exception as exc:
        db.rollback()

        if os.path.exists(saved_image_path):
            os.remove(saved_image_path)

        raise HTTPException(
            status_code=500,
            detail=f"Step2 processing failed: {str(exc)}",
        )