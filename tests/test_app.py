import pytest
from fastapi.testclient import TestClient

def test_root_redirect(client: TestClient):
    """Test that root URL redirects to static/index.html."""
    response = client.get("/", follow_redirects=False)
    assert response.status_code == 307
    assert response.headers["location"] == "/static/index.html"

def test_get_activities(client: TestClient):
    """Test that GET /activities returns the activities dictionary."""
    response = client.get("/activities")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, dict)
    assert "Chess Club" in data
    assert "Programming Class" in data

def test_signup_for_activity_success(client: TestClient):
    """Test successful signup for an activity."""
    email = "new.student@mergington.edu"
    response = client.post(f"/activities/Chess Club/signup?email={email}")
    assert response.status_code == 200
    assert response.json()["message"] == f"Signed up {email} for Chess Club"

    # Verify the student was added
    activities = client.get("/activities").json()
    assert email in activities["Chess Club"]["participants"]

def test_signup_for_activity_already_registered(client: TestClient):
    """Test that a student can't sign up for multiple activities."""
    email = "already.registered@mergington.edu"
    
    # First signup should succeed
    response = client.post(f"/activities/Chess Club/signup?email={email}")
    assert response.status_code == 200
    
    # Second signup should fail
    response = client.post(f"/activities/Programming Class/signup?email={email}")
    assert response.status_code == 400
    assert "already signed up" in response.json()["detail"]

def test_signup_for_nonexistent_activity(client: TestClient):
    """Test signup for a non-existent activity."""
    response = client.post("/activities/NonexistentClub/signup?email=test@mergington.edu")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()

def test_remove_participant_success(client: TestClient):
    """Test successfully removing a participant from an activity."""
    # First add a participant
    email = "to.remove@mergington.edu"
    client.post(f"/activities/Chess Club/signup?email={email}")
    
    # Then remove them
    response = client.delete(f"/activities/Chess Club/participants?email={email}")
    assert response.status_code == 200
    assert response.json()["message"] == f"Removed {email} from Chess Club"
    
    # Verify they were removed
    activities = client.get("/activities").json()
    assert email not in activities["Chess Club"]["participants"]

def test_remove_nonexistent_participant(client: TestClient):
    """Test removing a participant that doesn't exist in the activity."""
    email = "nonexistent@mergington.edu"
    response = client.delete(f"/activities/Chess Club/participants?email={email}")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()

def test_remove_from_nonexistent_activity(client: TestClient):
    """Test removing a participant from a non-existent activity."""
    response = client.delete("/activities/NonexistentClub/participants?email=test@mergington.edu")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()