from __future__ import annotations

from pathlib import Path

import pandas as pd
from sqlalchemy import func

try:
    from backend.app.database.database import SessionLocal
    from backend.app.models.logistics import Inventory, Order, Shipment, Supplier
except ModuleNotFoundError:
    from app.database.database import SessionLocal
    from app.models.logistics import Inventory, Order, Shipment, Supplier

# Find project root by looking for smart_logistics_engineered.csv
ROOT_DIR = Path(__file__).resolve().parents[3]  # Go to project root
CSV_PATH = ROOT_DIR / "smart_logistics_engineered.csv"


def ensure_seed_data() -> dict:
    if not CSV_PATH.exists():
        return {"imported": 0, "status": "missing_csv"}

    db = SessionLocal()
    try:
        counts = {
            "orders": db.query(Order).count(),
            "shipments": db.query(Shipment).count(),
            "suppliers": db.query(Supplier).count(),
            "inventory": db.query(Inventory).count(),
        }

        if any(counts.values()):
            return {"imported": 0, "status": "already_seeded", "counts": counts}

        df = pd.read_csv(CSV_PATH)
        df = df.fillna({
            "Shipment_Status": "Unknown",
            "Geo_Cluster": "Unknown",
            "Traffic_Status": "Unknown",
            "Logistics_Delay_Reason": "",
            "Asset_ID": "Asset",
            "Inventory_Level": 0,
            "Demand_Forecast": 0,
            "User_Transaction_Amount": 0,
            "Waiting_Time": 0,
        })

        for idx, row in df.head(80).iterrows():
            order_number = f"ORD-{idx + 1:04d}"
            shipment_number = f"SHP-{idx + 1:04d}"
            region = str(row.get("Geo_Cluster", "Unknown"))
            status = str(row.get("Shipment_Status", "Unknown"))

            order = Order(
                order_number=order_number,
                name=f"Order {row.get('Asset_ID', 'Asset')}",
                category=str(row.get("Geo_Cluster", "Global")),
                status=status,
                value=float(row.get("User_Transaction_Amount", 0) or 0),
                region=region,
            )
            db.add(order)

            shipment = Shipment(
                shipment_number=shipment_number,
                name=f"Shipment {row.get('Asset_ID', 'Asset')}",
                status=status,
                region=region,
                category=str(row.get("Traffic_Status", "Route")),
                traffic_status=str(row.get("Traffic_Status", "Clear")),
                value=float(row.get("Revenue_Per_Wait_Minute", 0) or 0) * max(float(row.get("Waiting_Time", 0) or 0), 1),
                waiting_time=float(row.get("Waiting_Time", 0) or 0),
            )
            db.add(shipment)

            inventory = Inventory(
                item_name=f"Item {row.get('Asset_ID', 'Asset')}",
                category="Logistics",
                status="Low Stock" if int(row.get("Inventory_Level", 0) or 0) < 200 else "Available",
                quantity=int(row.get("Inventory_Level", 0) or 0),
                region=region,
                reorder_level=max(50, int((row.get("Demand_Forecast", 0) or 0) * 0.4)),
            )
            db.add(inventory)

            supplier = Supplier(
                name=f"{region} Logistics Partners",
                category="3PL",
                status="Healthy" if int(row.get("Asset_Performance_Score", 0) or 0) > 5000 else "Watch",
                region=region,
                risk_score=float(row.get("Asset_Performance_Score", 0) or 0) / 10000,
            )
            db.add(supplier)

        db.commit()
        return {"imported": 1, "status": "seeded"}
    finally:
        db.close()
