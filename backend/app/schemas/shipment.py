from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class ShipmentBase(BaseModel):
    shipment_number: str = Field(..., min_length=1, max_length=100)
    name: str = Field(..., min_length=1, max_length=255)
    status: str = Field(default="In Transit")
    region: Optional[str] = None
    category: Optional[str] = None
    traffic_status: Optional[str] = None
    value: float = Field(default=0.0, ge=0)
    waiting_time: float = Field(default=0.0, ge=0)


class ShipmentCreate(ShipmentBase):
    pass


class ShipmentUpdate(BaseModel):
    name: Optional[str] = None
    status: Optional[str] = None
    region: Optional[str] = None
    category: Optional[str] = None
    traffic_status: Optional[str] = None
    value: Optional[float] = None
    waiting_time: Optional[float] = None


class ShipmentResponse(ShipmentBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class ShipmentDetailResponse(ShipmentResponse):
    pass
