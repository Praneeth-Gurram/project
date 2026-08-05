import pandas as pd
import xgboost as xgb
import shap
import pickle
import os
import json

def train_and_save_model():
    print("Loading data...")
    df = pd.read_csv("../smart_logistics_engineered.csv")
    
    # We will predict 'Logistics_Delay' (Binary: 1 if Delayed, 0 if On-Time) 
    # Wait, the user wants "Predicted Delay" in days. 
    # Let's predict 'Waiting_Time' (Regression) to be more prescriptive and give a number of days/mins.
    
    target = 'Waiting_Time'
    
    # Features to use
    features = [
        'Demand_Forecast', 'Asset_Utilization', 'Temperature', 'Humidity', 
        'Inventory_Level', 'User_Transaction_Amount', 'User_Purchase_Frequency'
    ]
    
    # In a real scenario we'd use categorical features too, but we need numerical for basic SHAP
    # Let's add some categorical features by one-hot encoding if needed, or just use numeric for simplicity
    
    X = df[features]
    y = df[target]
    
    print("Training XGBoost Regressor...")
    model = xgb.XGBRegressor(n_estimators=100, random_state=42, learning_rate=0.1)
    model.fit(X, y)
    
    print("Creating SHAP Explainer...")
    explainer = shap.Explainer(model)
    shap_values = explainer(X)
    
    print("Saving artifacts...")
    os.makedirs('artifacts', exist_ok=True)
    
    # Save Model
    model.save_model("artifacts/xgboost_model.json")
    
    # Save Explainer using pickle
    with open("artifacts/explainer.pkl", "wb") as f:
        pickle.dump(explainer, f)
        
    # Save a sample of the data for the API to use for local explanations
    # We will just save the first 100 rows to a JSON file for mock DB
    sample_df = df.head(100).copy()
    sample_df.to_json("artifacts/sample_shipments.json", orient="records")
    
    print("Model training complete!")

if __name__ == "__main__":
    train_and_save_model()
