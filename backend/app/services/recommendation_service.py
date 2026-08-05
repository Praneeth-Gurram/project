import random

class RecommendationService:
    def __init__(self):
        # We define a set of baseline recommendations
        self.recommendation_catalog = [
            {
                "name": "Air Freight",
                "reason_template": "Air freight reduces the predicted delay from {delay} days to {new_delay} days and minimizes customer impact despite higher transportation costs.",
                "cost_multiplier": 3.0,
                "delay_reduction_pct": 0.85,
                "risk_reduction": "High",
                "confidence": 97
            },
            {
                "name": "Change Supplier",
                "reason_template": "Switching to an alternate regional supplier bypasses the current congestion, reducing the delay from {delay} days to {new_delay} days.",
                "cost_multiplier": 1.2,
                "delay_reduction_pct": 0.50,
                "risk_reduction": "Medium",
                "confidence": 88
            },
            {
                "name": "Expedited Ground Transport",
                "reason_template": "Using an expedited LTL carrier avoids primary bottlenecks, cutting the {delay}-day delay down to {new_delay} days.",
                "cost_multiplier": 1.5,
                "delay_reduction_pct": 0.40,
                "risk_reduction": "Low",
                "confidence": 75
            }
        ]

    def generate_recommendation(self, prediction_data, shipment_data):
        """
        Dynamically generates a recommendation based on the highest SHAP contribution (Root Cause).
        """
        predicted_delay_mins = prediction_data["prediction"]
        predicted_delay_days = round(predicted_delay_mins / (24 * 60), 1)
        
        # If no significant delay, no recommendation needed
        if predicted_delay_days < 1.0:
            return None
            
        contributions = prediction_data["contributions"]
        top_factor = contributions[0]["feature"]
        
        # Select best recommendation based on top root cause
        if top_factor in ["Temperature", "Humidity"]:
            rec = self.recommendation_catalog[0] # Air Freight
        elif top_factor in ["Demand_Forecast", "Inventory_Level"]:
            rec = self.recommendation_catalog[1] # Change Supplier
        else:
            rec = self.recommendation_catalog[2] # Expedited
            
        base_cost = float(shipment_data.get("User_Transaction_Amount", 5000)) * 0.1 # Base logistics cost is 10% of transaction
        
        expected_cost = base_cost * rec["cost_multiplier"]
        new_delay_days = max(0.1, round(predicted_delay_days * (1 - rec["delay_reduction_pct"]), 1))
        
        # Mocking loss calculation: Every day of delay costs 5% of transaction value
        predicted_loss = float(shipment_data.get("User_Transaction_Amount", 5000)) * 0.05 * predicted_delay_days
        new_loss = float(shipment_data.get("User_Transaction_Amount", 5000)) * 0.05 * new_delay_days
        
        expected_savings = predicted_loss - (expected_cost - base_cost)
        
        # ROI = (Net Profit / Cost of Investment) * 100
        roi = round((expected_savings / expected_cost) * 100, 1) if expected_cost > 0 else 0
        
        return {
            "Recommendation": rec["name"],
            "Reason": rec["reason_template"].format(delay=predicted_delay_days, new_delay=new_delay_days),
            "ExpectedCost": f"${int(expected_cost):,}",
            "ExpectedDelayReduction": f"{round(predicted_delay_days - new_delay_days, 1)} days",
            "RiskReduction": rec["risk_reduction"],
            "ExpectedSavings": f"${int(expected_savings):,}",
            "ExpectedROI": f"{roi}%",
            "Confidence": f"{rec['confidence']}%",
            "BusinessImpact": "Critical" if expected_savings > 10000 else "High"
        }
