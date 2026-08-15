"""
FastAPI application entry point
for the SupplyPrescript project.
"""

from typing import Any

import pandas as pd
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from api.services.prediction_service import PredictionService
from api.services.optimization_service import OptimizationService


app = FastAPI(
    title="SupplyPrescript AI",
    description="Prescriptive analytics API for smart logistics",
    version="1.0.0",
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
    """

    try:
        data = pd.DataFrame(request.data)

        probabilities = prediction_service.predict_probability(data)

        return {
            "predictions": probabilities.tolist()
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