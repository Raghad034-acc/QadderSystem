from __future__ import annotations

import os
import shutil
from pathlib import Path

import cv2

from fastapi import APIRouter, Depends, Form, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Case, Image, Damage
from app.services.step5_damage_part import (
    predict_step5_damage_part,
    detect_part_in_bbox,
)

# Step5 router for damage part detection
# This endpoint:
# 1. Calls HuggingFace segmentation model
# 2. Applies Step5 logic on Step4 bounding boxes
# 3. Saves results to database
# 4. Generates annotated image
router = APIRouter(prefix="/step5", tags=["Step5 Damage Part"])


# Directory used to store Step5 outputs
# Includes:
# - segmentation mask
# - overlay image
# - annotated damage parts image
STEP5_DIR = Path("uploads/step5")
STEP5_DIR.mkdir(parents=True, exist_ok=True)


@router.post(
    "/detect-damage-part",
    summary="Step 5 - Detect Damage Parts",
    description="Step 5: Detect damaged vehicle parts using segmentation mask and Step4 bounding boxes"
)
# Step5 main execution
# Flow:
# 1. Validate case and image
# 2. Call HuggingFace segmentation
# 3. Apply Step5 logic per damage bbox
# 4. Save results to DB
# 5. Generate annotated image
def run_step5_damage_part(
    case_id: str = Form(...),
    db: Session = Depends(get_db),
):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    # Get Step2 accepted image
    image_record = db.query(Image).filter(Image.case_id == case_id).first()
    if not image_record:
        raise HTTPException(status_code=400, detail="Step2 must be completed first")

    if image_record.is_accepted is not True:
        raise HTTPException(
            status_code=400,
            detail="Step2 image was rejected. Cannot continue to Step5.",
        )

    if not image_record.original_image_path:
        raise HTTPException(
            status_code=400,
            detail="Accepted Step2 image path is missing.",
        )
    # Get Step4 damages (bounding boxes)
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
    # Call HuggingFace Step5 segmentation model
    try:
        step5_result = predict_step5_damage_part(
            image_path=image_record.original_image_path
        )
        
        # Create directory for current case Step5 outputs
        case_dir = STEP5_DIR / str(case.id)
        case_dir.mkdir(parents=True, exist_ok=True)

        outputs = step5_result.get("outputs", {})
        detected_image_temp = outputs.get("detected_image_path")
        segment_image_temp = outputs.get("segment_image_path")
        
        # Save detected overlay image from HuggingFace
        detected_image_saved = None
        segment_image_saved = None

        if detected_image_temp and os.path.exists(detected_image_temp):
            detected_dest = case_dir / f"{case.id}_step5_detected.png"
            shutil.copy(detected_image_temp, detected_dest)
            detected_image_saved = str(detected_dest)

        if segment_image_temp and os.path.exists(segment_image_temp):
            segment_dest = case_dir / f"{case.id}_step5_mask.png"
            shutil.copy(segment_image_temp, segment_dest)
            segment_image_saved = str(segment_dest)

        image_record.parts_mask_path = segment_image_saved
        image_record.parts_overlay_path = detected_image_saved

        updated_damages = []
        quality_summary = {
            "total_damages": len(existing_damages),
            "extracted_count": 0,
            "ambiguous_count": 0,
            "side_corrected_count": 0,
            "side_corrected_light_rule_count": 0,
            "conflict_count": 0,
            "failed_count": 0,
        }
        # Run Step5 logic for each damage bbox
        for damage_row in existing_damages:
            # Detect damaged part inside bbox
            result = detect_part_in_bbox(
                segment_image_path=segment_image_saved,
                bbox_x1=damage_row.bbox_x1,
                bbox_y1=damage_row.bbox_y1,
                bbox_x2=damage_row.bbox_x2,
                bbox_y2=damage_row.bbox_y2,
                accepted_side=image_record.accepted_side,
                damage_type_en=damage_row.damage_type_en,
            )
            
            # Save Step5 results to database
            damage_row.part_name_en = result["part_name_en"]
            damage_row.part_name_ar = result["part_name_ar"]
            damage_row.vote_ratio = result["vote_ratio"]
            damage_row.vote_label = result["vote_label"]
            damage_row.part_status = result["part_status"]
            damage_row.part_reason = result["part_reason"]
            damage_row.part_method = result["part_method"]
            damage_row.part_post_rules = result["part_post_rules"]

            if result.get("allowed_groups"):
                damage_row.allowed_groups = ",".join(result.get("allowed_groups"))

            if result.get("part_name_en") == "background":
                damage_row.unsupported_by_parts_model = True
            else:
                damage_row.unsupported_by_parts_model = False
            
            # Update quality statistics
            status = result.get("quality_status")
            if status == "extracted":
                quality_summary["extracted_count"] += 1
            elif status == "ambiguous":
                quality_summary["ambiguous_count"] += 1
            elif status == "side_corrected":
                quality_summary["side_corrected_count"] += 1
            elif status == "side_corrected_light_rule":
                quality_summary["side_corrected_light_rule_count"] += 1
            elif status == "conflict_with_step2":
                quality_summary["conflict_count"] += 1
            else:
                quality_summary["failed_count"] += 1
            # Prepare response object for API output
            updated_damages.append({
                "damage_no": damage_row.damage_no,
                "damage_side": image_record.accepted_side,
                "part_name_en": damage_row.part_name_en,
                "part_name_ar": damage_row.part_name_ar,
                "vote_ratio": float(damage_row.vote_ratio) if damage_row.vote_ratio is not None else None,
                "vote_label": damage_row.vote_label,
                "part_status": damage_row.part_status,
                "part_reason": damage_row.part_reason,
                "part_method": damage_row.part_method,
                "part_post_rules": damage_row.part_post_rules,
            })
        # Generate annotated image with bbox and predicted parts
        overlay_img = cv2.imread(image_record.parts_overlay_path)
        if overlay_img is not None:
            annot_img = overlay_img.copy()
            # Draw bbox and part label on image
            for damage_row in existing_damages:
                x1 = int(damage_row.bbox_x1 or 0)
                y1 = int(damage_row.bbox_y1 or 0)
                x2 = int(damage_row.bbox_x2 or 0)
                y2 = int(damage_row.bbox_y2 or 0)

                label = damage_row.part_name_en or damage_row.part_status or "unknown"

                cv2.rectangle(annot_img, (x1, y1), (x2, y2), (255, 255, 255), 2)
                cv2.putText(
                    annot_img,
                    label,
                    (x1, max(20, y1 - 8)),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.55,
                    (255, 255, 255),
                    2,
                    cv2.LINE_AA,
                )

            annot_dest = case_dir / f"{case.id}_step5_damage_parts.jpg"
            cv2.imwrite(str(annot_dest), annot_img)
            image_record.damage_parts_annotated_path = str(annot_dest)
        # Mark case as Step5 completed
        case.status = "step5_completed"

        db.commit()
        db.refresh(case)
        db.refresh(image_record)
        # Return Step5 final response
        return {
            "message": "Step5 completed successfully",
            "case_id": str(case.id),
            "status": case.status,
            "step5_result": {
                "step5_status": step5_result.get("status"),
                "message": step5_result.get("message"),
                "damage_side": image_record.accepted_side,
                "parts_mask_path": image_record.parts_mask_path,
                "parts_overlay_path": image_record.parts_overlay_path,
                "damage_parts_annotated_path": image_record.damage_parts_annotated_path,
                "detected_parts": step5_result.get("detected_parts", []),
                "quality_summary": quality_summary,
                "damages_count": len(updated_damages),
                "damages": updated_damages,
            },
        }

    except HTTPException:
        raise

    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Step5 processing failed: {str(exc)}",
        )