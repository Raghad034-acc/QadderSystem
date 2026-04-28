from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from fastapi.responses import HTMLResponse
from app.services.step8_report import build_html_report

from app.database import get_db
from app.services.step8_report import (
    REPORTS_DIR,
    fetch_case_report_data,
    build_pdf,
    upsert_qadder_report,
    update_case_status,
)

# Step8 Router Definition
router = APIRouter(
    prefix="/step8",
    tags=["Step 8 Final Report"]
)

# Step8 Main Endpoint (Generate PDF Report)
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
        # Fetch case + damages + totals
        report_data = fetch_case_report_data(db, case_id)
        
        # Prepare output file name and path
        case_number = report_data["case"].get("case_number") or case_id
        output_filename = f"Case_{case_number}_Qadder_Report.pdf"
        output_path = REPORTS_DIR / output_filename

        # Generate PDF report
        build_pdf(report_data, output_path)
        
        # Relative path for storing in DB
        relative_report_path = f"uploads/QadderReport/{output_filename}"

        # Save or update report record in DB
        upsert_qadder_report(
            db=db,
            case_id=case_id,
            report_path=relative_report_path,
        )

        # Update case status (with special condition)
        # If case was rejected in Step3 due to high severity,
        # do NOT override status to preserve rejection history
        case_status = report_data["case"].get("status")

        if case_status != "step3_rejected_high_severity":
         update_case_status(db, case_id, "completed")

        db.commit()
       
        # Return API response
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

    # Handle known errors
    except ValueError as e:
        db.rollback()
        raise HTTPException(status_code=404, detail=str(e))

    except HTTPException:
        raise

    # Handle unexpected errors
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Step8 failed: {str(e)}"
        )

# Get report data only (no PDF generation)
@router.get("/{case_id}/data")
def get_step8_report_data(
    case_id: str,
    db: Session = Depends(get_db),
):
    """
    Get final report data only (no PDF generation).
    """
    try:
        report_data = fetch_case_report_data(db, case_id)

        case_number = report_data["case"].get("case_number") or case_id
        output_filename = f"Case_{case_number}_Qadder_Report.pdf"
        relative_report_path = f"uploads/QadderReport/{output_filename}"

        return {
            "message": "Step 8 report data fetched successfully",
            "case_id": case_id,
            "status": "success",
            "report_path": relative_report_path,
            "data": report_data,
        }

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch step8 report data: {str(e)}"
        )
    

# View report as HTML (preview in browser)
@router.get("/{case_id}/view", response_class=HTMLResponse)
def view_report_html(
    case_id: str,
    db: Session = Depends(get_db),
):
    try:
        # Fetch report data
        report_data = fetch_case_report_data(db, case_id)
        # Build HTML content
        html_content = build_html_report(report_data)
        # Return HTML response
        return HTMLResponse(content=html_content)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
# Retrieve reports history for user

# Returns all generated reports with related case & vehicle info
from fastapi import APIRouter, Depends, HTTPException, Query
@router.get("/reports")
def list_reports(
    user_profile_id: str = Query(...),
    db: Session = Depends(get_db)
):
    
    try:
        # Execute raw SQL query
        rows = db.execute(
            text(
                """
                SELECT
                    qr.id,
                    qr.case_id,
                    qr.report_path,
                    qr.created_at,
                    c.case_number,
                    v.brand,
                    v.model,
                    v.plate_number,
                    v.year
                FROM qadder_reports qr
                LEFT JOIN cases c
                    ON c.id = qr.case_id
                LEFT JOIN vehicles v
                    ON v.id = c.vehicle_id
                WHERE c.user_profile_id = :user_profile_id
                ORDER BY qr.created_at DESC
                """
            ),
            {"user_profile_id": user_profile_id}
        ).mappings().all()
        
        # Format results
        results = []
        for row in rows:
            row_dict = dict(row)
            
            # Build vehicle name string
            vehicle_parts = [
                str(row_dict.get("brand") or "").strip(),
                str(row_dict.get("model") or "").strip(),
                str(row_dict.get("year") or "").strip(),
            ]
            vehicle_name = " ".join([p for p in vehicle_parts if p])
            
            # Add readable vehicle name
            row_dict["vehicle_name"] = (
                vehicle_name if vehicle_name else "اسم السيارة غير متوفر"
            )
            results.append(row_dict)
        return results

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))