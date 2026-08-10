import pytest
from fastapi.testclient import TestClient
import sqlite3
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from main import app
from app.db.database import get_db_connection

client = TestClient(app)

@pytest.fixture(autouse=True)
def clean_db():
    # Clean the database before each test
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM operational_decisions")
        cursor.execute("DELETE FROM workflow_states")
        
        # Initialize default row
        cursor.execute("INSERT INTO workflow_states (prediction_status) VALUES ('ACTIVE')")
        conn.commit()
    yield

def test_workflow_full_happy_path():
    # 1. Generate prediction
    resp = client.post("/workflow/generate-prediction")
    assert resp.status_code == 200
    
    state = client.get("/workflow-state").json()
    assert state["prediction_status"] == "COMPLETED"
    assert state["optimization_status"] == "ACTIVE"
    
    # 2. Run Optimization
    resp = client.post("/workflow/run-optimization", json={"shipment_id": 1, "required_quantity": 800, "maximum_budget": 15000})
    assert resp.status_code == 200
    
    state = client.get("/workflow-state").json()
    assert state["optimization_status"] == "COMPLETED"
    assert state["decision_status"] == "ACTIVE"
    
    # 3. Select Decision
    resp = client.post("/workflow/select-decision")
    assert resp.status_code == 200
    
    state = client.get("/workflow-state").json()
    assert state["decision_status"] == "COMPLETED"
    assert state["execution_status"] == "ACTIVE"
    
    # 4. Execute Decision
    resp = client.post("/workflow/execute-decision", json={"shipment_id": 1, "required_quantity": 800, "maximum_budget": 15000})
    assert resp.status_code == 200
    
    state = client.get("/workflow-state").json()
    assert state["execution_status"] == "COMPLETED"
    assert state["outcome_status"] == "ACTIVE"
    
    # 5. Provide Outcome
    resp = client.post("/workflow/provide-outcome", json={"actual_cost": 15500, "actual_delay": 15})
    assert resp.status_code == 200
    
    state = client.get("/workflow-state").json()
    assert state["outcome_status"] == "COMPLETED"
    assert state["learning_status"] == "COMPLETED"
    assert state["actual_cost"] == 15500
    assert state["actual_delay"] == 15

def test_workflow_optimization_failure():
    # Force optimization failure (e.g. impossible constraint)
    resp = client.post("/workflow/generate-prediction")
    resp = client.post("/workflow/run-optimization", json={"shipment_id": 1, "required_quantity": 50000, "maximum_budget": 100})
    assert resp.status_code == 400
    
    state = client.get("/workflow-state").json()
    assert state["optimization_status"] == "FAILED"
    assert state["decision_status"] == "PENDING"
