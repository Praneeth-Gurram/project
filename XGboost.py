import json
import pickle
import warnings

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from sklearn.model_selection import train_test_split, StratifiedKFold, RandomizedSearchCV
from sklearn.preprocessing import LabelEncoder
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

df["Timestamp"] = pd.to_datetime(df["Timestamp"])
df["Hour"] = df["Timestamp"].dt.hour
df["DayOfWeek"] = df["Timestamp"].dt.dayofweek
df["Month"] = df["Timestamp"].dt.month
df["IsWeekend"] = (df["DayOfWeek"] >= 5).astype(int)
 
# Logistics_Delay_Reason is only populated when a delay reason was logged.
# Missing = "no reason recorded" rather than missing data, so it's a real category.
df["Logistics_Delay_Reason"] = df["Logistics_Delay_Reason"].fillna("None")


LEAKAGE_COLS = ["Shipment_Status", "Traffic_Status"]
DROP_COLS = ["Timestamp"] + LEAKAGE_COLS

CATEGORICAL_COLS = ["Asset_ID", "Logistics_Delay_Reason"]
FEATURE_COLS = [c for c in df.columns if c not in DROP_COLS + [TARGET]]

X = df[FEATURE_COLS].copy()
y = df[TARGET].copy()

# Label-encode categoricals (tree models don't need scaling; this keeps
# things simple and fast for XGBoost's native handling of integer codes).
encoders = {}
for col in CATEGORICAL_COLS:
    le = LabelEncoder()
    X[col] = le.fit_transform(X[col])
    encoders[col] = le

print("\nFeatures used:", list(X.columns))

# ---------------------------------------------------------------------------
# 3. TRAIN / TEST SPLIT
# ---------------------------------------------------------------------------

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=RANDOM_STATE, stratify=y
)
print(f"\nTrain size: {X_train.shape[0]} | Test size: {X_test.shape[0]}")
print(f"Class balance (delay rate) - train: {y_train.mean():.3f}, test: {y_test.mean():.3f}")
