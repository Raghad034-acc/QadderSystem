from __future__ import annotations

from fastapi import APIRouter, Depends, Form, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Case, Image
from app.services.step3_severity import predict_step3_severity


router = APIRouter(prefix="/step3", tags=["Step3 Severity"])


@router.post("/predict-severity")
def run_step3_severity(
    case_id: str = Form(...),
    db: Session = Depends(get_db),
):
    """
    Step 3:
    Take accepted Step2 image and run severity prediction using HF Space API.
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
    # Check Step2 exists
    # ---------------------------------------------------
    image_record = (
        db.query(Image)
        .filter(Image.case_id == case_id)
        .first()
    )

    if not image_record:
        raise HTTPException(
            status_code=400,
            detail="Step2 must be completed first",
        )

    # ---------------------------------------------------
    # Step2 must be accepted
    # ---------------------------------------------------
    if image_record.is_accepted is not True:
        raise HTTPException(
            status_code=400,
            detail="Step2 image was rejected. Cannot continue to Step3.",
        )

    if not image_record.original_image_path:
        raise HTTPException(
            status_code=400,
            detail="Accepted Step2 image path is missing.",
        )

    try:
        # ---------------------------------------------------
        # Run Step3 severity API
        # ---------------------------------------------------
        step3_result = predict_step3_severity(
            image_path=image_record.original_image_path
        )

        severity_data = step3_result.get("prediction", {})
        severity_info = severity_data.get("severity", {})

        severity_en = severity_info.get("en")
        severity_ar = severity_info.get("ar")
        severity_confidence = severity_data.get("confidence")
        severity_status = step3_result.get("status")

        # ---------------------------------------------------
        # Save Step3 result in images table
        # IMPORTANT:
        # These fields require actual DB columns to exist.
        # If DB not migrated yet, comment these 4 lines temporarily.
        # ---------------------------------------------------
        image_record.severity_en = severity_en
        image_record.severity_ar = severity_ar
        image_record.severity_confidence = severity_confidence
        image_record.severity_status = severity_status

        # ---------------------------------------------------
        # Update case status
        # ---------------------------------------------------
        if severity_status == "rejected_high_severity":
            case.status = "step3_rejected_high_severity"
        else:
            case.status = "step3_completed"

        db.commit()
        db.refresh(case)
        db.refresh(image_record)

        return {
            "message": "Step3 completed successfully",
            "case_id": str(case.id),
            "status": case.status,
            "step3_result": {
                "severity_status": severity_status,
                "severity_en": severity_en,
                "severity_ar": severity_ar,
                "severity_confidence": float(severity_confidence) if severity_confidence is not None else None,
                "raw_label": severity_data.get("raw_label"),
                "message": step3_result.get("message"),
                "errors": step3_result.get("errors", []),
                "original_image_path": image_record.original_image_path,
            },
        }

    except HTTPException:
        raise

    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Step3 processing failed: {str(exc)}",
        )