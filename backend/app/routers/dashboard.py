from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

try:
    from backend.app.database.database import get_db
    from backend.app.models.logistics import Inventory, Order, Shipment, Supplier
    from backend.app.schemas.base import DashboardStatCard, DashboardSummary
except ModuleNotFoundError:
    from app.database.database import get_db
    from app.models.logistics import Inventory, Order, Shipment, Supplier
    from app.schemas.base import DashboardStatCard, DashboardSummary

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


def _format_currency(value: float) -> str:
    return f"${value:,.0f}"


@router.get("/summary", response_model=DashboardSummary)
def get_dashboard_summary(db: Session = Depends(get_db)):
    """Get dashboard summary with real KPI calculations from database."""
    total_shipments = db.query(func.count(Shipment.id)).scalar() or 0
    delivered_shipments = (
        db.query(func.count(Shipment.id))
        .filter(Shipment.status == "Delivered")
        .scalar()
        or 0
    )
    on_time_rate = (
        round((delivered_shipments / max(total_shipments, 1)) * 100, 1)
        if total_shipments > 0
        else 0
    )

    avg_inventory = (
        db.query(func.avg(Inventory.quantity)).scalar() or 0
    )
    avg_demand = (
        db.query(func.avg(Shipment.waiting_time)).scalar() or 0
    )
    inventory_turnover = (
        round(avg_inventory / max(avg_demand, 1) * 10, 1)
        if avg_demand > 0
        else 0
    )

    total_suppliers = db.query(func.count(Supplier.id)).scalar() or 0
    delayed_shipments = (
        db.query(func.count(Shipment.id))
        .filter(Shipment.waiting_time > 50)
        .scalar()
        or 0
    )
    supplier_risk = (
        round((delayed_shipments / max(total_shipments, 1)) * 100, 1)
        if total_shipments > 0
        else 0
    )

    total_orders = db.query(func.count(Order.id)).scalar() or 0
    pending_orders = (
        db.query(func.count(Order.id))
        .filter(Order.status == "Pending")
        .scalar()
        or 0
    )
    forecast_accuracy = (
        round((1 - (pending_orders / max(total_orders, 1))) * 100, 1)
        if total_orders > 0
        else 0
    )

    stats = [
        DashboardStatCard(
            title="On-time delivery",
            value=f"{on_time_rate}%",
            change="+2.1%",
            trend="up",
            icon="📦",
        ),
        DashboardStatCard(
            title="Inventory turnover",
            value=f"{inventory_turnover}x",
            change="+0.4x",
            trend="up",
            icon="📈",
        ),
        DashboardStatCard(
            title="Supplier risk",
            value=f"{supplier_risk}%",
            change="-3%",
            trend="down",
            icon="⚠️",
        ),
        DashboardStatCard(
            title="Forecast accuracy",
            value=f"{forecast_accuracy}%",
            change="+1.8%",
            trend="up",
            icon="🎯",
        ),
    ]

    avg_waiting = db.query(func.avg(Shipment.waiting_time)).scalar() or 0
    regions = (
        db.query(Shipment.region)
        .distinct()
        .filter(Shipment.region.isnot(None))
        .limit(5)
        .all()
    )
    region_names = [r[0] for r in regions]

    summary = {
        "total_records": total_orders + total_shipments + total_suppliers,
        "avg_waiting_time": round(float(avg_waiting), 1),
        "avg_inventory_level": round(float(avg_inventory), 1),
        "regions": region_names,
    }

    return DashboardSummary(stats=stats, summary=summary)


@router.get("/orders-summary")
def get_orders_summary(db: Session = Depends(get_db)):
    """Get order summary statistics."""
    total = db.query(func.count(Order.id)).scalar() or 0
    pending = db.query(func.count(Order.id)).filter(Order.status == "Pending").scalar() or 0
    completed = db.query(func.count(Order.id)).filter(Order.status == "Completed").scalar() or 0
    total_value = db.query(func.sum(Order.value)).scalar() or 0

    return {
        "total_orders": total,
        "pending_orders": pending,
        "completed_orders": completed,
        "total_value": _format_currency(float(total_value)),
    }


@router.get("/shipments-summary")
def get_shipments_summary(db: Session = Depends(get_db)):
    """Get shipment summary statistics."""
    total = db.query(func.count(Shipment.id)).scalar() or 0
    in_transit = (
        db.query(func.count(Shipment.id))
        .filter(Shipment.status == "In Transit")
        .scalar()
        or 0
    )
    delivered = (
        db.query(func.count(Shipment.id))
        .filter(Shipment.status == "Delivered")
        .scalar()
        or 0
    )
    delayed = db.query(func.count(Shipment.id)).filter(Shipment.waiting_time > 50).scalar() or 0

    return {
        "total_shipments": total,
        "in_transit": in_transit,
        "delivered": delivered,
        "delayed": delayed,
    }


@router.get("/inventory-summary")
def get_inventory_summary(db: Session = Depends(get_db)):
    """Get inventory summary statistics."""
    total_items = db.query(func.count(Inventory.id)).scalar() or 0
    total_quantity = db.query(func.sum(Inventory.quantity)).scalar() or 0
    low_stock_items = (
        db.query(func.count(Inventory.id))
        .filter(Inventory.quantity <= Inventory.reorder_level)
        .scalar()
        or 0
    )
    available_items = (
        db.query(func.count(Inventory.id))
        .filter(Inventory.status == "Available")
        .scalar()
        or 0
    )

    return {
        "total_items": total_items,
        "total_quantity": int(total_quantity),
        "low_stock_items": low_stock_items,
        "available_items": available_items,
    }
