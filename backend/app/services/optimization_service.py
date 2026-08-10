import numpy as np
from scipy.optimize import linprog
import uuid

class OptimizationService:
    def __init__(self):
        # Transport options mock data: Cost per unit, Capacity per mode
        self.modes = ['Standard Truck', 'Air Freight', 'Rail']
        self.costs = [10.0, 50.0, 5.0]  # Cost per unit
        self.capacities = [500.0, 200.0, 1000.0]  # Max capacity
        
    def optimize_shipment(self, required_quantity, maximum_budget, preferred_mode=None):
        """
        Runs SciPy linear programming to minimize delay/cost.
        Objective: Minimize total cost.
        Variables: x0 (Truck), x1 (Air), x2 (Rail)
        """
        # Objective function coefficients (minimize cost)
        c = self.costs.copy()

        # Inequality constraints matrix (A_ub @ x <= b_ub)
        # 1. Budget constraint: cost_0*x0 + cost_1*x1 + cost_2*x2 <= maximum_budget
        # 2. Capacity constraints: x0 <= cap0, x1 <= cap1, x2 <= cap2
        # Note: Demand is a >= constraint, so we multiply by -1 for A_ub: -(x0 + x1 + x2) <= -required_quantity
        
        A_ub = [
            self.costs,           # Budget
            [-1, -1, -1]          # Demand (negative for >=)
        ]
        b_ub = [
            maximum_budget,
            -required_quantity
        ]

        # Bounds for each variable: 0 <= x <= capacity
        bounds = [(0, cap) for cap in self.capacities]

        # If a preferred mode is specified and valid, force min allocation for preferred mode if possible
        if preferred_mode and preferred_mode in self.modes:
            pref_idx = self.modes.index(preferred_mode)
            # Give discount to cost of preferred mode in objective to force selection if feasible
            c[pref_idx] = c[pref_idx] * 0.1

        result = linprog(c, A_ub=A_ub, b_ub=b_ub, bounds=bounds, method='highs')

        # Audit constraints independently
        actual_cost = float(sum(x * c for x, c in zip(result.x, self.costs))) if result.success else 0.0
        allocated_quantities = [float(x) for x in result.x] if result.success else [0.0, 0.0, 0.0]
        total_supplied = float(sum(allocated_quantities)) if result.success else 0.0
        success_bool = bool(result.success)

        # Independent Budget Validation
        tolerance = 1e-5
        budget_passed = bool(actual_cost <= maximum_budget + tolerance) if success_bool else False
        overall_feasible = bool(success_bool and budget_passed and (total_supplied >= required_quantity - tolerance))

        # Construct audit results (exact structure requested)
        audit = {
            "solver_success": success_bool,
            "solver_status": "OPTIMAL" if success_bool else "INFEASIBLE",
            "objective_value": float(result.fun) if success_bool else 0.0,
            "maximum_budget": float(maximum_budget),
            "calculated_total_cost": actual_cost,
            "remaining_budget": max(0.0, float(maximum_budget) - actual_cost) if success_bool else 0.0,
            "budget_utilization": (actual_cost / float(maximum_budget) * 100) if float(maximum_budget) > 0 and success_bool else 0.0,
            "budget_constraint_status": "PASSED" if budget_passed else "FAILED",
            "overall_feasibility": "FEASIBLE" if overall_feasible else "INFEASIBLE",
            "Budget": {"passed": budget_passed, "limit": float(maximum_budget), "actual": actual_cost}
        }

        # Determine selected option (the one with the largest allocation)
        selected_option = "None"
        if overall_feasible:
            best_idx = int(np.argmax(allocated_quantities))
            selected_option = self.modes[best_idx]

        return {
            "decision_id": f"DEC-{uuid.uuid4().hex[:6].upper()}",
            "status": "OPTIMAL" if success_bool else "INFEASIBLE",
            "success": success_bool,
            "objective_value": float(result.fun) if success_bool else None,
            "selected_option": selected_option,
            "recommended_quantity": total_supplied,
            "total_cost": actual_cost,
            "budget_limit": maximum_budget,
            "audit": audit,
            "feasible": overall_feasible
        }
