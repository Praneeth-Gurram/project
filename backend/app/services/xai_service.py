import xgboost as xgb
import shap
import pickle
import numpy as np
import pandas as pd
import json

class XAIService:
    def __init__(self, model_path="ml/artifacts/xgboost_model.json", explainer_path="ml/artifacts/explainer.pkl"):
        # We'll load these lazily or during startup
        self.model = None
        self.explainer = None
        self.model_path = model_path
        self.explainer_path = explainer_path
        
        self.feature_names = [
            'Demand_Forecast', 'Asset_Utilization', 'Temperature', 'Humidity', 
            'Inventory_Level', 'User_Transaction_Amount', 'User_Purchase_Frequency'
        ]
        
        # Business friendly names
        self.business_names = {
            'Demand_Forecast': 'Expected Customer Demand',
            'Asset_Utilization': 'Vehicle Utilization Rate',
            'Temperature': 'Weather Temperature',
            'Humidity': 'Weather Humidity',
            'Inventory_Level': 'Warehouse Inventory Level',
            'User_Transaction_Amount': 'Transaction Value',
            'User_Purchase_Frequency': 'Client Priority (Purchase Freq)'
        }

    def load_artifacts(self):
        if self.model is None:
            import os
            base_artifacts = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "artifacts"))
            model_paths = [
                os.path.join(base_artifacts, "xgboost_model.json"),
                self.model_path,
                os.path.join(os.path.dirname(__file__), "..", "artifacts", "xgboost_model.json"),
                "backend/artifacts/xgboost_model.json",
                "ml/artifacts/xgboost_model.json"
            ]
            explainer_paths = [
                os.path.join(base_artifacts, "explainer.pkl"),
                self.explainer_path,
                os.path.join(os.path.dirname(__file__), "..", "artifacts", "explainer.pkl"),
                "backend/artifacts/explainer.pkl",
                "ml/artifacts/explainer.pkl"
            ]
            
            resolved_model = next((p for p in model_paths if os.path.exists(p)), self.model_path)
            resolved_explainer = next((p for p in explainer_paths if os.path.exists(p)), self.explainer_path)

            self.model = xgb.XGBRegressor()
            self.model.load_model(resolved_model)
            
            with open(resolved_explainer, "rb") as f:
                self.explainer = pickle.load(f)

    def explain_prediction(self, features_dict: dict):
        self.load_artifacts()
        
        # Convert to DataFrame
        df = pd.DataFrame([features_dict], columns=self.feature_names)
        
        # Get SHAP values
        shap_values = self.explainer(df)
        
        # For a single prediction, get the first row
        base_value = float(shap_values.base_values[0])
        values = shap_values.values[0].tolist()
        data = shap_values.data[0].tolist()
        
        # Map to feature names
        contributions = []
        for i, val in enumerate(values):
            fname = self.feature_names[i]
            contributions.append({
                "feature": fname,
                "business_name": self.business_names.get(fname, fname),
                "value": round(float(data[i]), 2),
                "contribution": round(float(val), 2),
                "impact": abs(float(val))
            })
            
        # Sort by impact
        contributions = sorted(contributions, key=lambda x: x["impact"], reverse=True)
        
        prediction = base_value + sum([c["contribution"] for c in contributions])
        
        return {
            "prediction": round(prediction, 1),
            "base_value": round(base_value, 1),
            "contributions": contributions
        }

    def generate_business_translation(self, prediction_data):
        prediction = prediction_data["prediction"]
        contributions = prediction_data["contributions"]
        
        if prediction > 60:  # Assuming prediction is in minutes/hours
            text = f"The shipment is predicted to experience a significant delay ({prediction} mins) primarily because "
        elif prediction > 30:
            text = f"The shipment is predicted to experience a moderate delay ({prediction} mins) because "
        else:
            text = f"The shipment is predicted to be on time (Expected wait: {prediction} mins). The main factors are "
            
        top_factors = contributions[:3]
        reasons = []
        for factor in top_factors:
            if factor["contribution"] > 0:
                if factor["feature"] == "Inventory_Level":
                    reasons.append("inventory levels are below the safety stock threshold")
                elif factor["feature"] == "Temperature":
                    reasons.append("severe weather conditions are forecast")
                elif factor["feature"] == "Demand_Forecast":
                    reasons.append("we are experiencing an unusually high volume of demand")
                else:
                    reasons.append(f"{factor['business_name'].lower()} is abnormally high")
            else:
                reasons.append(f"good {factor['business_name'].lower()} is reducing the risk")
                
        text += ", ".join(reasons[:-1])
        if len(reasons) > 1:
            text += f", and {reasons[-1]}."
        else:
            text += f"{reasons[0]}."
            
        return text
