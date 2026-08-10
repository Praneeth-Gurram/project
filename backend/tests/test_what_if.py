import pytest
from fastapi.testclient import TestClient
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from main import app

client = TestClient(app)

def test_simulate_what_if_happy_path():
    response = client.post("/simulate-what-if", json={
        "shipment_id": 0,
        "modifications": {
            "Traffic_Status": "Heavy",
            "Temperature": 38.0,
            "User_Purchase_Frequency": 9,
            "Asset_Utilization": 90.0
        },
        "maximum_budget": 15000,
        "selected_mode": "Auto"
    })
    assert response.status_code == 200
    data = response.json()
    assert "current" in data
    assert "what_if" in data
    assert data["what_if"]["traffic"] == "Heavy"
    assert data["what_if"]["temperature"] == 38.0
    assert "recommended_action" in data
    assert "constraint_status" in data
    assert data["constraint_status"] in ["Constraint Passed", "Constraint Violated"]
    assert isinstance(data["why_changed"], list)
    assert len(data["why_changed"]) > 0

def test_simulate_what_if_budget_violation():
    # Set budget to very low amount to force constraint violation
    response = client.post("/simulate-what-if", json={
        "shipment_id": 0,
        "modifications": {
            "Demand_Forecast": 800
        },
        "maximum_budget": 100,
        "selected_mode": "Air Freight"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["constraint_status"] == "Constraint Violated"
    assert data["execution_blocked"] is True

def test_simulate_what_if_reset_baseline():
    response = client.post("/simulate-what-if", json={
        "shipment_id": 0,
        "modifications": {
            "Traffic_Status": "Clear"
        },
        "maximum_budget": 12500,
        "selected_mode": "Auto"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["constraint_status"] == "Constraint Passed"
    assert data["execution_blocked"] is False
