from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from uuid import uuid4
from app.database import get_db
from app.models.vehicles import Vehicle
from pydantic import BaseModel

# Vehicles Router Definition
router = APIRouter(prefix="/vehicles", tags=["Vehicles"])


# Schema (Request Body)
class VehicleCreate(BaseModel):
    user_profile_id: str
    plate_number: str
    brand: str
    model: str
    year: int
    color: str | None = None


# Add Vehicle Endpoint
@router.post("/")
def create_vehicle(payload: VehicleCreate, db: Session = Depends(get_db)):
    # Create new vehicle object
    vehicle = Vehicle(
        id=uuid4(), # Generate unique vehicle ID
        user_profile_id=payload.user_profile_id,
        plate_number=payload.plate_number,
        brand=payload.brand,
        model=payload.model,
        year=payload.year,
        color=payload.color,
    )
    
    # Save vehicle to database
    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)

    # Return response
    return {
        "message": "Vehicle created successfully",
        "vehicle_id": str(vehicle.id)
    }

# Get User Vehicles Endpoint
@router.get("/user/{user_id}")
def get_user_vehicles(user_id: str, db: Session = Depends(get_db)):
    # Fetch all vehicles for the given user
    vehicles = db.query(Vehicle).filter(
        Vehicle.user_profile_id == user_id
    ).all()
    
    # Return vehicles list
    return vehicles