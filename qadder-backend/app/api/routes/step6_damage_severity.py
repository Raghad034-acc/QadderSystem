from __future__ import annotations

import json

from fastapi import APIRouter, Depends, Form, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Case, Image, Damage
from app.services.step6_damage_severity import predict_step6_damage_severity


router = APIRouter(prefix="/step6", tags=["Step6 Damage Severity"])


@router.post("/predict-damage-severity")
def run_step6_damage_severity(
    case_id: str = Form(...),
    db: Session = Depends(get_db),
):
    """
    Step 6:
    Predict severity for each damage crop created in Step4.
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
            detail="Step2 image was rejected. Cannot continue to Step6.",
        )

    # ---------------------------------------------------
    # Check Step4 damages exist
    # ---------------------------------------------------
    existing_damages = (
        db.query(Damage)
        .filter(Damage.case_id == case_id)
        .order_by(Damage.damage_no.asc())
        .all()
    )

    if not existing_damages:
        raise HTTPException(
            status_code=400,
            detail="Step4 must be completed first",
        )

    try:
        updated_damages = []

        predicted_count = 0
        failed_count = 0

        for damage_row in existing_damages:
            if not damage_row.crop_path:
                damage_row.severity_status = "missing_crop"
                failed_count += 1

                updated_damages.append({
                    "damage_no": damage_row.damage_no,
                    "severity_en": damage_row.severity_en,
                    "severity_ar": damage_row.severity_ar,
                    "severity_confidence": (
                        float(damage_row.severity_confidence)
                        if damage_row.severity_confidence is not None
                        else None
                    ),
                    "severity_status": damage_row.severity_status,
                    "severity_raw_label": damage_row.severity_raw_label,
                    "severity_policy_status": damage_row.severity_policy_status,
                    "severity_probabilities": damage_row.severity_probabilities,
                })
                continue

            try:
                result = predict_step6_damage_severity(
                    crop_path=damage_row.crop_path
                )

                prediction = result.get("prediction", {})
                severity_info = prediction.get("severity", {})
                policy_info = prediction.get("policy", {})

                damage_row.severity_en = severity_info.get("en")
                damage_row.severity_ar = severity_info.get("ar")
                damage_row.severity_confidence = prediction.get("confidence")
                damage_row.severity_raw_label = prediction.get("raw_label")
                # Policy logic (مثل الكود الأصلي)
                severity = damage_row.severity_en

                if severity in ["low", "medium"]:
                  damage_row.severity_policy_status = "allowed"
                elif severity == "high":
                  damage_row.severity_policy_status = "rejected"
                else:
                  damage_row.severity_policy_status = None

                probabilities = prediction.get("probabilities")
                if probabilities is not None:
                    damage_row.severity_probabilities = json.dumps(
                        probabilities,
                        ensure_ascii=False
                    )
                else:
                    damage_row.severity_probabilities = None

                api_status = str(result.get("status", "")).lower()
                if api_status in ("predicted", "extracted", "success", "connected"):
                    damage_row.severity_status = "predicted"
                    predicted_count += 1
                else:
                    damage_row.severity_status = "failed"
                    failed_count += 1

            except Exception:
                damage_row.severity_status = "failed"
                failed_count += 1

            updated_damages.append({
                "damage_no": damage_row.damage_no,
                "severity_en": damage_row.severity_en,
                "severity_ar": damage_row.severity_ar,
                "severity_confidence": (
                    float(damage_row.severity_confidence)
                    if damage_row.severity_confidence is not None
                    else None
                ),
                "severity_status": damage_row.severity_status,
                "severity_raw_label": damage_row.severity_raw_label,
                "severity_policy_status": damage_row.severity_policy_status,
                "severity_probabilities": damage_row.severity_probabilities,
            })

        case.status = "step6_completed"

        db.commit()
        db.refresh(case)

        return {
            "message": "Step6 completed successfully",
            "case_id": str(case.id),
            "status": case.status,
            "step6_result": {
                "damages_count": len(updated_damages),
                "predicted_count": predicted_count,
                "failed_count": failed_count,
                "damages": updated_damages,
            },
        }

    except HTTPException:
        raise

    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Step6 processing failed: {str(exc)}",
        )