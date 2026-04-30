import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import Base, get_db

# Import all models to make sure SQLAlchemy registers their tables
from app.models.auth_accounts import AuthAccount
from app.models.user_profiles import UserProfile
from app.models.vehicles import Vehicle
from app.models.cases import Case
from app.models.najm_reports import NajmReport
from app.models.damages import Damage
from app.models.cost_estimate_items import CostEstimateItem
from app.models.total_cost_estimates import TotalCostEstimate


# Try to import the Image model because the Damage table uses image_id
# If the model does not exist, continue without stopping the tests
try:
    from app.models.images import Image
except Exception:
    pass


# Remove PostgreSQL-only constraint during SQLite tests
# SQLite may not support the same constraint behavior as PostgreSQL
for constraint in list(NajmReport.__table__.constraints):
    if constraint.name == "ck_najm_reports_vehicle_year_range":
        NajmReport.__table__.constraints.remove(constraint)


# Create an in-memory SQLite database for testing
# StaticPool keeps the same database connection during the test
engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)


# Create a testing session connected to the test database
TestingSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


# ----------------------------------------
# Fixture 1: Test database session
# ----------------------------------------
@pytest.fixture(scope="function")
def db():
    # Create all database tables before each test
    Base.metadata.create_all(bind=engine)

    with engine.begin() as conn:
        # Create a minimal images table for tests
        # This is needed if the Image model is not registered
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS images (
                id TEXT PRIMARY KEY,
                case_id TEXT,
                image_path TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """))

        # Add missing column used by Step7 insert logic
        # This keeps the test database compatible with the Step7 endpoint
        conn.execute(text("""
            ALTER TABLE cost_estimate_items
            ADD COLUMN subtotal_before_fault NUMERIC DEFAULT 0
        """))

    # Open a database session for the test
    session = TestingSessionLocal()

    try:
        # Provide the session to the test
        yield session
    finally:
        # Close the session after the test finishes
        session.close()

        # Drop all tables to keep each test isolated
        Base.metadata.drop_all(bind=engine)


# ----------------------------------------
# Fixture 2: FastAPI test client
# ----------------------------------------
@pytest.fixture(scope="function")
def client(db):
    # Override the real database dependency with the test database session
    def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db

    # Create a FastAPI test client
    test_client = TestClient(app)

    # Provide the client to the test
    yield test_client

    # Clear dependency overrides after the test finishes
    app.dependency_overrides.clear()