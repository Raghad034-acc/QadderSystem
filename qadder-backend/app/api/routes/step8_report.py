from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.step8_report import run_step8

router = APIRouter(
    prefix="/step8",
    tags=["Step 8 Final Report"]
)

@router.post("/{case_id}")
def run_step8_route(case_id: str, db: Session = Depends(get_db)):
    try:
        result = run_step8(db=db, case_id=case_id)
        return {
            "message": "Step 8 completed successfully",
            "case_id": case_id,
            "data": result
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Step8 failed: {str(e)}")