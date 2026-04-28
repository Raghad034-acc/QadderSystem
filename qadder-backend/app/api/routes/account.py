# --------------------------------------------------
# Imports
# --------------------------------------------------
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.auth_accounts import AuthAccount
from app.models.user_profiles import UserProfile
from app.models.vehicles import Vehicle
from app.models.cases import Case

# --------------------------------------------------
# Router Setup
# --------------------------------------------------
router = APIRouter(
    prefix="/account",
    tags=["Account"]
)

# --------------------------------------------------
# Get Account Details API
# --------------------------------------------------
@router.get("/{user_profile_id}")
def get_account(user_profile_id: str, db: Session = Depends(get_db)):

    # --------------------------------------------------
    # Fetch User Profile
    # --------------------------------------------------
    profile = db.query(UserProfile).filter(UserProfile.id == user_profile_id).first()

    if not profile:
        raise HTTPException(status_code=404, detail="profile not found")

    # --------------------------------------------------
    # Fetch Auth Account
    # --------------------------------------------------
    account = db.query(AuthAccount).filter(
        AuthAccount.id == profile.auth_account_id
    ).first()

    if not account:
        raise HTTPException(status_code=404, detail="account not found")

    # --------------------------------------------------
    # Fetch User Vehicles
    # --------------------------------------------------
    vehicles = db.query(Vehicle).filter(
        Vehicle.user_profile_id == profile.id
    ).all()

    # --------------------------------------------------
    # Fetch User Reports (Cases)
    # --------------------------------------------------
    reports = db.query(Case).filter(
        Case.user_profile_id == profile.id
    ).all()

    # --------------------------------------------------
    # Build Response
    # --------------------------------------------------
    return {

        # Account Information
        "auth_account_id": str(account.id),
        "user_profile_id": str(profile.id),
        "email": account.email,
        "phone_number": account.phone_number,
        "account_status": account.account_status,

        # Profile Information
        "national_id": profile.national_id,
        "first_name": profile.first_name,
        "second_name": profile.second_name,
        "third_name": profile.third_name,
        "last_name": profile.last_name,
        "nationality": profile.nationality,
        "date_of_birth": profile.date_of_birth.isoformat() if profile.date_of_birth else None,

        # Vehicles List
        "vehicles": [
            {
                "id": str(v.id),
                "brand": v.brand,
                "model": v.model,
                "year": v.year,
                "color": v.color,
                "plate_number": v.plate_number,
            }
            for v in vehicles
        ],

        # Reports List
        "reports": [
            {
                "id": str(r.id),
                "case_number": r.case_number,
                "status": r.status,
            }
            for r in reports
        ],
        
         # Reports Count
        "reports_count": len(reports)
    }