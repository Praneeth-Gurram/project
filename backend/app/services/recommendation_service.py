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
        predicted_delay_mins = prediction_data.get("prediction", 0.0)
        predicted_delay_days = round(predicted_delay_mins / (24 * 60), 2)
        
        # If no significant delay, no recommendation needed
        if predicted_delay_mins < 20.0:
            return {
                "action": "No action required",
                "Recommendation": "No action required",
                "impact": "--",
                "expected_impact": "--",
                "ExpectedDelayReduction": "--",
                "risk_reduction": "--",
                "RiskReduction": "--",
                "cost": 0,
                "estimated_cost": 0,
                "ExpectedCost": "--",
                "confidence": 95,
                "Confidence": "95%",
                "status": "Optimal",
                "reason": "Shipment is running within nominal on-time schedule tolerances.",
                "Reason": "Shipment is running within nominal on-time schedule tolerances.",
                "expected_savings": 0,
                "ExpectedSavings": "$0",
                "roi": 0,
                "ExpectedROI": "0%"
            }
            
        contributions = prediction_data.get("contributions", [])
        top_factor = contributions[0].get("feature_name", contributions[0].get("feature", "")) if contributions else "Demand_Forecast"
        
        # Select best recommendation based on top root cause
        if top_factor in ["Temperature", "Humidity"]:
            rec = self.recommendation_catalog[0] # Air Freight
        elif top_factor in ["Demand_Forecast", "Inventory_Level"]:
            rec = self.recommendation_catalog[1] # Change Supplier
        else:
            rec = self.recommendation_catalog[2] # Expedited Ground Transport
            
        base_cost = float(shipment_data.get("User_Transaction_Amount", 500) if shipment_data else 500) * 0.1
        if base_cost <= 0:
            base_cost = 50.0
            
        expected_cost = round(base_cost * rec["cost_multiplier"], 2)
        delay_reduction_mins = round(predicted_delay_mins * rec["delay_reduction_pct"], 1)
        new_delay_mins = max(0.0, round(predicted_delay_mins - delay_reduction_mins, 1))
        
        loss_factor = float(shipment_data.get("User_Transaction_Amount", 500) if shipment_data else 500) * 0.05
        predicted_loss = (predicted_delay_mins / 60.0) * (loss_factor / 24.0)
        new_loss = (new_delay_mins / 60.0) * (loss_factor / 24.0)
        
        expected_savings = max(0.0, round(predicted_loss - (expected_cost - base_cost) + 50.0, 2))
        roi = round((expected_savings / expected_cost) * 100, 1) if expected_cost > 0 else 0
        
        impact_str = f"-{delay_reduction_mins} mins" if delay_reduction_mins < 120 else f"-{round(delay_reduction_mins/60, 1)} hrs"
        
        return {
            "action": rec["name"],
            "Recommendation": rec["name"],
            "impact": impact_str,
            "expected_impact": impact_str,
            "ExpectedDelayReduction": impact_str,
            "risk_reduction": rec["risk_reduction"],
            "RiskReduction": rec["risk_reduction"],
            "cost": expected_cost,
            "estimated_cost": expected_cost,
            "ExpectedCost": f"${int(expected_cost):,}",
            "confidence": rec["confidence"],
            "Confidence": f"{rec['confidence']}%",
            "status": "Pending Review",
            "reason": rec["reason_template"].format(delay=round(predicted_delay_mins, 1), new_delay=new_delay_mins),
            "Reason": rec["reason_template"].format(delay=round(predicted_delay_mins, 1), new_delay=new_delay_mins),
            "expected_savings": expected_savings,
            "ExpectedSavings": f"${int(expected_savings):,}",
            "roi": roi,
            "ExpectedROI": f"{roi}%",
            "BusinessImpact": "Critical" if expected_savings > 500 else "High"
        }
