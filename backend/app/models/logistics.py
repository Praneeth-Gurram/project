from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.sql import func

try:
    from backend.app.database.database import Base
except ModuleNotFoundError:
    from app.database.database import Base


class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    category = Column(String, default="3PL")
    status = Column(String, default="Healthy")
    region = Column(String)
    risk_score = Column(Float, default=0.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    order_number = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    category = Column(String)
    status = Column(String, default="Pending")
    value = Column(Float, default=0.0)
    region = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Shipment(Base):
    __tablename__ = "shipments"

    id = Column(Integer, primary_key=True, index=True)
    shipment_number = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    status = Column(String, default="In Transit")
    region = Column(String)
    category = Column(String, default="Route")
    traffic_status = Column(String, default="Clear")
    value = Column(Float, default=0.0)
    waiting_time = Column(Float, default=0.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Inventory(Base):
    __tablename__ = "inventory"

    id = Column(Integer, primary_key=True, index=True)
    item_name = Column(String, nullable=False)
    category = Column(String)
    status = Column(String, default="Available")
    quantity = Column(Integer, default=0)
    region = Column(String)
    reorder_level = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    shipment_id = Column(Integer, ForeignKey("shipments.id"), nullable=False)
    predicted_delay_minutes = Column(Float, default=0.0)
    delay_probability = Column(Float, default=0.0)
    risk_level = Column(String, default="Low")
    confidence_score = Column(Float, default=0.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True)
    shipment_id = Column(Integer, ForeignKey("shipments.id"), nullable=False)
    title = Column(String, nullable=False)
    reason = Column(String, nullable=False)
    expected_savings = Column(Float, default=0.0)
    status = Column(String, default="Pending")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
