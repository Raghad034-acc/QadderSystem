from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.step8_report import (
    REPORTS_DIR,
    fetch_case_report_data,
    build_pdf,
    upsert_qadder_report,
    update_case_status,
)

router = APIRouter(
    prefix="/step8",
    tags=["Step 8 Final Report"]
)


@router.post("/{case_id}")
def run_step8_route(
    case_id: str,
    db: Session = Depends(get_db),
):
    """
    Step 8:
    Generate final PDF report and save it in DB.
    """
    try:
        # ---------------------------------------------------
        # Fetch case + damages + totals
        # ---------------------------------------------------
        report_data = fetch_case_report_data(db, case_id)

        case_number = report_data["case"].get("case_number") or case_id
        output_filename = f"Case_{case_number}_Qadder_Report.pdf"
        output_path = REPORTS_DIR / output_filename

        # ---------------------------------------------------
        # Build PDF
        # ---------------------------------------------------
        build_pdf(report_data, output_path)

        relative_report_path = f"uploads/QadderReport/{output_filename}"

        # ---------------------------------------------------
        # Save / update qadder_reports
        # ---------------------------------------------------
        upsert_qadder_report(
            db=db,
            case_id=case_id,
            report_path=relative_report_path,
        )

        # ---------------------------------------------------
        # Update case status
        # ---------------------------------------------------
        update_case_status(db, case_id, "completed")

        db.commit()

        return {
            "message": "Step 8 completed successfully",
            "case_id": case_id,
            "status": "completed",
            "data": {
                "case_id": case_id,
                "case_number": report_data["case"].get("case_number"),
                "report_path": relative_report_path,
                "damages_count": len(report_data["damages"]),
                "message": "Final PDF report generated successfully."
            }
        }

    except ValueError as e:
        db.rollback()
        raise HTTPException(status_code=404, detail=str(e))

    except HTTPException:
        raise

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Step8 failed: {str(e)}"
        )