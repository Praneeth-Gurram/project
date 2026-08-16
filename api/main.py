"""
FastAPI application entry point
for the SupplyPrescript project.
"""

from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path
from typing import Any

import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel

from api.services.prediction_service import PredictionService
from api.services.optimization_service import OptimizationService


# ---------------------------------------------------------
# React frontend location
# ---------------------------------------------------------

PROJECT_ROOT = Path(__file__).resolve().parent.parent

FRONTEND_DIST = (
    PROJECT_ROOT
    / "supply-prescript-ai"
    / "dist"
)

FRONTEND_INDEX = FRONTEND_DIST / "index.html"


# ---------------------------------------------------------
# FastAPI application
# ---------------------------------------------------------

app = FastAPI(
    title="SupplyPrescript AI",
    description="Prescriptive analytics API for smart logistics",
    version="1.0.0",
)


# ---------------------------------------------------------
# CORS
# ---------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------
# Services
# ---------------------------------------------------------

prediction_service = PredictionService()
optimization_service = OptimizationService()


# ---------------------------------------------------------
# Request models
# ---------------------------------------------------------

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


# ---------------------------------------------------------
# API endpoints
# ---------------------------------------------------------

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

        asset_ids = (
            data["Asset_ID"].tolist()
            if "Asset_ID" in data.columns
            else [
                f"Asset_{i + 1}"
                for i in range(len(data))
            ]
        )

        probabilities = (
            prediction_service.predict_probability(data)
        )

        predictions = [
            {
                "asset_id": asset_id,
                "delay_probability": float(probability),
            }
            for asset_id, probability
            in zip(asset_ids, probabilities)
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
        recommendations = (
            optimization_service.optimize(
                request.predictions
            )
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
        probabilities = (
            prediction_service.predict_probability(data)
        )

        # Build Asset_ID -> probability mapping
        predictions = {
            str(asset_id): float(probability)
            for asset_id, probability
            in zip(
                data["Asset_ID"],
                probabilities,
            )
        }

        # Run optimization
        recommendations = (
            optimization_service.optimize(
                predictions
            )
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


# ---------------------------------------------------------
# React frontend
# ---------------------------------------------------------

@app.get("/")
def serve_frontend():
    """
    Serve the React frontend.

    If the production frontend has not been built yet,
    return a simple API status message instead.
    """

    if FRONTEND_INDEX.exists():
        return FileResponse(FRONTEND_INDEX)

    return {
        "message": "SupplyPrescript API is running",
        "status": "ok",
        "frontend": "React build not found",
        "build_path": str(FRONTEND_INDEX),
    }

# Serve React production build
FRONTEND_DIR = Path(__file__).resolve().parent.parent / "supply-prescript-ai" / "dist"

if FRONTEND_DIR.exists():
    app.mount(
        "/assets",
        StaticFiles(directory=FRONTEND_DIR / "assets"),
        name="assets",
    )

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        file_path = FRONTEND_DIR / full_path

        if file_path.is_file():
            return FileResponse(file_path)

        return FileResponse(FRONTEND_DIR / "index.html")