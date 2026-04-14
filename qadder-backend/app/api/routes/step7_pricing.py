from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import pandas as pd

from app.database import get_db
from app.services.step7_pricing import (
    ensure_datasets_exist,
    fetch_case_and_fault,
    fetch_damages,
    load_parts_dataset,
    filter_parts_by_vehicle,
    build_initial_rows,
    apply_grouping_rules,
    apply_fault_formula,
    clear_previous_step7_data,
    insert_cost_estimate_item,
    insert_total_cost_estimate,
    update_case_status,
    PARTS_DATASET_PATH,
    LABOR_DATASET_PATH,
)

router = APIRouter(prefix="/step7", tags=["Step7 Pricing"])


@router.post("/{case_id}")
def run_step7_pricing(
    case_id: str,
    db: Session = Depends(get_db),
):
    """
    Step 7:
    Read damages + vehicle + fault percentage,
    calculate pricing,
    save result into DB.
    """
    try:
        ensure_datasets_exist()

        case_data = fetch_case_and_fault(db, case_id)
        damages = fetch_damages(db, case_id)

        vehicle = {
            "brand": case_data.get("brand"),
            "model": case_data.get("model"),
            "year": case_data.get("year"),
        }

        parts_df_all = load_parts_dataset(PARTS_DATASET_PATH)
        labor_df = pd.read_csv(LABOR_DATASET_PATH)

        parts_df_vehicle, vehicle_filter_debug = filter_parts_by_vehicle(parts_df_all, vehicle)

        rows = build_initial_rows(damages, parts_df_vehicle, labor_df)
        rows = apply_grouping_rules(rows)
        rows, summary = apply_fault_formula(rows, case_data.get("fault_percentage"))

        clear_previous_step7_data(db, case_id)

        for row in rows:
            insert_cost_estimate_item(
                db=db,
                damage_id=row["damage_id"],
                part_price=row["part_price"],
                labor_cost=row["labor_cost"],
                subtotal_before_fault=row["subtotal_before_fault"],
                subtotal_after_fault=row["subtotal_after_fault"],
            )

        insert_total_cost_estimate(
            db=db,
            case_id=case_id,
            damages_count=summary["damages_count"],
            total_parts=summary["total_parts"],
            total_labor=summary["total_labor"],
            total_estimated_cost=summary["total_estimated_cost"],
            adjusted_cost=summary["adjusted_cost"],
        )

        update_case_status(db, case_id, "step7_completed")

        db.commit()

        return {
            "message": "Step7 completed successfully",
            "case_id": case_id,
            "status": "step7_completed",
            "vehicle": vehicle,
            "vehicle_filter_debug": vehicle_filter_debug,
            "summary": summary,
            "rows": [
                {
                    "damage_id": r["damage_id"],
                    "damage_no": r["damage_no"],
                    "damage_type_en": r["damage_type_en"],
                    "damage_type_ar": r["damage_type_ar"],
                    "severity_en": r["severity_en"],
                    "severity_ar": r["severity_ar"],
                    "part_name_en": r["part_name_en"],
                    "part_name_ar": r["part_name_ar"],
                    "part_price": round(r["part_price"], 2),
                    "labor_cost": round(r["labor_cost"], 2),
                    "subtotal_before_fault": round(r["subtotal_before_fault"], 2),
                    "subtotal_after_fault": round(r["subtotal_after_fault"], 2),
                    "match_debug": r["match_debug"],
                }
                for r in rows
            ],
        }

    except ValueError as e:
        db.rollback()
        raise HTTPException(status_code=404, detail=str(e))

    except HTTPException:
        raise

    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Step7 processing failed: {str(exc)}",
        )