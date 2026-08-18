try:
    from backend.app.schemas.base import APIResponse, DashboardStatCard, DashboardSummary, PaginatedResponse, PaginationMeta
    from backend.app.schemas.inventory import InventoryCreate, InventoryDetailResponse, InventoryResponse, InventoryUpdate
    from backend.app.schemas.order import OrderCreate, OrderDetailResponse, OrderResponse, OrderUpdate
    from backend.app.schemas.shipment import ShipmentCreate, ShipmentDetailResponse, ShipmentResponse, ShipmentUpdate
    from backend.app.schemas.supplier import SupplierCreate, SupplierDetailResponse, SupplierResponse, SupplierUpdate
except ModuleNotFoundError:
    from app.schemas.base import APIResponse, DashboardStatCard, DashboardSummary, PaginatedResponse, PaginationMeta
    from app.schemas.inventory import InventoryCreate, InventoryDetailResponse, InventoryResponse, InventoryUpdate
    from app.schemas.order import OrderCreate, OrderDetailResponse, OrderResponse, OrderUpdate
    from app.schemas.shipment import ShipmentCreate, ShipmentDetailResponse, ShipmentResponse, ShipmentUpdate
    from app.schemas.supplier import SupplierCreate, SupplierDetailResponse, SupplierResponse, SupplierUpdate

__all__ = [
    "OrderCreate",
    "OrderUpdate",
    "OrderResponse",
    "OrderDetailResponse",
    "ShipmentCreate",
    "ShipmentUpdate",
    "ShipmentResponse",
    "ShipmentDetailResponse",
    "SupplierCreate",
    "SupplierUpdate",
    "SupplierResponse",
    "SupplierDetailResponse",
    "InventoryCreate",
    "InventoryUpdate",
    "InventoryResponse",
    "InventoryDetailResponse",
    "APIResponse",
    "DashboardSummary",
    "DashboardStatCard",
    "PaginatedResponse",
    "PaginationMeta",
]
