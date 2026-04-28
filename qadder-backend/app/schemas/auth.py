# --------------------------------------------------
# Imports
# --------------------------------------------------
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import date

# --------------------------------------------------
# Register Request Schema
# Validates user registration input data
# --------------------------------------------------
class RegisterRequest(BaseModel):

    # --------------------------------------------------
    # Account Information
    # --------------------------------------------------
    email: EmailStr
    phone_number: str = Field(..., min_length=10, max_length=10)
    password: str = Field(..., min_length=6, max_length=30)

    # --------------------------------------------------
    # Personal Information
    # --------------------------------------------------
    national_id: str = Field(..., min_length=10, max_length=10)
    first_name: str = Field(..., min_length=2, max_length=10)
    second_name: str = Field(..., min_length=2, max_length=10)
    third_name: str = Field(..., min_length=2, max_length=10)
    last_name: str = Field(..., min_length=2, max_length=10)
    nationality: Optional[str] = None
    date_of_birth: Optional[date] = None
    
    # --------------------------------------------------
    # Vehicle Information
    # --------------------------------------------------
    brand: str
    model: str
    year: Optional[int] = None
    color: Optional[str] = None
    plate_number: Optional[str] = None
    
    
# --------------------------------------------------
# Login Request Schema
# Validates login input (email or phone + password)
# --------------------------------------------------
class LoginRequest(BaseModel):
    login: str  # email OR phone_number
    password: str