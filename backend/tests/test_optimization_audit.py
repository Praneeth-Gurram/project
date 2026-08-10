import pytest
from fastapi.testclient import TestClient
import sqlite3
import os
import sys
from contextlib import contextmanager

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from main import app
from app.db.database import get_db_connection

client = TestClient(app)

@pytest.fixture(autouse=True)
def clean_db():
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM operational_decisions")
        conn.commit()
    yield

def test_1_valid_solution_within_budget():
    resp = client.post("/simulate-optimization", json={"shipment_id": 1, "required_quantity": 800, "maximum_budget": 15000})
    assert resp.status_code == 200
    data = resp.json()
    assert data["feasible"] is True
    assert data["audit"]["budget_constraint_status"] == "PASSED"
    assert data["audit"]["overall_feasibility"] == "FEASIBLE"
    assert data["audit"]["calculated_total_cost"] < 15000

def test_2_solution_exactly_equal_to_budget():
    resp = client.post("/simulate-optimization", json={"shipment_id": 1, "required_quantity": 800, "maximum_budget": 4000})
    assert resp.status_code == 200
    data = resp.json()
    assert data["feasible"] is True
    assert data["audit"]["budget_constraint_status"] == "PASSED"
    assert data["audit"]["overall_feasibility"] == "FEASIBLE"
    assert data["audit"]["calculated_total_cost"] == 4000

def test_3_solution_exceeding_budget():
    resp = client.post("/simulate-optimization", json={"shipment_id": 1, "required_quantity": 800, "maximum_budget": 3000})
    assert resp.status_code == 200
    data = resp.json()
    assert data["feasible"] is False
    assert data["audit"]["budget_constraint_status"] == "FAILED"
    assert data["audit"]["overall_feasibility"] == "INFEASIBLE"
    
    exec_resp = client.post("/execute-decision", json={"shipment_id": 1, "required_quantity": 800, "maximum_budget": 3000})
    assert exec_resp.status_code == 400
    assert "Execution blocked" in exec_resp.json()["detail"]

def test_4_scipy_solver_failure():
    resp = client.post("/simulate-optimization", json={"shipment_id": 1, "required_quantity": 2000, "maximum_budget": 50000})
    assert resp.status_code == 200
    data = resp.json()
    assert data["feasible"] is False
    assert data["audit"]["solver_success"] is False
    assert data["audit"]["overall_feasibility"] == "INFEASIBLE"
    
    exec_resp = client.post("/execute-decision", json={"shipment_id": 1, "required_quantity": 2000, "maximum_budget": 50000})
    assert exec_resp.status_code == 400
    assert "Execution blocked" in exec_resp.json()["detail"]

def test_5_floating_point_boundary_case():
    # If the solver produces 4000.000000001 but budget is 4000, it should pass due to tolerance.
    # We can simulate this by setting required_quantity slightly above 800 but budget to exactly what that would cost.
    # e.g., req = 800.000001, budget = 4000.000005
    resp = client.post("/simulate-optimization", json={"shipment_id": 1, "required_quantity": 800.000001, "maximum_budget": 4000.000005})
    assert resp.status_code == 200
    data = resp.json()
    assert data["audit"]["budget_constraint_status"] == "PASSED"
    assert data["audit"]["overall_feasibility"] == "FEASIBLE"
