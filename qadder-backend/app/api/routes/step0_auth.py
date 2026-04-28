# --------------------------------------------------
# Imports
# --------------------------------------------------
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db

# Auth services (business logic)
from app.schemas.auth import RegisterRequest, LoginRequest

# Request schemas (data validation)
from app.services.step0_auth import register_user, login_user

# --------------------------------------------------
# Router Setup
# --------------------------------------------------
router = APIRouter(
    prefix="/auth",
    tags=["Auth"]
)

# --------------------------------------------------
# Register API
# --------------------------------------------------
# This endpoint is used to create a new user account
@router.post("/register")
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    return register_user(db, payload)

# --------------------------------------------------
# Login API
# --------------------------------------------------
# This endpoint is used to authenticate user and login
@router.post("/login")
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    return login_user(db, payload)



