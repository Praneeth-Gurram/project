import pytest
from fastapi.testclient import TestClient
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from main import app, find_shipment, xai_service, recommendation_service

client = TestClient(app)

def test_case_1_truck_1():
    """TEST 1: Truck_1 -> Expected: XAI explanation loads."""
    res = client.get("/xai-explanation/Truck_1")
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["asset_id"] == "Truck_1"
    assert len(data["top_features"]) > 0
    assert "recommendation" in data
    assert "decision_flow" in data

def test_case_2_and_3_navigation():
    """TEST 2 & 3: Next/Prev Shipment -> Updates to next and previous assets cleanly."""
    res_shipment_0 = client.get("/xai-explanation/0")
    assert res_shipment_0.status_code == 200
    data_0 = res_shipment_0.json()

    res_shipment_1 = client.get("/xai-explanation/1")
    assert res_shipment_1.status_code == 200
    data_1 = res_shipment_1.json()

    # Verify they represent different records in dataset
    assert data_0["shipment_id"] == 0
    assert data_1["shipment_id"] == 1
    assert data_0["asset_id"] != data_1["asset_id"] or data_0["predicted_delay_mins"] != data_1["predicted_delay_mins"]

def test_case_4_valid_filtered_asset():
    """TEST 4: Valid asset from dataset loads."""
    res = client.get("/xai-explanation/Truck_7")
    assert res.status_code == 200
    data = res.json()
    assert data["asset_id"] == "Truck_7"
    assert "business_explanation" in data

def test_case_6_missing_feature_imputation():
    """TEST 6: Asset with missing XAI features uses safe defaults without crashing."""
    corrupt_features = {
        "Demand_Forecast": None,
        "Asset_Utilization": "NaN",
        "Temperature": None
    }
    pred = xai_service.explain_prediction(corrupt_features)
    assert pred["prediction"] >= 0
    assert len(pred["contributions"]) == 7

def test_case_8_invalid_asset_id():
    """TEST 8: Invalid asset ID -> Returns 404 with descriptive message."""
    res = client.get("/xai-explanation/Unknown_Vehicle_999")
    assert res.status_code == 404
    data = res.json()
    assert "detail" in data
    assert "not found" in data["detail"].lower()
