from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from uuid import uuid4

from app.database import get_db
from app.models.vehicles import Vehicle
from pydantic import BaseModel

router = APIRouter(prefix="/vehicles", tags=["Vehicles"])


# =============================
# Schema
# =============================
class VehicleCreate(BaseModel):
    user_profile_id: str
    plate_number: str
    brand: str
    model: str
    year: int
    color: str | None = None


# =============================
# Add Vehicle
# =============================
@router.post("/")
def create_vehicle(payload: VehicleCreate, db: Session = Depends(get_db)):
    vehicle = Vehicle(
        id=uuid4(),
        user_profile_id=payload.user_profile_id,
        plate_number=payload.plate_number,
        brand=payload.brand,
        model=payload.model,
        year=payload.year,
        color=payload.color,
    )

    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)

    return {
        "message": "Vehicle created successfully",
        "vehicle_id": str(vehicle.id)
    }


# =============================
# Get User Vehicles
# =============================
@router.get("/user/{user_id}")
def get_user_vehicles(user_id: str, db: Session = Depends(get_db)):
    vehicles = db.query(Vehicle).filter(
        Vehicle.user_profile_id == user_id
    ).all()

    return vehicles