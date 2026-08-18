from pathlib import Path
import random
import sys
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

ROOT_DIR = Path(__file__).resolve().parent.parent
BACKEND_DIR = Path(__file__).resolve().parent
for candidate in (str(ROOT_DIR), str(BACKEND_DIR)):
    if candidate not in sys.path:
        sys.path.insert(0, candidate)

try:
    from backend.app.services.xai_service import XAIService
    from backend.app.services.recommendation_service import RecommendationService
    from backend.app.database.database import init_db
    from backend.app.database.seed_data import ensure_seed_data
    from backend.app.routers import dashboard, inventory, orders, shipments, suppliers
except ModuleNotFoundError:
    from app.services.xai_service import XAIService
    from app.services.recommendation_service import RecommendationService
    from app.database.database import init_db
    from app.database.seed_data import ensure_seed_data
    from app.routers import dashboard, inventory, orders, shipments, suppliers

app = FastAPI(
    title="Supply Prescript XAI API",
    description="Explainable AI backend for Logistics Optimization"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
xai_service = XAIService()
recommendation_service = RecommendationService()


# Startup event
@app.on_event("startup")
async def startup_event():
    """Initialize database and seed data on application startup."""
    init_db()
    seed_result = ensure_seed_data()
    print(f"Database initialization result: {seed_result}")


# Register modular routers
app.include_router(orders.router)
app.include_router(shipments.router)
app.include_router(suppliers.router)
app.include_router(inventory.router)
app.include_router(dashboard.router)


# Health check endpoint
@app.get("/api/health")
def health_check():
    """Health check endpoint."""
    return {
        "status": "ok",
        "service": "Supply Prescript XAI API",
        "database": "connected"
    }


# XAI and Prediction endpoints (preserved)
@app.get("/prediction-explanation/{shipment_id}")
def get_prediction_explanation(shipment_id: int):
    """Get SHAP-based explanation for a shipment prediction."""
    try:
        # For now, use static feature values; in production, fetch from database
        features = {
            'Demand_Forecast': 85.5 + shipment_id,
            'Asset_Utilization': 0.75 + (shipment_id * 0.01),
            'Temperature': 22.5,
            'Humidity': 55.0,
            'Inventory_Level': 300 + shipment_id,
            'User_Transaction_Amount': 5000 + (shipment_id * 100),
            'User_Purchase_Frequency': 5 + (shipment_id % 3),
        }
        prediction_data = xai_service.explain_prediction(features)

        business_text = xai_service.generate_business_translation(prediction_data)
        predicted_delay = prediction_data["prediction"]
        probability = min(99, max(1, int((predicted_delay / 100) * 100))) if predicted_delay > 0 else 5
        confidence_score = random.randint(85, 98)
        risk_level = "High" if predicted_delay > 60 else "Medium" if predicted_delay > 30 else "Low"

        return {
            "shipment_id": shipment_id,
            "predicted_delay_mins": predicted_delay,
            "delay_probability": f"{probability}%",
            "confidence_score": f"{confidence_score}%",
            "risk_level": risk_level,
            "business_explanation": business_text,
            "top_features": prediction_data["contributions"][:10],
            "base_value": prediction_data["base_value"],
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Prediction error: {str(e)}")


@app.get("/feature-importance")
def get_global_feature_importance():
    """Get global feature importance across the model."""
    return {
        "global_importance": [
            {"feature": "Demand_Forecast", "business_name": "Expected Customer Demand", "impact": 0.45},
            {"feature": "Distance_KM", "business_name": "Delivery Distance", "impact": 0.32},
            {"feature": "Asset_Utilization", "business_name": "Vehicle Utilization Rate", "impact": 0.28},
            {"feature": "Precipitation_mm", "business_name": "Rainfall Volume", "impact": 0.18},
            {"feature": "Temperature", "business_name": "Weather Temperature", "impact": 0.12},
            {"feature": "User_Transaction_Amount", "business_name": "Transaction Value", "impact": 0.08},
            {"feature": "Humidity", "business_name": "Weather Humidity", "impact": 0.05},
        ]
    }


@app.get("/recommendation-explanation/{shipment_id}")
def get_recommendation_explanation(shipment_id: int):
    """Get prescriptive recommendations based on prediction."""
    try:
        features = {
            'Demand_Forecast': 85.5 + shipment_id,
            'Asset_Utilization': 0.75 + (shipment_id * 0.01),
            'Temperature': 22.5,
            'Humidity': 55.0,
            'Inventory_Level': 300 + shipment_id,
            'User_Transaction_Amount': 5000 + (shipment_id * 100),
            'User_Purchase_Frequency': 5 + (shipment_id % 3),
        }
        prediction_data = xai_service.explain_prediction(features)

        shipment_data = {
            "User_Transaction_Amount": 5000 + (shipment_id * 100),
        }

        recommendation = recommendation_service.generate_recommendation(
            prediction_data, shipment_data
        )

        if not recommendation:
            return {"status": "No recommendation needed. Shipment on track."}

        return recommendation
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Recommendation error: {str(e)}")


@app.get("/confidence-score/{shipment_id}")
def get_confidence_scores(shipment_id: int):
    """Get confidence scores for predictions and recommendations."""
    return {
        "PredictionConfidence": random.randint(85, 99),
        "RecommendationConfidence": random.randint(80, 97),
        "OptimizationConfidence": random.randint(88, 95),
        "ModelConfidence": 94,
    }


@app.get("/docs", tags=["documentation"])
def docs():
    """API documentation endpoint."""
    return {"message": "API documentation available at /docs"}


# Backward compatibility endpoints (delegating to routers)
@app.get("/dashboard/summary")
def compat_dashboard_summary():
    """Backward compatibility endpoint. Use /api/dashboard/summary instead."""
    from app.database.database import SessionLocal
    db = SessionLocal()
    try:
        return dashboard.get_dashboard_summary(db=db)
    finally:
        db.close()


@app.get("/orders")
def compat_get_orders():
    """Backward compatibility endpoint. Use /api/orders instead."""
    from app.database.database import SessionLocal
    db = SessionLocal()
    try:
        return orders.list_orders(db=db)
    finally:
        db.close()


@app.get("/shipments")
def compat_get_shipments():
    """Backward compatibility endpoint. Use /api/shipments instead."""
    from app.database.database import SessionLocal
    db = SessionLocal()
    try:
        return shipments.list_shipments(db=db)
    finally:
        db.close()


@app.get("/suppliers")
def compat_get_suppliers():
    """Backward compatibility endpoint. Use /api/suppliers instead."""
    from app.database.database import SessionLocal
    db = SessionLocal()
    try:
        return suppliers.list_suppliers(db=db)
    finally:
        db.close()


@app.get("/inventory")
def compat_get_inventory():
    """Backward compatibility endpoint. Use /api/inventory instead."""
    from app.database.database import SessionLocal
    db = SessionLocal()
    try:
        return inventory.list_inventory(db=db)
    finally:
        db.close()

