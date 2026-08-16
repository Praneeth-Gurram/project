"""
FastAPI application entry point
for the SupplyPrescript project.
"""

from typing import Any

import pandas as pd
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from api.services.prediction_service import PredictionService
from api.services.optimization_service import OptimizationService


app = FastAPI(
    title="SupplyPrescript AI",
    description="Prescriptive analytics API for smart logistics",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

prediction_service = PredictionService()
optimization_service = OptimizationService()


class LogisticsRequest(BaseModel):
    """
    Request payload containing logistics
    features required by the trained model.
    """

    data: list[dict[str, Any]]


class OptimizationRequest(BaseModel):
    """
    Request payload containing asset IDs
    and predicted delay probabilities.
    """

    predictions: dict[str, float]

class AnalyzeRequest(BaseModel):
    """
    Raw logistics records used for prediction
    and prescriptive optimization.
    """

    data: list[dict[str, Any]]

@app.get("/")
def root():
    """
    Basic API health check.
    """

    return {
        "message": "SupplyPrescript API is running",
        "status": "ok",
    }


@app.get("/health")
def health_check():
    """
    Health check endpoint used to verify
    that the API is available.
    """

    return {
        "status": "healthy"
    }


@app.post("/predict")
def predict(request: LogisticsRequest):
    """
    Generate logistics delay probabilities.

    Asset_ID is used only to identify each prediction
    in the API response and is not passed to the model.
    """

    try:
        data = pd.DataFrame(request.data)

        # Keep asset IDs for response mapping.
        asset_ids = data["Asset_ID"].tolist() if "Asset_ID" in data.columns else [
            f"Asset_{i + 1}" for i in range(len(data))
        ]

        probabilities = prediction_service.predict_probability(data)

        predictions = [
            {
                "asset_id": asset_id,
                "delay_probability": float(probability),
            }
            for asset_id, probability in zip(asset_ids, probabilities)
        ]

        return {
            "predictions": predictions
        }

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )

@app.post("/optimize")
def optimize(request: OptimizationRequest):
    """
    Generate optimization recommendations
    from predicted delay probabilities.
    """

    try:
        recommendations = optimization_service.optimize(
            request.predictions
        )

        return {
            "recommendations": recommendations
        }

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )

@app.post("/analyze")
def analyze(request: AnalyzeRequest):
    """
    Run prediction and optimization together.
    """

    try:
        data = pd.DataFrame(request.data)

        # Generate delay probabilities
        probabilities = prediction_service.predict_probability(data)

        # Build Asset_ID -> probability mapping
        predictions = {
            str(asset_id): float(probability)
            for asset_id, probability in zip(
                data["Asset_ID"],
                probabilities
            )
        }

        # Run optimization
        recommendations = optimization_service.optimize(
            predictions
        )

        return {
            "predictions": predictions,
            "recommendations": recommendations,
        }

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )