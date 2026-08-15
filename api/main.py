"""
FastAPI application entry point
for the SupplyPrescript project.
"""

from fastapi import FastAPI


app = FastAPI(
    title="SupplyPrescript AI",
    description="Prescriptive analytics API for smart logistics",
    version="1.0.0",
)


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