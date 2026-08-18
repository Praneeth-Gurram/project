from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

try:
    from backend.app.database.database import get_db
    from backend.app.models.logistics import Order
    from backend.app.schemas.order import OrderCreate, OrderDetailResponse, OrderResponse, OrderUpdate
except ModuleNotFoundError:
    from app.database.database import get_db
    from app.models.logistics import Order
    from app.schemas.order import OrderCreate, OrderDetailResponse, OrderResponse, OrderUpdate

router = APIRouter(prefix="/api/orders", tags=["orders"])


@router.get("", response_model=list[OrderResponse])
def list_orders(
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    search: str = Query(None),
    status: str = Query(None),
    region: str = Query(None),
    sort_by: str = Query("id"),
):
    """List orders with pagination and filtering."""
    query = db.query(Order)

    if search:
        query = query.filter(
            (Order.order_number.ilike(f"%{search}%")) | (Order.name.ilike(f"%{search}%"))
        )

    if status:
        query = query.filter(Order.status == status)

    if region:
        query = query.filter(Order.region == region)

    query = query.order_by(getattr(Order, sort_by, Order.id))
    return query.offset(skip).limit(limit).all()


@router.get("/{order_id}", response_model=OrderDetailResponse)
def get_order(order_id: int, db: Session = Depends(get_db)):
    """Get a specific order by ID."""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@router.post("", response_model=OrderResponse, status_code=201)
def create_order(order: OrderCreate, db: Session = Depends(get_db)):
    """Create a new order."""
    existing = db.query(Order).filter(Order.order_number == order.order_number).first()
    if existing:
        raise HTTPException(status_code=400, detail="Order number already exists")

    db_order = Order(**order.dict())
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    return db_order


@router.patch("/{order_id}", response_model=OrderResponse)
def update_order(order_id: int, order: OrderUpdate, db: Session = Depends(get_db)):
    """Update an order."""
    db_order = db.query(Order).filter(Order.id == order_id).first()
    if not db_order:
        raise HTTPException(status_code=404, detail="Order not found")

    update_data = order.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_order, key, value)

    db.commit()
    db.refresh(db_order)
    return db_order


@router.delete("/{order_id}", status_code=204)
def delete_order(order_id: int, db: Session = Depends(get_db)):
    """Delete an order."""
    db_order = db.query(Order).filter(Order.id == order_id).first()
    if not db_order:
        raise HTTPException(status_code=404, detail="Order not found")

    db.delete(db_order)
    db.commit()
    return None
