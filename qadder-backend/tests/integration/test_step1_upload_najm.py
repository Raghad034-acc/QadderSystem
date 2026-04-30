import uuid
from unittest.mock import patch

from app.models.auth_accounts import AuthAccount
from app.models.user_profiles import UserProfile
from app.models.vehicles import Vehicle
from app.models.cases import Case
from app.models.najm_reports import NajmReport


# Helper function to create a test user and vehicle
def create_test_user_and_vehicle(db):
    # Create a test auth account
    auth = AuthAccount(
        id=uuid.uuid4(),
        email="test@example.com",
        phone_number="0509897213",
        password_hash="hashed_password",
        account_status="active",
    )

    # Create a test user profile linked to the auth account
    user = UserProfile(
        id=uuid.uuid4(),
        auth_account_id=auth.id,
        national_id="1134567674",
        first_name="سالم",
        second_name="سلطان",
        third_name="محمد",
        last_name="العتيبي",
        nationality="سعودي",
    )

    # Create a test vehicle linked to the user profile
    vehicle = Vehicle(
        id=uuid.uuid4(),
        user_profile_id=user.id,
        brand="hyundai",
        model="accent",
        year=2013,
        color="أبيض",
        plate_number="خصوصي 2267 ح ل ل",
    )

    # Save the test records in the test database
    db.add(auth)
    db.add(user)
    db.add(vehicle)
    db.commit()

    # Return the user and vehicle to use them in the test
    return user, vehicle


# Fake Najm extraction function
# This replaces the real PDF extraction logic during the test
def fake_extract_najm_report(*args, **kwargs):
    return {
        "najm_record": {
            "report_file_path": "uploads/najm/test.pdf",
            "accident_id": "RD557802323",
            "accident_date": None,
            "accident_time": None,
            "accident_coordinates": "21.522998, 39.259298",
            "fault_percentage": 0,
            "damage_area": "rear",
            "damage_area_ar": "خلف",
            "party_full_name": "سالم سلطان محمد العتيبي",
            "license_type": "رخصة خاصة",
            "license_expiry_date": None,
            "party_national_id": "1134567674",
            "party_mobile": "0509897213",
            "party_nationality": "سعودي",
            "vehicle_plate_number": "خصوصي 2267 ح ل ل",
            "vehicle_brand": "hyundai",
            "vehicle_model": "accent",
            "vehicle_year": 2013,
            "vehicle_color": "أبيض",
        },
        "missing_fields": [],
        "debug": {},
        "raw_record": {},
    }


# ----------------------------------------
# Test 1: Upload Najm report saves case and report
# ----------------------------------------

# Mock the real Najm report extraction function
# This keeps the test focused on the endpoint and database saving logic
@patch(
    "app.api.routes.step1_najm.extract_najm_report",
    side_effect=fake_extract_najm_report,
)
def test_upload_najm_report_stores_case_and_report_in_database(mock_extract, client, db):
    # Create the required user and vehicle before uploading the report
    user, vehicle = create_test_user_and_vehicle(db)

    # Send a POST request to the Step 1 upload endpoint with fake PDF content
    response = client.post(
        "/step1/upload-najm-report",
        data={
            "user_profile_id": str(user.id),
            "vehicle_id": str(vehicle.id),
        },
        files={
            "file": (
                "najm_report.pdf",
                b"%PDF-1.4 fake pdf content",
                "application/pdf",
            )
        },
    )

    # Check that the endpoint returns a successful response
    assert response.status_code == 200

    # Convert the response to JSON
    data = response.json()

    # Check the response status and returned Najm report data
    assert data["status"] == "step1_completed"
    assert "case_id" in data
    assert "case_number" in data
    assert data["najm_report"]["accident_id"] == "RD557802323"
    assert data["najm_report"]["damage_area"] == "rear"

    # Get the saved case from the test database
    saved_case = db.query(Case).filter(
        Case.id == uuid.UUID(data["case_id"])
    ).first()

    # Check that the case was created and saved correctly
    assert saved_case is not None
    assert saved_case.status == "step1_completed"
    assert saved_case.case_number == data["case_number"]

    # Get the saved Najm report from the test database
    saved_report = db.query(NajmReport).filter(
        NajmReport.case_id == uuid.UUID(data["case_id"])
    ).first()

    # Check that the Najm report was created and saved correctly
    assert saved_report is not None
    assert saved_report.accident_id == "RD557802323"
    assert saved_report.party_national_id == "1134567674"
    assert saved_report.party_mobile == "0509897213"
    assert saved_report.vehicle_brand == "hyundai"
    assert saved_report.vehicle_model == "accent"
    assert saved_report.damage_area == "rear"

    # Check that the mocked extraction function was called
    assert mock_extract.called