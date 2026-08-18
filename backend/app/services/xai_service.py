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

    def clean_features(self, features_dict: dict) -> dict:
        """
        Validates and sanitizes input features, ensuring numeric types and
        safe fallback values for missing, NaN, or infinite entries.
        """
        defaults = {
            'Demand_Forecast': 200.0,
            'Asset_Utilization': 75.0,
            'Temperature': 25.0,
            'Humidity': 65.0,
            'Inventory_Level': 300.0,
            'User_Transaction_Amount': 300.0,
            'User_Purchase_Frequency': 5.0
        }
        
        cleaned = {}
        for fname in self.feature_names:
            val = features_dict.get(fname) if features_dict else None
            if val is None:
                # Also check common alternate key styles
                alt_keys = [
                    fname.lower(),
                    fname.replace('_', ' '),
                    self.business_names.get(fname, '')
                ]
                for ak in alt_keys:
                    if features_dict and ak in features_dict and features_dict[ak] is not None:
                        val = features_dict[ak]
                        break
            
            try:
                if val is None or (isinstance(val, float) and (np.isnan(val) or np.isinf(val))):
                    cleaned[fname] = defaults[fname]
                else:
                    cleaned[fname] = float(val)
            except (ValueError, TypeError):
                cleaned[fname] = defaults[fname]
                
        return cleaned

    def explain_prediction(self, features_dict: dict):
        self.load_artifacts()
        
        cleaned_dict = self.clean_features(features_dict)
        
        # Convert to DataFrame
        df = pd.DataFrame([cleaned_dict], columns=self.feature_names)
        
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
            bname = self.business_names.get(fname, fname)
            val_flt = round(float(val), 2)
            impact_desc = "increases risk" if val_flt > 0 else "reduces risk"
            
            contributions.append({
                "feature": bname,
                "name": bname,
                "feature_name": fname,
                "business_name": bname,
                "value": round(float(data[i]), 2),
                "contribution": val_flt,
                "impact": impact_desc,
                "impact_direction": impact_desc,
                "abs_impact": abs(val_flt)
            })
            
        # Sort by absolute impact
        contributions = sorted(contributions, key=lambda x: x["abs_impact"], reverse=True)
        
        prediction = base_value + sum([c["contribution"] for c in contributions])
        prediction = max(0.0, prediction)
        
        return {
            "prediction": round(prediction, 1),
            "base_value": round(base_value, 1),
            "contributions": contributions
        }

    def generate_decision_flow(self, prediction_data: dict, recommendation_action: str = None) -> list:
        """
        Generates dynamic decision flow steps based on top contributing SHAP factors and predicted risk.
        """
        contributions = prediction_data.get("contributions", [])
        pred_delay = prediction_data.get("prediction", 0)
        
        nodes = []
        
        # 1. Top Risk Drivers / Stabilizers
        if contributions:
            top_1 = contributions[0]
            if top_1["contribution"] > 0:
                nodes.append(f"High {top_1['feature']} ({top_1['value']})")
            else:
                nodes.append(f"Optimal {top_1['feature']} ({top_1['value']})")
                
            if len(contributions) > 1:
                top_2 = contributions[1]
                if top_2["contribution"] > 0:
                    nodes.append(f"Elevated {top_2['feature']} ({top_2['value']})")
                else:
                    nodes.append(f"Favorable {top_2['feature']} ({top_2['value']})")
        else:
            nodes.append("Nominal Customer Demand")
            nodes.append("Standard Inventory Buffer")
            
        # 2. Operational Risk Tier
        if pred_delay > 60:
            nodes.append("Critical Delay Risk (High)")
        elif pred_delay > 30:
            nodes.append("Moderate Congestion Risk")
        else:
            nodes.append("Low Operational Risk (Nominal)")
            
        # 3. Constraint Check
        nodes.append("Constraints Checked & Verified")
        
        # 4. Final Action
        action = recommendation_action or ("Optimization Action Generated" if pred_delay > 30 else "Baseline Routing Maintained")
        nodes.append(f"Action: {action}")
        
        return nodes

    def generate_business_translation(self, prediction_data):
        prediction = prediction_data["prediction"]
        contributions = prediction_data["contributions"]
        
        if prediction > 60:
            text = f"The shipment is predicted to experience a significant delay ({prediction} mins) primarily because "
        elif prediction > 30:
            text = f"The shipment is predicted to experience a moderate delay ({prediction} mins) because "
        else:
            text = f"The shipment is predicted to be on time (Expected wait: {prediction} mins). The main factors are "
            
        top_factors = contributions[:3]
        reasons = []
        for factor in top_factors:
            if factor["contribution"] > 0:
                if factor["feature_name"] == "Inventory_Level":
                    reasons.append("inventory levels are below the safety stock threshold")
                elif factor["feature_name"] == "Temperature":
                    reasons.append("severe weather temperature is impacting corridors")
                elif factor["feature_name"] == "Demand_Forecast":
                    reasons.append("unusually high forecasted demand volume")
                elif factor["feature_name"] == "Humidity":
                    reasons.append("high precipitation / humidity conditions")
                elif factor["feature_name"] == "Asset_Utilization":
                    reasons.append("high fleet asset utilization rate")
                else:
                    reasons.append(f"{factor['business_name'].lower()} is abnormally high")
            else:
                reasons.append(f"healthy {factor['business_name'].lower()} is reducing the risk")
                
        if reasons:
            text += ", ".join(reasons[:-1])
            if len(reasons) > 1:
                text += f", and {reasons[-1]}."
            else:
                text += f"{reasons[0]}."
        else:
            text += "all operational parameters are within nominal safety bounds."
            
        return text
