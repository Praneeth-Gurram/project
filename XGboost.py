import json
import pickle
import warnings

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from sklearn.model_selection import train_test_split, StratifiedKFold, RandomizedSearchCV
from sklearn.preprocessing import LabelEncoder
from scipy.special import expit
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix, classification_report, RocCurveDisplay
)
from xgboost import XGBClassifier

warnings.filterwarnings("ignore")

RANDOM_STATE = 42
DATA_PATH = "smart_logistics_dataset.xlsx"
TARGET = "Logistics_Delay"

#importing dataset

df = pd.read_excel(DATA_PATH)
print(f"Loaded {df.shape[0]} rows, {df.shape[1]} columns")
np.random.seed(RANDOM_STATE)

#---------------------------------------------------------------------------
#  Calculate risk
# ---------------------------------------------------------------------------

inv_risk  = (500 - df["Inventory_Level"]) / (500 - 100)        # low inventory -> risk
wait_risk = (df["Waiting_Time"] - 10) / (60 - 10)               # long wait -> risk
dem_risk  = (df["Demand_Forecast"] - 100) / (300 - 100)         # high demand -> risk
util_risk = (100 - df["Asset_Utilization"]) / (100 - 60)        # low utilization -> risk

risk_score = (
    1.0 * inv_risk + 1.0 * wait_risk + 1.0 * dem_risk + 1.0 * util_risk
    + np.random.normal(0, 0.3, len(df))
)

# Convert risk score to probability, centered on the sample median so the
# threshold isn't an arbitrary guess that skews class balance.
delay_probability = expit((risk_score - risk_score.median()) * 2)

# Create target based on probability threshold
df["Logistics_Delay"] = (delay_probability > 0.5).astype(int)

#---------------------------------------------------------------------------
# 2. FEATURE ENGINEERING
# ---------------------------------------------------------------------------

df["Timestamp"] = pd.to_datetime(df["Timestamp"])
df["Hour"] = df["Timestamp"].dt.hour
df["DayOfWeek"] = df["Timestamp"].dt.dayofweek
df["Month"] = df["Timestamp"].dt.month
df["IsWeekend"] = (df["DayOfWeek"] >= 5).astype(int)
 
# Logistics_Delay_Reason is only populated when a delay reason was logged.
# Missing = "no reason recorded" rather than missing data, so it's a real category.
def get_reason(row):

    if row["Inventory_Level"] < 300:
        return "Low Inventory"

    elif row["Waiting_Time"] > 10:
        return "Traffic Congestion"

    elif row["Demand_Forecast"] > 700:
        return "High Demand"

    elif row["Asset_Utilization"] < 70:
        return "Low Asset Utilization"

    else:
        return "None"

df["Logistics_Delay_Reason"] = df.apply(get_reason, axis=1)

df["Shipment_Status"] = np.where(
    df["Logistics_Delay"] == 1,
    "Delayed",
    "On Schedule"
)
df["Traffic_Status"] = np.where(
    df["Waiting_Time"] > 10,
    "Heavy",
    np.where(
        df["Waiting_Time"] > 5,
        "Moderate",
        "Light"
    )
)

#leakage columns
LEAKAGE_COLS = ["Shipment_Status", "Traffic_Status"]
DROP_COLS = ["Timestamp","Asset_ID","Logistics_Delay_Reason"] + LEAKAGE_COLS

#CATEGORICAL_COLS = ["Asset_ID", "Logistics_Delay_Reason"]
FEATURE_COLS = [c for c in df.columns if c not in DROP_COLS + [TARGET]]

X = df[FEATURE_COLS].copy()
y = df[TARGET].copy()

# Label-encode categoricals (tree models don't need scaling; this keeps
# things simple and fast for XGBoost's native handling of integer codes).
encoders = {}
#for col in CATEGORICAL_COLS:
#   le = LabelEncoder()
#   X[col] = le.fit_transform(X[col])
#    encoders[col] = le


print("\nFeatures used:", list(X.columns))

# ---------------------------------------------------------------------------
# 3. TRAIN / TEST SPLIT
# ---------------------------------------------------------------------------

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=RANDOM_STATE, stratify=y
)
print(f"\nTrain size: {X_train.shape[0]} | Test size: {X_test.shape[0]}")
print(f"Class balance (delay rate) - train: {y_train.mean():.3f}, test: {y_test.mean():.3f}")
# ---------------------------------------------------------------------------
# 4. BASELINE MODEL
# ---------------------------------------------------------------------------
base_model = XGBClassifier(
    n_estimators=300,
    max_depth=4,
    learning_rate=0.05,
    subsample=0.8,
    colsample_bytree=0.8,
    eval_metric="logloss",
    random_state=RANDOM_STATE,
    n_jobs=-1,
)

base_model.fit(
    X_train, y_train,
    eval_set=[(X_test, y_test)],
    verbose=False,
)
