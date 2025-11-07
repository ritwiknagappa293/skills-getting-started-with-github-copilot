import pytest
from fastapi.testclient import TestClient
from src.app import app

@pytest.fixture
def client():
    """Create a test client for our FastAPI app."""
    return TestClient(app)

@pytest.fixture
def test_activity():
    """Sample activity data for testing."""
    return {
        "description": "Test activity description",
        "schedule": "Test schedule",
        "max_participants": 10,
        "participants": ["test1@mergington.edu", "test2@mergington.edu"]
    }