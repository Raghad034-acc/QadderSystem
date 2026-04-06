from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.step7_pricing import run_step7

router = APIRouter(
    prefix="/step7",
    tags=["Step 7 Pricing"]
)


@router.post("/{case_id}")
def run_step7_route(
    case_id: str,
    db: Session = Depends(get_db)
):
    try:
        result = run_step7(
            db=db,
            case_id=case_id
        )

        return {
            "message": "Step 7 completed successfully",
            "case_id": case_id,
            "summary": result["summary"]
        }

    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail=str(e)
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Step7 failed: {str(e)}"
        )