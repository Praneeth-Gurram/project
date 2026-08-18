from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class InventoryBase(BaseModel):
    item_name: str = Field(..., min_length=1, max_length=255)
    category: Optional[str] = None
    status: str = Field(default="Available")
    quantity: int = Field(default=0, ge=0)
    region: Optional[str] = None
    reorder_level: int = Field(default=0, ge=0)


class InventoryCreate(InventoryBase):
    pass


class InventoryUpdate(BaseModel):
    item_name: Optional[str] = None
    category: Optional[str] = None
    status: Optional[str] = None
    quantity: Optional[int] = None
    region: Optional[str] = None
    reorder_level: Optional[int] = None


class InventoryResponse(InventoryBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class InventoryDetailResponse(InventoryResponse):
    pass
