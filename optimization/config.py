"""
SupplyPrescript Optimization Configuration

Configuration settings for the prescriptive
analytics engine.
"""

# Dataset Information

TARGET_COLUMN = "Logistics_Delay"

# Prediction Thresholds

HIGH_RISK_THRESHOLD = 0.75
MEDIUM_RISK_THRESHOLD = 0.50

# Dataset Columns

INVENTORY_COLUMN = "Inventory_Level"
WAITING_TIME_COLUMN = "Waiting_Time"
UTILIZATION_COLUMN = "Asset_Utilization"
DEMAND_COLUMN = "Demand_Forecast"
TRAFFIC_COLUMN = "Traffic_Status"
SHIPMENT_STATUS_COLUMN = "Shipment_Status"
DELAY_REASON_COLUMN = "Logistics_Delay_Reason"

# Optimization Limits

MAX_BUDGET = 50000
MAX_INVENTORY_INCREASE = 100
MAX_WAITING_TIME_REDUCTION = 60

# Recommendation Labels

RECOMMENDATIONS = {
    "inventory": "Increase Inventory",
    "dispatch": "Prioritize Dispatch",
    "traffic": "Alternative Route",
    "wait": "Reduce Waiting Time",
    "none": "No Action Required"
}