import uuid
from unittest.mock import patch

from app.models.auth_accounts import AuthAccount
from app.models.user_profiles import UserProfile
from app.models.vehicles import Vehicle
from app.models.cases import Case
from app.models.najm_reports import NajmReport
from app.models.damages import Damage
from app.models.cost_estimate_items import CostEstimateItem
from app.models.total_cost_estimates import TotalCostEstimate


# Helper function to create the required test data for Step 7
def create_case_with_damage(db):
    # Create a test auth account
    auth = AuthAccount(
        id=uuid.uuid4(),
        email="test@example.com",
        phone_number="0500000000",
        password_hash="hashed",
        account_status="active",
    )

    # Create a test user profile linked to the auth account
    user = UserProfile(
        id=uuid.uuid4(),
        auth_account_id=auth.id,
        national_id="1234567890",
        first_name="Test",
        second_name="User",
        third_name="Demo",
        last_name="Account",
        nationality="saudi",
    )

    # Create a test vehicle linked to the user profile
    vehicle = Vehicle(
        id=uuid.uuid4(),
        user_profile_id=user.id,
        brand="hyundai",
        model="accent",
        year=2020,
        color="white",
        plate_number="ABC123",
    )

    # Create a test case that has already completed Step 6
    case = Case(
        id=uuid.uuid4(),
        case_number="CASE123",
        user_profile_id=user.id,
        vehicle_id=vehicle.id,
        status="step6_completed",
    )

    # Create a Najm report linked to the test case
    najm_report = NajmReport(
        id=uuid.uuid4(),
        case_id=case.id,
        report_file_path="uploads/najm/test.pdf",
        accident_id="ACC-STEP7",
        accident_coordinates="24.7136,46.6753",
        fault_percentage=0,
        damage_area="front",
        damage_area_ar="امامي",
        party_full_name="Test User",
        license_type="private",
        party_national_id="1234567890",
        party_mobile="0500000000",
        party_nationality="saudi",
        vehicle_plate_number="ABC123",
        vehicle_brand="hyundai",
        vehicle_model="accent",
        vehicle_year=2020,
        vehicle_color="white",
    )

    # Create a detected damage record linked to the test case
    damage = Damage(
        id=uuid.uuid4(),
        case_id=case.id,
        image_id=uuid.uuid4(),
        damage_no=1,
        damage_type_en="scratch",
        damage_type_ar="خدش",
        severity_en="low",
        severity_ar="منخفض",
        part_name_en="front bumper",
        part_name_ar="الصدام الامامي",
    )

    # Save all required records in the test database
    db.add_all([auth, user, vehicle, case, najm_report, damage])
    db.commit()

    # Return the case and damage to use them in the test
    return case, damage


# ----------------------------------------
# Test 1: Step 7 pricing saves cost estimates
# ----------------------------------------

# Mock external dataset and pricing helper functions
# This keeps the test focused on the endpoint and database saving logic
@patch("app.api.routes.step7_pricing.ensure_datasets_exist")
@patch("app.api.routes.step7_pricing.load_parts_dataset")
@patch("app.api.routes.step7_pricing.pd.read_csv")
@patch("app.api.routes.step7_pricing.filter_parts_by_vehicle")
@patch("app.api.routes.step7_pricing.build_initial_rows")
@patch("app.api.routes.step7_pricing.apply_grouping_rules")
def test_step7_pricing_saves_costs(
    mock_grouping,
    mock_build_rows,
    mock_filter,
    mock_read_csv,
    mock_load_parts,
    mock_ensure,
    client,
    db,
):
    # Create a test case with one damage record
    case, damage = create_case_with_damage(db)

    # Mock dataset loading and filtering functions
    mock_ensure.return_value = None
    mock_load_parts.return_value = []
    mock_read_csv.return_value = []
    mock_filter.return_value = ([], {})

    # Fake pricing result returned by the pricing logic
    pricing_rows = [
        {
            "damage_id": str(damage.id),
            "damage_no": 1,
            "damage_type_en": "scratch",
            "damage_type_ar": "خدش",
            "severity_en": "low",
            "severity_ar": "منخفض",
            "part_name_en": "front bumper",
            "part_name_ar": "الصدام الامامي",
            "part_price": 1000,
            "labor_cost": 200,
            "subtotal_before_fault": 1200,
            "subtotal_after_fault": 1200,
            "match_debug": {},
        }
    ]

    # Mock the pricing row builder and grouping rules result
    mock_build_rows.return_value = pricing_rows
    mock_grouping.return_value = pricing_rows

    # Send a POST request to the Step 7 pricing endpoint
    response = client.post(f"/step7/{case.id.hex}")

    # Check that the endpoint returns a successful response
    assert response.status_code == 200

    # Convert the response to JSON
    data = response.json()

    # Check the response status and pricing summary
    assert data["status"] == "step7_completed"
    assert data["summary"]["total_parts"] == 1000
    assert data["summary"]["total_labor"] == 200
    assert data["summary"]["total_estimated_cost"] == 1200
    assert data["summary"]["adjusted_cost"] == 1200

    # Read saved pricing data from the test database
    items = db.query(CostEstimateItem).all()
    total = db.query(TotalCostEstimate).first()
    updated_case = db.query(Case).filter(Case.id == case.id).first()

    # Check that one cost estimate item was saved
    assert len(items) == 1
    assert float(items[0].part_price) == 1000
    assert float(items[0].labor_cost) == 200
    assert float(items[0].subtotal_after_fault) == 1200

    # Check that the total cost estimate was saved correctly
    assert total is not None
    assert total.damages_count == 1
    assert float(total.total_parts) == 1000
    assert float(total.total_labor) == 200
    assert float(total.total_estimated_cost) == 1200
    assert float(total.adjusted_cost) == 1200

    # Check that the case status was updated after Step 7 completed
    assert updated_case.status == "step7_completed"