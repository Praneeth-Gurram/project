from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.exceptions import RequestValidationError
from pydantic import BaseModel
import sys
from typing import List, Dict, Any, Optional
import json
import random
import os
import sqlite3

from app.services.xai_service import XAIService
from app.services.recommendation_service import RecommendationService
from app.services.optimization_service import OptimizationService
from app.services.pdf_service import pdf_service
from app.db.database import get_db_connection

app = FastAPI(title="Supply Prescript XAI API", description="Explainable AI backend for Logistics Optimization")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    body = await request.body()
    print("VALIDATION ERROR:", exc.errors(), "BODY:", body, file=sys.stderr)
    return JSONResponse(status_code=422, content={"detail": exc.errors()})

xai_service = XAIService()
recommendation_service = RecommendationService()
optimization_service = OptimizationService()

class ExecuteDecisionRequest(BaseModel):
    shipment_id: int
    required_quantity: float
    maximum_budget: float

class ProvideOutcomeRequest(BaseModel):
    actual_cost: float
    actual_delay: float

class ExportReportRequest(BaseModel):
    records_count: int
    kpis: Dict[str, str]
    filters: List[str]

class WhatIfRequest(BaseModel):
    shipment_id: int
    modifications: Dict[str, Any]
    maximum_budget: float
    selected_mode: Optional[str] = None


# In-memory mock database loaded from sample_shipments.json
MOCK_DB = []
sample_paths = [
    os.path.join(os.path.dirname(__file__), "artifacts", "sample_shipments.json"),
    "backend/artifacts/sample_shipments.json",
    "ml/artifacts/sample_shipments.json",
    "artifacts/sample_shipments.json"
]
for p in sample_paths:
    if os.path.exists(p):
        try:
            with open(p, "r") as f:
                MOCK_DB = json.load(f)
            break
        except Exception as e:
            print(f"Failed to load mock DB from {p}: {e}")

@app.get("/prediction-explanation/{shipment_id}")
def get_prediction_explanation(shipment_id: int):
    if shipment_id >= len(MOCK_DB):
        # Fallback to random if out of bounds
        shipment_data = MOCK_DB[0] if MOCK_DB else {}
    else:
        shipment_data = MOCK_DB[shipment_id]
        
    if not shipment_data:
        raise HTTPException(status_code=404, detail="Shipment not found")
        
    features = {k: shipment_data.get(k, 0) for k in xai_service.feature_names}
    prediction_data = xai_service.explain_prediction(features)
    
    # Generate business explanation
    business_text = xai_service.generate_business_translation(prediction_data)
    
    # Calculate Probabilities and Confidence
    predicted_delay = prediction_data["prediction"]
    probability = min(99, max(1, int((predicted_delay / 100) * 100))) if predicted_delay > 0 else 5
    confidence_score = random.randint(85, 98) # Mock high confidence for XGBoost
    risk_level = "High" if predicted_delay > 60 else "Medium" if predicted_delay > 30 else "Low"
    
    return {
        "shipment_id": shipment_id,
        "predicted_delay_mins": predicted_delay,
        "delay_probability": f"{probability}%",
        "confidence_score": f"{confidence_score}%",
        "risk_level": risk_level,
        "business_explanation": business_text,
        "top_features": prediction_data["contributions"][:10],
        "base_value": prediction_data["base_value"]
    }

@app.get("/feature-importance")
def get_global_feature_importance():
    # Return mock aggregated global importances for the dashboard
    return {
        "global_importance": [
            {"feature": "Demand_Forecast", "business_name": "Expected Customer Demand", "impact": 0.45},
            {"feature": "Distance_KM", "business_name": "Delivery Distance", "impact": 0.32},
            {"feature": "Asset_Utilization", "business_name": "Vehicle Utilization Rate", "impact": 0.28},
            {"feature": "Precipitation_mm", "business_name": "Rainfall Volume", "impact": 0.18},
            {"feature": "Temperature", "business_name": "Weather Temperature", "impact": 0.12},
            {"feature": "User_Transaction_Amount", "business_name": "Transaction Value", "impact": 0.08},
            {"feature": "Humidity", "business_name": "Weather Humidity", "impact": 0.05}
        ]
    }

@app.get("/recommendation-explanation/{shipment_id}")
def get_recommendation_explanation(shipment_id: int):
    if shipment_id >= len(MOCK_DB):
        shipment_data = MOCK_DB[0] if MOCK_DB else {}
    else:
        shipment_data = MOCK_DB[shipment_id]
        
    if not shipment_data:
        raise HTTPException(status_code=404, detail="Shipment not found")
        
    features = {k: shipment_data.get(k, 0) for k in xai_service.feature_names}
    prediction_data = xai_service.explain_prediction(features)
    
    recommendation = recommendation_service.generate_recommendation(prediction_data, shipment_data)
    
    if not recommendation:
        return {"status": "No recommendation needed. Shipment on track."}
        
    return recommendation

@app.get("/confidence-score/{shipment_id}")
def get_confidence_scores(shipment_id: int):
    # Module 5: Confidence Indicators
    return {
        "PredictionConfidence": random.randint(85, 99),
        "RecommendationConfidence": random.randint(80, 97),
        "OptimizationConfidence": random.randint(88, 95),
        "ModelConfidence": 94
    }

@app.post("/execute-decision")
def execute_decision(request: ExecuteDecisionRequest):
    # 1. Independent validation: Re-run solver to get constraints
    opt_result = optimization_service.optimize_shipment(request.required_quantity, request.maximum_budget)
    
    # 2. Check if feasible and constraints pass based on the exact audit fields
    audit = opt_result["audit"]
    if not audit["solver_success"] or audit["calculated_total_cost"] > audit["maximum_budget"] + 1e-5:
        raise HTTPException(status_code=400, detail="Execution blocked: recommended action exceeds the defined hard budget constraint.")
        
    # 3. Database Write-Back with transaction
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            # 4. Insert into operational decision table
            cursor.execute('''
                INSERT INTO operational_decisions (
                    decision_id, shipment_id, selected_option, optimized_cost, 
                    expected_delay, solver_objective_value, optimization_status, 
                    constraint_status, execution_status, timestamp
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                opt_result["decision_id"],
                request.shipment_id,
                opt_result["selected_option"],
                opt_result["total_cost"],
                0.0, # Expected delay placeholder, or map it if we calculated it
                opt_result["objective_value"],
                opt_result["status"],
                "PASSED" if opt_result["feasible"] else "FAILED",
                "EXECUTED",
                __import__('datetime').datetime.utcnow().isoformat()
            ))
            conn.commit()
            
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail="Decision already executed.")
    except Exception as e:
        raise HTTPException(status_code=500, detail="Database write-back was unsuccessful.")
        
    return {
        "status": "success",
        "decision_id": opt_result["decision_id"],
        "audit": opt_result["audit"],
        "execution_status": "EXECUTED",
        "database_write_back": "Successful",
        "total_cost": opt_result["total_cost"],
        "selected_option": opt_result["selected_option"]
    }

@app.get("/workflow-state")
def get_workflow_state():
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM workflow_states ORDER BY id DESC LIMIT 1")
        row = cursor.fetchone()
        if not row:
            return {"error": "No workflow state found"}
        
        # Convert row to dict, parse JSON audit if exists
        state_dict = dict(row)
        if state_dict.get("optimization_audit_json"):
            state_dict["optimization_audit"] = json.loads(state_dict["optimization_audit_json"])
        else:
            state_dict["optimization_audit"] = None
        return state_dict

@app.post("/workflow/generate-prediction")
def workflow_generate_prediction():
    with get_db_connection() as conn:
        conn.execute("UPDATE workflow_states SET prediction_status='COMPLETED', optimization_status='ACTIVE' WHERE id = (SELECT max(id) FROM workflow_states)")
        conn.commit()
    return {"status": "success"}

@app.post("/simulate-optimization")
def simulate_optimization(request: ExecuteDecisionRequest):
    # Read-only run of the SciPy solver to preview constraints and feasibility
    opt_result = optimization_service.optimize_shipment(request.required_quantity, request.maximum_budget)
    return {
        "status": "success",
        "feasible": opt_result["feasible"],
        "total_cost": opt_result["total_cost"],
        "audit": opt_result["audit"],
        "selected_option": opt_result["selected_option"]
    }

@app.post("/workflow/run-optimization")
def workflow_run_optimization(request: ExecuteDecisionRequest):
    # Runs the SciPy solver
    opt_result = optimization_service.optimize_shipment(request.required_quantity, request.maximum_budget)
    
    with get_db_connection() as conn:
        audit = opt_result["audit"]
        if not audit["solver_success"] or audit["calculated_total_cost"] > audit["maximum_budget"] + 1e-5:
            conn.execute("UPDATE workflow_states SET optimization_status='FAILED', optimization_audit_json=? WHERE id = (SELECT max(id) FROM workflow_states)", 
                        (json.dumps(opt_result["audit"]),))
            conn.commit()
            raise HTTPException(status_code=400, detail="Execution blocked: recommended action exceeds the defined hard budget constraint.")
            
        conn.execute('''
            UPDATE workflow_states SET 
            optimization_status='COMPLETED', 
            decision_status='ACTIVE',
            expected_cost=?,
            optimization_audit_json=?
            WHERE id = (SELECT max(id) FROM workflow_states)
        ''', (opt_result["total_cost"], json.dumps(opt_result["audit"])))
        conn.commit()
    return {"status": "success", "audit": opt_result["audit"], "total_cost": opt_result["total_cost"]}

@app.post("/workflow/select-decision")
def workflow_select_decision():
    with get_db_connection() as conn:
        conn.execute("UPDATE workflow_states SET decision_status='COMPLETED', execution_status='ACTIVE', selected_option='Standard Truck', expected_delay=14 WHERE id = (SELECT max(id) FROM workflow_states)")
        conn.commit()
    return {"status": "success"}

@app.post("/workflow/execute-decision")
def workflow_execute_decision(request: ExecuteDecisionRequest):
    # This replaces the old execute-decision by also updating workflow state
    result = execute_decision(request) # Call existing logic
    
    # Existing logic succeeded, now update workflow state
    with get_db_connection() as conn:
        conn.execute('''
            UPDATE workflow_states SET 
            execution_status='COMPLETED', 
            outcome_status='ACTIVE',
            decision_id=?
            WHERE id = (SELECT max(id) FROM workflow_states)
        ''', (result["decision_id"],))
        conn.commit()
    return result

@app.post("/workflow/provide-outcome")
def workflow_provide_outcome(request: ProvideOutcomeRequest):
    with get_db_connection() as conn:
        conn.execute('''
            UPDATE workflow_states SET 
            outcome_status='COMPLETED', 
            learning_status='COMPLETED',
            actual_cost=?,
            actual_delay=?
            WHERE id = (SELECT max(id) FROM workflow_states)
        ''', (request.actual_cost, request.actual_delay))
        conn.commit()
    return {"status": "success"}

@app.post("/export-board-report")
def export_board_report(request: ExportReportRequest):
    try:
        pdf_buffer = pdf_service.generate_report(request.dict())
        return StreamingResponse(
            pdf_buffer, 
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=SupplyPrescript_Executive_Report.pdf"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/simulate-what-if")
def simulate_what_if(request: WhatIfRequest):
    if request.shipment_id >= len(MOCK_DB):
        base_shipment = MOCK_DB[0] if MOCK_DB else {}
    else:
        base_shipment = MOCK_DB[request.shipment_id]
        
    if not base_shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")
        
    # Get base features
    base_features = {k: base_shipment.get(k, 0) for k in xai_service.feature_names}
    
    # Extract baseline operational variables
    base_traffic = str(base_shipment.get("Traffic_Status", "Clear"))
    base_temp = float(base_shipment.get("Temperature", 25.0))
    base_humidity = float(base_shipment.get("Humidity", 60.0))
    base_priority = int(base_shipment.get("User_Purchase_Frequency", 5))
    base_avail = float(base_shipment.get("Asset_Utilization", 75.0))
    base_demand = float(base_shipment.get("Demand_Forecast", 200))
    base_budget = float(base_shipment.get("User_Transaction_Amount", 500) * 25)
    if base_budget < 5000:
        base_budget = 12500.0

    # Build simulated features dict
    simulated_features = base_features.copy()
    for k, v in request.modifications.items():
        if k in simulated_features and isinstance(v, (int, float)):
            simulated_features[k] = float(v)
            
    sim_traffic = str(request.modifications.get("Traffic_Status", base_traffic))
    sim_budget = float(request.maximum_budget if request.maximum_budget > 0 else base_budget)
    sim_mode = request.selected_mode if request.selected_mode and request.selected_mode != "Auto" else None

    # Run XGBoost prediction logic
    base_pred = xai_service.explain_prediction(base_features)
    sim_pred = xai_service.explain_prediction(simulated_features)

    # Traffic condition impact adjustment
    traffic_delay_map = {"Clear": 0.0, "Heavy": 35.0, "Detour": 18.0}
    base_delay = round(base_pred["prediction"] + traffic_delay_map.get(base_traffic, 0.0), 1)
    sim_delay = round(sim_pred["prediction"] + traffic_delay_map.get(sim_traffic, 0.0), 1)
    
    base_risk = "High" if base_delay > 60 else "Medium" if base_delay > 30 else "Low"
    sim_risk = "High" if sim_delay > 60 else "Medium" if sim_delay > 30 else "Low"

    # SciPy linear programming optimization
    base_opt = optimization_service.optimize_shipment(base_features.get("Demand_Forecast", 200), base_budget)
    req_qty = float(simulated_features.get("Demand_Forecast", base_demand))
    sim_opt = optimization_service.optimize_shipment(req_qty, sim_budget, preferred_mode=sim_mode)

    # Baseline & Simulated recommendations
    base_rec_obj = recommendation_service.generate_recommendation(base_pred, base_shipment)
    base_action = base_rec_obj.get("Recommendation") if (base_rec_obj and isinstance(base_rec_obj, dict) and "Recommendation" in base_rec_obj) else base_opt.get("selected_option", "Standard Truck")
    
    sim_rec_obj = recommendation_service.generate_recommendation(sim_pred, base_shipment)
    sim_action = sim_rec_obj.get("Recommendation") if (sim_rec_obj and isinstance(sim_rec_obj, dict) and "Recommendation" in sim_rec_obj) else sim_opt.get("selected_option", "Standard Truck")
    if sim_mode and sim_mode in optimization_service.modes:
        sim_action = sim_mode

    sim_cost = round(sim_opt["total_cost"], 2)
    base_cost = round(base_opt["total_cost"], 2)

    # Hard Budget Validation
    budget_passed = bool(sim_cost <= sim_budget + 1e-5 and sim_opt["feasible"])
    constraint_status = "Constraint Passed" if budget_passed else "Constraint Violated"

    # Explanation of change factors ("Why did the recommendation change?")
    factors_changed = []
    if base_traffic != sim_traffic:
        factors_changed.append(f"Traffic Condition shifted from {base_traffic} to {sim_traffic}")
    if abs(base_temp - simulated_features.get("Temperature", base_temp)) > 0.5:
        factors_changed.append(f"Weather Temperature changed from {base_temp}°C to {simulated_features['Temperature']}°C")
    if abs(base_humidity - simulated_features.get("Humidity", base_humidity)) > 0.5:
        factors_changed.append(f"Weather Humidity changed from {base_humidity}% to {simulated_features['Humidity']}%")
    if int(base_priority) != int(simulated_features.get("User_Purchase_Frequency", base_priority)):
        factors_changed.append(f"Delivery Priority changed from level {int(base_priority)} to {int(simulated_features['User_Purchase_Frequency'])}")
    if abs(base_avail - simulated_features.get("Asset_Utilization", base_avail)) > 1.0:
        factors_changed.append(f"Vehicle Availability changed from {base_avail}% to {simulated_features['Asset_Utilization']}%")
    if abs(base_budget - sim_budget) > 10.0:
        factors_changed.append(f"Budget adjusted from ₹{int(base_budget):,} to ₹{int(sim_budget):,}")
    if sim_mode and sim_mode != base_opt.get("selected_option"):
        factors_changed.append(f"Route Option overridden to {sim_mode}")

    if not factors_changed:
        factors_changed.append("Operational conditions match baseline dataset parameters.")

    return {
        "current": {
            "traffic": base_traffic,
            "weather": f"{base_temp}°C / {base_humidity}%",
            "temperature": base_temp,
            "humidity": base_humidity,
            "priority": int(base_priority),
            "vehicle_availability": f"{base_avail}%",
            "asset_utilization": base_avail,
            "budget": base_budget,
            "budget_formatted": f"₹{int(base_budget):,}",
            "route_option": base_opt.get("selected_option", "Standard Truck"),
            "predicted_delay_mins": base_delay,
            "risk_level": base_risk,
            "estimated_cost": base_cost,
            "cost_formatted": f"₹{int(base_cost):,}",
            "recommendation": base_action
        },
        "what_if": {
            "traffic": sim_traffic,
            "weather": f"{simulated_features.get('Temperature', base_temp)}°C / {simulated_features.get('Humidity', base_humidity)}%",
            "temperature": simulated_features.get("Temperature", base_temp),
            "humidity": simulated_features.get("Humidity", base_humidity),
            "priority": int(simulated_features.get("User_Purchase_Frequency", base_priority)),
            "vehicle_availability": f"{simulated_features.get('Asset_Utilization', base_avail)}%",
            "asset_utilization": simulated_features.get("Asset_Utilization", base_avail),
            "budget": sim_budget,
            "budget_formatted": f"₹{int(sim_budget):,}",
            "route_option": sim_action,
            "predicted_delay_mins": sim_delay,
            "risk_level": sim_risk,
            "estimated_cost": sim_cost,
            "cost_formatted": f"₹{int(sim_cost):,}",
            "recommendation": sim_action
        },
        "recommended_action": sim_action,
        "constraint_status": constraint_status,
        "execution_blocked": not budget_passed,
        "why_changed": factors_changed,
        "audit": sim_opt["audit"]
    }
