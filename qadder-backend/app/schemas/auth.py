from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import date


class RegisterRequest(BaseModel):
    email: EmailStr
    phone_number: str = Field(..., min_length=10, max_length=10)
    password: str = Field(..., min_length=6, max_length=30)
    national_id: str = Field(..., min_length=10, max_length=10)
    first_name: str = Field(..., min_length=2, max_length=10)
    second_name: str = Field(..., min_length=2, max_length=10)
    third_name: str = Field(..., min_length=2, max_length=10)
    last_name: str = Field(..., min_length=2, max_length=10)
    nationality: Optional[str] = None
    date_of_birth: Optional[date] = None

    brand: str
    model: str
    year: Optional[int] = None
    color: Optional[str] = None
    plate_number: Optional[str] = None
    
    
    
class LoginRequest(BaseModel):
    login: str  # email OR phone_number
    password: str