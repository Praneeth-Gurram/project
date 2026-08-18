from typing import Optional

from pydantic import BaseModel


class DashboardStatCard(BaseModel):
    title: str
    value: str
    change: str
    trend: str
    icon: str


class DashboardSummary(BaseModel):
    stats: list[DashboardStatCard]
    summary: dict


class APIResponse(BaseModel):
    success: bool
    data: Optional[dict] = None
    message: str = ""
    error: Optional[dict] = None


class PaginationMeta(BaseModel):
    total: int
    page: int
    per_page: int
    pages: int


class PaginatedResponse(BaseModel):
    success: bool
    data: list
    pagination: PaginationMeta
    message: str = ""
