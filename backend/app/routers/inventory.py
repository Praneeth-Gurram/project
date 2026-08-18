from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

try:
    from backend.app.database.database import get_db
    from backend.app.models.logistics import Inventory
    from backend.app.schemas.inventory import InventoryCreate, InventoryDetailResponse, InventoryResponse, InventoryUpdate
except ModuleNotFoundError:
    from app.database.database import get_db
    from app.models.logistics import Inventory
    from app.schemas.inventory import InventoryCreate, InventoryDetailResponse, InventoryResponse, InventoryUpdate

router = APIRouter(prefix="/api/inventory", tags=["inventory"])


@router.get("", response_model=list[InventoryResponse])
def list_inventory(
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    search: str = Query(None),
    region: str = Query(None),
    status: str = Query(None),
    low_stock: bool = Query(False),
    sort_by: str = Query("id"),
):
    """List inventory items with pagination and filtering."""
    query = db.query(Inventory)

    if search:
        query = query.filter(Inventory.item_name.ilike(f"%{search}%"))

    if region:
        query = query.filter(Inventory.region == region)

    if status:
        query = query.filter(Inventory.status == status)

    if low_stock:
        query = query.filter(Inventory.quantity <= Inventory.reorder_level)

    query = query.order_by(getattr(Inventory, sort_by, Inventory.id))
    return query.offset(skip).limit(limit).all()


@router.get("/{item_id}", response_model=InventoryDetailResponse)
def get_inventory_item(item_id: int, db: Session = Depends(get_db)):
    """Get a specific inventory item by ID."""
    item = db.query(Inventory).filter(Inventory.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    return item


@router.post("", response_model=InventoryResponse, status_code=201)
def create_inventory_item(item: InventoryCreate, db: Session = Depends(get_db)):
    """Create a new inventory item."""
    db_item = Inventory(**item.dict())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item


@router.patch("/{item_id}", response_model=InventoryResponse)
def update_inventory_item(
    item_id: int, item: InventoryUpdate, db: Session = Depends(get_db)
):
    """Update an inventory item."""
    db_item = db.query(Inventory).filter(Inventory.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Inventory item not found")

    update_data = item.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_item, key, value)

    db.commit()
    db.refresh(db_item)
    return db_item


@router.delete("/{item_id}", status_code=204)
def delete_inventory_item(item_id: int, db: Session = Depends(get_db)):
    """Delete an inventory item."""
    db_item = db.query(Inventory).filter(Inventory.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Inventory item not found")

    db.delete(db_item)
    db.commit()
    return None
