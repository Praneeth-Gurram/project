import pytest
from fastapi.testclient import TestClient
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from main import app, find_shipment, xai_service, recommendation_service

client = TestClient(app)

def test_find_shipment_by_asset_id():
    shipment = find_shipment("Truck_1")
    assert shipment is not None
    assert shipment.get("Asset_ID") == "Truck_1"

def test_find_shipment_by_index():
    shipment = find_shipment(0)
    assert shipment is not None
    assert shipment.get("shipment_id") == 0

def test_find_shipment_case_insensitive():
    shipment = find_shipment("truck_6")
    assert shipment is not None
    assert shipment.get("Asset_ID") == "Truck_6"

def test_find_shipment_not_found():
    shipment = find_shipment("NonExistent_Truck_9999")
    assert shipment is None

def test_prediction_explanation_valid_asset():
    response = client.get("/prediction-explanation/Truck_1")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["asset_id"] == "Truck_1"
    assert "predicted_delay_mins" in data
    assert "top_features" in data
    assert len(data["top_features"]) > 0
    assert "business_explanation" in data
    assert isinstance(data["top_features"], list)
    # Validate feature contribution structure
    first_feat = data["top_features"][0]
    assert "feature" in first_feat
    assert "value" in first_feat
    assert "contribution" in first_feat
    assert "impact" in first_feat
    assert first_feat["impact"] in ["increases risk", "reduces risk"]

def test_prediction_explanation_by_index():
    response = client.get("/prediction-explanation/0")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["shipment_id"] == 0
    assert "top_features" in data

def test_prediction_explanation_404():
    response = client.get("/prediction-explanation/Invalid_Truck_XYZ")
    assert response.status_code == 404
    data = response.json()
    assert "detail" in data

def test_recommendation_explanation_valid_asset():
    response = client.get("/recommendation-explanation/Truck_1")
    assert response.status_code == 200
    data = response.json()
    assert "action" in data or "Recommendation" in data
    assert "impact" in data or "ExpectedDelayReduction" in data
    assert "confidence" in data or "Confidence" in data

def test_confidence_scores():
    response = client.get("/confidence-score/Truck_1")
    assert response.status_code == 200
    data = response.json()
    assert "PredictionConfidence" in data
    assert "RecommendationConfidence" in data
    assert "OptimizationConfidence" in data

def test_full_xai_explanation_unified():
    response = client.get("/xai-explanation/Truck_1")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["asset_id"] == "Truck_1"
    assert "risk_level" in data
    assert "predicted_delay_mins" in data
    assert "top_features" in data
    assert "recommendation" in data
    assert "decision_flow" in data
    assert isinstance(data["decision_flow"], list)
    assert len(data["decision_flow"]) >= 3
    assert "confidence" in data

def test_xai_service_clean_features_with_missing_and_nan():
    dirty_input = {
        "Demand_Forecast": None,
        "Asset_Utilization": "invalid_string",
        "Temperature": float('nan'),
        "Humidity": float('inf'),
        "Inventory_Level": 250.0
    }
    cleaned = xai_service.clean_features(dirty_input)
    assert isinstance(cleaned["Demand_Forecast"], float)
    assert isinstance(cleaned["Asset_Utilization"], float)
    assert isinstance(cleaned["Temperature"], float)
    assert isinstance(cleaned["Humidity"], float)
    assert cleaned["Inventory_Level"] == 250.0

    # Ensure explain_prediction doesn't crash on dirty input
    res = xai_service.explain_prediction(dirty_input)
    assert "prediction" in res
    assert "contributions" in res
    assert len(res["contributions"]) == 7
