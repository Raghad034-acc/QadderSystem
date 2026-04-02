from __future__ import annotations

import base64
import os
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, Form, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db

# عدلي هذا السطر حسب طريقة الاستيراد عندكم إذا لزم
from app.models import Case, Image, Damage

from app.services.step4_damage_type import predict_step4_damage_type


router = APIRouter(prefix="/step4", tags=["Step4 Damage Type"])


STEP4_DIR = Path("uploads/step4")
STEP4_DIR.mkdir(parents=True, exist_ok=True)


def save_base64_image(base64_string: str, output_path: Path) -> str:
    image_bytes = base64.b64decode(base64_string)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("wb") as f:
        f.write(image_bytes)
    return str(output_path)


@router.post("/detect-damage-type")
def run_step4_damage_type(
    case_id: str = Form(...),
    db: Session = Depends(get_db),
):
    """
    Step 4:
    Take accepted Step2 image and run damage type detection using HF Space API.
    Save annotated image + crop images + damages rows.
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
            detail="Step2 image was rejected. Cannot continue to Step4.",
        )

    if not image_record.original_image_path:
        raise HTTPException(
            status_code=400,
            detail="Accepted Step2 image path is missing.",
        )

    # ---------------------------------------------------
    # Prevent duplicate Step4 for same case
    # ---------------------------------------------------
    existing_damage = (
        db.query(Damage)
        .filter(Damage.case_id == case_id)
        .first()
    )

    if existing_damage:
        raise HTTPException(
            status_code=409,
            detail="Step4 damage detections already exist for this case.",
        )

    try:
        # ---------------------------------------------------
        # Run Step4 API
        # ---------------------------------------------------
        step4_result = predict_step4_damage_type(
            image_path=image_record.original_image_path
        )

        step4_status = step4_result.get("status")
        step4_message = step4_result.get("message")
        step4_errors = step4_result.get("errors", [])
        damages = step4_result.get("damages", [])
        outputs = step4_result.get("outputs", {})

        case_dir = STEP4_DIR / str(case.id)
        crops_dir = case_dir / "crops"
        case_dir.mkdir(parents=True, exist_ok=True)
        crops_dir.mkdir(parents=True, exist_ok=True)

        # ---------------------------------------------------
        # Save annotated image if exists
        # ---------------------------------------------------
        annotated_image_path = None
        annotated_b64 = outputs.get("annotated_image_base64")
        if annotated_b64:
            annotated_path = case_dir / f"{case.id}_step4_annotated.jpg"
            annotated_image_path = save_base64_image(annotated_b64, annotated_path)
            image_record.annotated_image_path = annotated_image_path

        # ---------------------------------------------------
        # If no damages found
        # ---------------------------------------------------
        if step4_status == "no_damage_detected" or len(damages) == 0:
            case.status = "step4_no_damage_detected"

            db.commit()
            db.refresh(case)
            db.refresh(image_record)

            return {
                "message": "Step4 completed successfully",
                "case_id": str(case.id),
                "status": case.status,
                "step4_result": {
                    "step4_status": step4_status,
                    "message": step4_message,
                    "errors": step4_errors,
                    "annotated_image_path": annotated_image_path,
                    "damages_count": 0,
                    "damages": [],
                },
            }

        # ---------------------------------------------------
        # Save crops + insert damages
        # ---------------------------------------------------
        created_damages = []

        for i, item in enumerate(damages, start=1):
            crop_info = item.get("crop", {})
            crop_b64 = crop_info.get("image_base64")

            crop_path = None
            if crop_b64:
                crop_file_path = crops_dir / f"damage_{i:03d}.jpg"
                crop_path = save_base64_image(crop_b64, crop_file_path)

            type_info = item.get("type", {})
            bbox = item.get("bbox_xyxy", [None, None, None, None])

            damage_row = Damage(
                case_id=case.id,
                image_id=image_record.id,
                damage_no=i,
                damage_type_en=type_info.get("en_normalized") or type_info.get("en"),
                damage_type_ar=type_info.get("ar"),
                damage_confidence=item.get("confidence"),
                bbox_x1=bbox[0],
                bbox_y1=bbox[1],
                bbox_x2=bbox[2],
                bbox_y2=bbox[3],
                crop_path=crop_path,
                area_ratio=item.get("area_ratio"),
                mask_pixels=item.get("mask_pixels"),
            )

            db.add(damage_row)
            created_damages.append({
                "damage_no": i,
                "damage_type_en": damage_row.damage_type_en,
                "damage_type_ar": damage_row.damage_type_ar,
                "damage_confidence": float(damage_row.damage_confidence) if damage_row.damage_confidence is not None else None,
                "bbox_xyxy": bbox,
                "crop_path": crop_path,
                "area_ratio": float(damage_row.area_ratio) if damage_row.area_ratio is not None else None,
                "mask_pixels": damage_row.mask_pixels,
            })

        # ---------------------------------------------------
        # Update case status
        # ---------------------------------------------------
        case.status = "step4_completed"

        db.commit()
        db.refresh(case)
        db.refresh(image_record)

        return {
            "message": "Step4 completed successfully",
            "case_id": str(case.id),
            "status": case.status,
            "step4_result": {
                "step4_status": step4_status,
                "message": step4_message,
                "errors": step4_errors,
                "annotated_image_path": annotated_image_path,
                "damages_count": len(created_damages),
                "damages": created_damages,
            },
        }

    except HTTPException:
        raise

    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Step4 processing failed: {str(exc)}",
        )