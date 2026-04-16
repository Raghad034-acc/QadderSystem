from uuid import uuid4
from fastapi import HTTPException
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from sqlalchemy import or_

from app.models.auth_accounts import AuthAccount
from app.models.user_profiles import UserProfile
from app.models.vehicles import Vehicle
from app.models.cases import Case

from app.schemas.auth import RegisterRequest, LoginRequest

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def register_user(db: Session, payload: RegisterRequest):

    # email check
    if db.query(AuthAccount).filter(AuthAccount.email == payload.email).first():
        raise HTTPException(status_code=400, detail="email already exists")

    # phone check
    if db.query(AuthAccount).filter(AuthAccount.phone_number == payload.phone_number).first():
        raise HTTPException(status_code=400, detail="phone already exists")

    # national id check
    if db.query(UserProfile).filter(UserProfile.national_id == payload.national_id).first():
        raise HTTPException(status_code=400, detail="national id exists")

    # -------- auth account --------
    auth = AuthAccount(
        id=uuid4(),
        email=payload.email,
        phone_number=payload.phone_number,
        password_hash=hash_password(payload.password),
        account_status="active"
    )
    db.add(auth)
    db.flush()

    # -------- profile --------
    profile = UserProfile(
        id=uuid4(),
        auth_account_id=auth.id,
        national_id=payload.national_id,
        first_name=payload.first_name,
        second_name=payload.second_name,
        third_name=payload.third_name,
        last_name=payload.last_name,
        nationality=payload.nationality,
        date_of_birth=payload.date_of_birth
    )
    db.add(profile)
    db.flush()

    # -------- vehicle --------
    vehicle = Vehicle(
        id=uuid4(),
        user_profile_id=profile.id,
        brand=payload.brand,
        model=payload.model,
        year=payload.year,
        color=payload.color,
        plate_number=payload.plate_number
    )
    db.add(vehicle)
    db.flush()

    db.commit()

    return {
        "message": "registered successfully",
        "user_id": str(profile.id)
    }


def login_user(db: Session, payload: LoginRequest):
    account = db.query(AuthAccount).filter(
        or_(
            AuthAccount.email == payload.login,
            AuthAccount.phone_number == payload.login
        )
    ).first()

    if not account:
        raise HTTPException(status_code=404, detail="account not found")

    if account.account_status != "active":
        raise HTTPException(status_code=403, detail="account is not active")

    if not verify_password(payload.password, account.password_hash):
        raise HTTPException(status_code=401, detail="invalid password")

    profile = db.query(UserProfile).filter(
        UserProfile.auth_account_id == account.id
    ).first()

    vehicles = []
    if profile:
        vehicles = db.query(Vehicle).filter(
            Vehicle.user_profile_id == profile.id
        ).all()
        
    reports = db.query(Case).filter(Case.user_profile_id == profile.id).all()
                
    return {
        "message": "login successful",
        "auth_account_id": str(account.id),
        "user_profile_id": str(profile.id) if profile else None,
        "email": account.email,
        "phone_number": account.phone_number,
        "account_status": account.account_status,

        "first_name": profile.first_name if profile else None,
        "last_name": profile.last_name if profile else None,
        
       
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
        ] , 
        "reports": [
    {
        "id": str(r.id),
        "case_number": r.case_number,
        "status": r.status,
    }
    for r in reports
]
        
    }