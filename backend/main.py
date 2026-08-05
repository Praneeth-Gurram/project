from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json
import random
import os

from app.services.xai_service import XAIService
from app.services.recommendation_service import RecommendationService

app = FastAPI(title="Supply Prescript XAI API", description="Explainable AI backend for Logistics Optimization")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_methods=["*"],
    allow_headers=["*"],
)

xai_service = XAIService()
recommendation_service = RecommendationService()

# In-memory mock database loaded from sample_shipments.json
MOCK_DB = []
try:
    if os.path.exists("ml/artifacts/sample_shipments.json"):
        with open("ml/artifacts/sample_shipments.json", "r") as f:
            MOCK_DB = json.load(f)
except Exception as e:
    print(f"Failed to load mock DB: {e}")

@app.get("/prediction-explanation/{shipment_id}")
def get_prediction_explanation(shipment_id: int):
    if shipment_id >= len(MOCK_DB):
        # Fallback to random if out of bounds
        shipment_data = MOCK_DB[0] if MOCK_DB else {}
    else:
        shipment_data = MOCK_DB[shipment_id]
        
    if not shipment_data:
        raise HTTPException(status_code=404, detail="Shipment not found")
        
    features = {k: shipment_data.get(k, 0) for k in xai_service.feature_names}
    prediction_data = xai_service.explain_prediction(features)
    
    # Generate business explanation
    business_text = xai_service.generate_business_translation(prediction_data)
    
    # Calculate Probabilities and Confidence
    predicted_delay = prediction_data["prediction"]
    probability = min(99, max(1, int((predicted_delay / 100) * 100))) if predicted_delay > 0 else 5
    confidence_score = random.randint(85, 98) # Mock high confidence for XGBoost
    risk_level = "High" if predicted_delay > 60 else "Medium" if predicted_delay > 30 else "Low"
    
    return {
        "shipment_id": shipment_id,
        "predicted_delay_mins": predicted_delay,
        "delay_probability": f"{probability}%",
        "confidence_score": f"{confidence_score}%",
        "risk_level": risk_level,
        "business_explanation": business_text,
        "top_features": prediction_data["contributions"][:10],
        "base_value": prediction_data["base_value"]
    }

@app.get("/feature-importance")
def get_global_feature_importance():
    # Return mock aggregated global importances for the dashboard
    return {
        "global_importance": [
            {"feature": "Demand_Forecast", "business_name": "Expected Customer Demand", "impact": 0.45},
            {"feature": "Distance_KM", "business_name": "Delivery Distance", "impact": 0.32},
            {"feature": "Asset_Utilization", "business_name": "Vehicle Utilization Rate", "impact": 0.28},
            {"feature": "Precipitation_mm", "business_name": "Rainfall Volume", "impact": 0.18},
            {"feature": "Temperature", "business_name": "Weather Temperature", "impact": 0.12},
            {"feature": "User_Transaction_Amount", "business_name": "Transaction Value", "impact": 0.08},
            {"feature": "Humidity", "business_name": "Weather Humidity", "impact": 0.05}
        ]
    }

@app.get("/recommendation-explanation/{shipment_id}")
def get_recommendation_explanation(shipment_id: int):
    if shipment_id >= len(MOCK_DB):
        shipment_data = MOCK_DB[0] if MOCK_DB else {}
    else:
        shipment_data = MOCK_DB[shipment_id]
        
    if not shipment_data:
        raise HTTPException(status_code=404, detail="Shipment not found")
        
    features = {k: shipment_data.get(k, 0) for k in xai_service.feature_names}
    prediction_data = xai_service.explain_prediction(features)
    
    recommendation = recommendation_service.generate_recommendation(prediction_data, shipment_data)
    
    if not recommendation:
        return {"status": "No recommendation needed. Shipment on track."}
        
    return recommendation

@app.get("/confidence-score/{shipment_id}")
def get_confidence_scores(shipment_id: int):
    # Module 5: Confidence Indicators
    return {
        "PredictionConfidence": random.randint(85, 99),
        "RecommendationConfidence": random.randint(80, 97),
        "OptimizationConfidence": random.randint(88, 95),
        "ModelConfidence": 94
    }
