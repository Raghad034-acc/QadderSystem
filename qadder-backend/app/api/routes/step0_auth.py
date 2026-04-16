from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.step0_auth import register_user
from app.schemas.auth import RegisterRequest
from app.schemas.auth import RegisterRequest, LoginRequest
from app.services.step0_auth import register_user, login_user

router = APIRouter(
    prefix="/auth",
    tags=["Auth"]
)


@router.post("/register")
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    return register_user(db, payload)


@router.post("/login")
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    return login_user(db, payload)



