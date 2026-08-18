from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class SupplierBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    category: Optional[str] = None
    status: str = Field(default="Healthy")
    region: Optional[str] = None
    risk_score: float = Field(default=0.0, ge=0.0, le=1.0)


class SupplierCreate(SupplierBase):
    pass


class SupplierUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    status: Optional[str] = None
    region: Optional[str] = None
    risk_score: Optional[float] = None


class SupplierResponse(SupplierBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class SupplierDetailResponse(SupplierResponse):
    pass
