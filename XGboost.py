import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from sklearn.model_selection import train_test_split, StratifiedKFold, RandomizedSearchCV

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