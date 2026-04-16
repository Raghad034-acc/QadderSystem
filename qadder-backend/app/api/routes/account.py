from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.auth_accounts import AuthAccount
from app.models.user_profiles import UserProfile
from app.models.vehicles import Vehicle
from app.models.cases import Case

router = APIRouter(
    prefix="/account",
    tags=["Account"]
)


@router.get("/{user_profile_id}")
def get_account(user_profile_id: str, db: Session = Depends(get_db)):
    profile = db.query(UserProfile).filter(UserProfile.id == user_profile_id).first()

    if not profile:
        raise HTTPException(status_code=404, detail="profile not found")

    account = db.query(AuthAccount).filter(
        AuthAccount.id == profile.auth_account_id
    ).first()

    if not account:
        raise HTTPException(status_code=404, detail="account not found")

    vehicles = db.query(Vehicle).filter(
        Vehicle.user_profile_id == profile.id
    ).all()

    reports = db.query(Case).filter(
        Case.user_profile_id == profile.id
    ).all()

    return {
        "auth_account_id": str(account.id),
        "user_profile_id": str(profile.id),
        "email": account.email,
        "phone_number": account.phone_number,
        "account_status": account.account_status,

        "national_id": profile.national_id,
        "first_name": profile.first_name,
        "second_name": profile.second_name,
        "third_name": profile.third_name,
        "last_name": profile.last_name,
        "nationality": profile.nationality,
        "date_of_birth": profile.date_of_birth.isoformat() if profile.date_of_birth else None,

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

        "reports": [
            {
                "id": str(r.id),
                "case_number": r.case_number,
                "status": r.status,
            }
            for r in reports
        ],

        "reports_count": len(reports)
    }