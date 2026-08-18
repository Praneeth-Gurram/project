from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

try:
    from backend.app.database.database import get_db
    from backend.app.models.logistics import Supplier
    from backend.app.schemas.supplier import SupplierCreate, SupplierDetailResponse, SupplierResponse, SupplierUpdate
except ModuleNotFoundError:
    from app.database.database import get_db
    from app.models.logistics import Supplier
    from app.schemas.supplier import SupplierCreate, SupplierDetailResponse, SupplierResponse, SupplierUpdate

router = APIRouter(prefix="/api/suppliers", tags=["suppliers"])


@router.get("", response_model=list[SupplierResponse])
def list_suppliers(
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    search: str = Query(None),
    status: str = Query(None),
    region: str = Query(None),
    sort_by: str = Query("id"),
):
    """List suppliers with pagination and filtering."""
    query = db.query(Supplier)

    if search:
        query = query.filter(Supplier.name.ilike(f"%{search}%"))

    if status:
        query = query.filter(Supplier.status == status)

    if region:
        query = query.filter(Supplier.region == region)

    query = query.order_by(getattr(Supplier, sort_by, Supplier.id))
    return query.offset(skip).limit(limit).all()


@router.get("/{supplier_id}", response_model=SupplierDetailResponse)
def get_supplier(supplier_id: int, db: Session = Depends(get_db)):
    """Get a specific supplier by ID."""
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return supplier


@router.post("", response_model=SupplierResponse, status_code=201)
def create_supplier(supplier: SupplierCreate, db: Session = Depends(get_db)):
    """Create a new supplier."""
    db_supplier = Supplier(**supplier.dict())
    db.add(db_supplier)
    db.commit()
    db.refresh(db_supplier)
    return db_supplier


@router.patch("/{supplier_id}", response_model=SupplierResponse)
def update_supplier(
    supplier_id: int, supplier: SupplierUpdate, db: Session = Depends(get_db)
):
    """Update a supplier."""
    db_supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not db_supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")

    update_data = supplier.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_supplier, key, value)

    db.commit()
    db.refresh(db_supplier)
    return db_supplier


@router.delete("/{supplier_id}", status_code=204)
def delete_supplier(supplier_id: int, db: Session = Depends(get_db)):
    """Delete a supplier."""
    db_supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not db_supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")

    db.delete(db_supplier)
    db.commit()
    return None
