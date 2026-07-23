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
# ---------------------------------------------------------------------------
# 5. HYPERPARAMETER TUNING (RandomizedSearchCV)
# ---------------------------------------------------------------------------
param_dist = {
    "n_estimators": [150, 250, 350, 500],
    "max_depth": [3, 4, 5, 6],
    "learning_rate": [0.01, 0.03, 0.05, 0.1],
    "subsample": [0.7, 0.8, 0.9, 1.0],
    "colsample_bytree": [0.6, 0.8, 1.0],
    "min_child_weight": [1, 3, 5],
    "gamma": [0, 0.1, 0.3],
}

cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=RANDOM_STATE)

search = RandomizedSearchCV(
    estimator=XGBClassifier(
        eval_metric="logloss", random_state=RANDOM_STATE, n_jobs=-1
    ),
    param_distributions=param_dist,
    n_iter=25,
    scoring="roc_auc",
    cv=cv,
    random_state=RANDOM_STATE,
    n_jobs=-1,
    verbose=0,
)
search.fit(X_train, y_train)

model = search.best_estimator_
print("\nBest params:", search.best_params_)
print(f"Best CV ROC-AUC: {search.best_score_:.4f}")
# ---------------------------------------------------------------------------
# 6. EVALUATION
# ---------------------------------------------------------------------------
y_pred = model.predict(X_test)
y_proba = model.predict_proba(X_test)[:, 1]

metrics = {
    "accuracy": accuracy_score(y_test, y_pred),
    "precision": precision_score(y_test, y_pred),
    "recall": recall_score(y_test, y_pred),
    "f1_score": f1_score(y_test, y_pred),
    "roc_auc": roc_auc_score(y_test, y_proba),
}

print("\n=== Test Set Performance ===")
for k, v in metrics.items():
    print(f"{k:10s}: {v:.4f}")

print("\nClassification report:\n", classification_report(y_test, y_pred, target_names=["On-Time", "Delayed"]))

cm = confusion_matrix(y_test, y_pred)
print("Confusion matrix:\n", cm)

# ---------------------------------------------------------------------------
# 7. FEATURE IMPORTANCE PLOT
# ---------------------------------------------------------------------------
importances = pd.Series(model.feature_importances_, index=X.columns).sort_values()

plt.figure(figsize=(8, 6))
importances.plot(kind="barh", color="#4C72B0")
plt.title("XGBoost Feature Importance - Shipment Delay Prediction")
plt.xlabel("Importance")
plt.tight_layout()
plt.savefig("feature_importance.png", dpi=150)
print("\nSaved feature_importance.png")

# ROC curve
plt.figure(figsize=(6, 6))
RocCurveDisplay.from_predictions(y_test, y_proba)
plt.title("ROC Curve - Delay Prediction")
plt.tight_layout()
plt.savefig("roc_curve.png", dpi=150)
print("Saved roc_curve.png")
# ---------------------------------------------------------------------------
# 8. PERSIST MODEL + ENCODERS  (consumed by the FastAPI write-back service
#    and the SciPy/PuLP prescriptive solver in Week 2)
# ---------------------------------------------------------------------------
model.save_model("delay_model.json")

with open("encoders.pkl", "wb") as f:
    pickle.dump(encoders, f)

with open("feature_columns.json", "w") as f:
    json.dump(list(X.columns), f)

with open("metrics.json", "w") as f:
    json.dump({k: float(v) for k, v in metrics.items()}, f, indent=2)

print("\nSaved delay_model.json, encoders.pkl, feature_columns.json, metrics.json")
# ---------------------------------------------------------------------------
# 9. INFERENCE HELPER
#    Called by the FastAPI endpoint (e.g. POST /predict) that feeds the
#    Retool/React dashboard and, when delay probability crosses a threshold,
#    triggers the Prescriptive Solver to generate the 3 alternatives.
# ---------------------------------------------------------------------------
def predict_delay_probability(record: dict, model=model, encoders=encoders, feature_cols=list(X.columns)):
    """
    record: dict with raw field values matching the original dataset columns
            (Asset_ID, Latitude, Longitude, Inventory_Level, Temperature,
             Humidity, Waiting_Time, User_Transaction_Amount,
             User_Purchase_Frequency, Logistics_Delay_Reason,
             Asset_Utilization, Demand_Forecast, Timestamp)
    returns: probability (0-1) that the shipment will be delayed
    """
    row = record.copy()
    ts = pd.to_datetime(row.pop("Timestamp"))
    row["Hour"] = ts.hour
    row["DayOfWeek"] = ts.dayofweek
    row["Month"] = ts.month
    row["IsWeekend"] = int(ts.dayofweek >= 5)
    row["Logistics_Delay_Reason"] = row.get("Logistics_Delay_Reason") or "None"

    for col, le in encoders.items():
        val = row[col]
        row[col] = le.transform([val])[0] if val in le.classes_ else -1

    x_row = pd.DataFrame([row])[feature_cols]
    return float(model.predict_proba(x_row)[0, 1])


if __name__ == "__main__":
    sample = df.iloc[0].to_dict()
    prob = predict_delay_probability({k: sample[k] for k in
        ["Asset_ID", "Latitude", "Longitude", "Inventory_Level", "Temperature",
         "Humidity", "Waiting_Time", "User_Transaction_Amount",
         "User_Purchase_Frequency", "Logistics_Delay_Reason",
         "Asset_Utilization", "Demand_Forecast", "Timestamp"]})
    print(f"\nSample inference -> Delay probability: {prob:.3f}")