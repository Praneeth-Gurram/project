from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

try:
    from backend.app.database.database import get_db
    from backend.app.models.logistics import Shipment
    from backend.app.schemas.shipment import ShipmentCreate, ShipmentDetailResponse, ShipmentResponse, ShipmentUpdate
except ModuleNotFoundError:
    from app.database.database import get_db
    from app.models.logistics import Shipment
    from app.schemas.shipment import ShipmentCreate, ShipmentDetailResponse, ShipmentResponse, ShipmentUpdate

router = APIRouter(prefix="/api/shipments", tags=["shipments"])


@router.get("", response_model=list[ShipmentResponse])
def list_shipments(
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    search: str = Query(None),
    status: str = Query(None),
    region: str = Query(None),
    traffic_status: str = Query(None),
    sort_by: str = Query("id"),
):
    """List shipments with pagination and filtering."""
    query = db.query(Shipment)

    if search:
        query = query.filter(
            (Shipment.shipment_number.ilike(f"%{search}%"))
            | (Shipment.name.ilike(f"%{search}%"))
        )

    if status:
        query = query.filter(Shipment.status == status)

    if region:
        query = query.filter(Shipment.region == region)

    if traffic_status:
        query = query.filter(Shipment.traffic_status == traffic_status)

    query = query.order_by(getattr(Shipment, sort_by, Shipment.id))
    return query.offset(skip).limit(limit).all()


@router.get("/{shipment_id}", response_model=ShipmentDetailResponse)
def get_shipment(shipment_id: int, db: Session = Depends(get_db)):
    """Get a specific shipment by ID."""
    shipment = db.query(Shipment).filter(Shipment.id == shipment_id).first()
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")
    return shipment


@router.post("", response_model=ShipmentResponse, status_code=201)
def create_shipment(shipment: ShipmentCreate, db: Session = Depends(get_db)):
    """Create a new shipment."""
    existing = (
        db.query(Shipment)
        .filter(Shipment.shipment_number == shipment.shipment_number)
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Shipment number already exists")

    db_shipment = Shipment(**shipment.dict())
    db.add(db_shipment)
    db.commit()
    db.refresh(db_shipment)
    return db_shipment


@router.patch("/{shipment_id}", response_model=ShipmentResponse)
def update_shipment(
    shipment_id: int, shipment: ShipmentUpdate, db: Session = Depends(get_db)
):
    """Update a shipment."""
    db_shipment = db.query(Shipment).filter(Shipment.id == shipment_id).first()
    if not db_shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")

    update_data = shipment.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_shipment, key, value)

    db.commit()
    db.refresh(db_shipment)
    return db_shipment


@router.delete("/{shipment_id}", status_code=204)
def delete_shipment(shipment_id: int, db: Session = Depends(get_db)):
    """Delete a shipment."""
    db_shipment = db.query(Shipment).filter(Shipment.id == shipment_id).first()
    if not db_shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")

    db.delete(db_shipment)
    db.commit()
    return None
