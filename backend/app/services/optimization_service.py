import numpy as np
from scipy.optimize import linprog
import uuid
import logging

logger = logging.getLogger(__name__)

class OptimizationService:
    def __init__(self):
        # Transport modes configuration: Cost per unit ($), Capacity per mode (units)
        # Order: 0: Standard Truck, 1: Rail, 2: Air Freight
        self.modes = ['Standard Truck', 'Rail', 'Air Freight']
        self.costs = [10.0, 5.0, 50.0]        # Unit cost in USD
        self.capacities = [500.0, 1000.0, 200.0]  # Max unit capacity per mode
        self.total_network_capacity = sum(self.capacities) # 1700.0 units
        self.tolerance = 1e-5

    def calculate_minimum_feasible_cost(self, required_quantity: float):
        """
        Calculates the theoretical minimum cost to transport `required_quantity`
        by greedily allocating to the lowest-cost available modes.
        Modes ordered by cost: Rail ($5/unit, cap 1000) -> Truck ($10/unit, cap 500) -> Air ($50/unit, cap 200).
        """
        if required_quantity <= 0:
            return 0.0, [0.0, 0.0, 0.0], True

        if required_quantity > self.total_network_capacity:
            return None, None, False  # Exceeds total physical capacity

        # Sorted by unit cost ascending
        sorted_indices = sorted(range(len(self.costs)), key=lambda i: self.costs[i])
        remaining = float(required_quantity)
        allocations = [0.0] * len(self.modes)
        total_min_cost = 0.0

        for idx in sorted_indices:
            cap = self.capacities[idx]
            alloc = min(remaining, cap)
            allocations[idx] = alloc
            total_min_cost += alloc * self.costs[idx]
            remaining -= alloc
            if remaining <= 1e-9:
                break

        return round(total_min_cost, 2), allocations, True

    def validate_optimization_solution(self, result, required_quantity: float, maximum_budget: float):
        """
        Independently recalculates every hard constraint and verifies numerical feasibility.
        Does NOT trust solver status alone.
        """
        violations = []
        
        if not result.success or result.x is None:
            violations.append(f"Solver failed to converge with status: {result.message if hasattr(result, 'message') else 'Infeasible'}")
            min_cost, _, cap_ok = self.calculate_minimum_feasible_cost(required_quantity)
            if not cap_ok:
                violations.append(f"Demand constraint violation: Required quantity ({required_quantity:,.0f} units) exceeds total fleet capacity ({self.total_network_capacity:,.0f} units).")
            elif min_cost is not None and min_cost > maximum_budget:
                violations.append(f"Hard budget constraint violation: Minimum feasible cost is ${min_cost:,.2f}, which exceeds the maximum budget limit of ${maximum_budget:,.2f} by ${min_cost - maximum_budget:,.2f}.")
            
            return {
                "feasible": False,
                "violations": violations,
                "calculated_total_cost": None,
                "minimum_feasible_cost": min_cost,
                "budget_gap": max(0.0, min_cost - maximum_budget) if min_cost is not None else None,
                "total_supplied": 0.0,
                "allocations": [0.0, 0.0, 0.0]
            }

        # Extract variable values
        x = [float(val) for val in result.x]

        # 1. Non-negativity and individual capacity bounds check
        for i, (val, cap, mode) in enumerate(zip(x, self.capacities, self.modes)):
            if val < -self.tolerance:
                violations.append(f"Variable bounds violation: {mode} allocation ({val:.2f}) cannot be negative.")
            if val > cap + self.tolerance:
                violations.append(f"Capacity limit violation: {mode} allocation ({val:.2f}) exceeds max capacity of {cap:.0f} units.")

        # 2. Demand satisfaction check
        total_supplied = float(sum(x))
        if total_supplied < required_quantity - self.tolerance:
            violations.append(f"Demand shortage: Total supplied ({total_supplied:.2f}) is less than required quantity ({required_quantity:.2f}).")

        # 3. Budget constraint check
        calculated_total_cost = float(sum(val * cost for val, cost in zip(x, self.costs)))
        if calculated_total_cost > maximum_budget + self.tolerance:
            violations.append(f"Budget exceeded: Total cost (${calculated_total_cost:,.2f}) exceeds hard budget limit (${maximum_budget:,.2f}).")

        is_feasible = len(violations) == 0

        return {
            "feasible": is_feasible,
            "violations": violations,
            "calculated_total_cost": round(calculated_total_cost, 2),
            "minimum_feasible_cost": round(calculated_total_cost, 2) if is_feasible else None,
            "budget_gap": 0.0 if is_feasible else max(0.0, calculated_total_cost - maximum_budget),
            "total_supplied": round(total_supplied, 2),
            "allocations": [round(v, 2) for v in x]
        }

    def optimize_shipment(self, required_quantity: float, maximum_budget: float, preferred_mode: str = None):
        """
        Runs SciPy linear programming (HiGHS Simplex / Interior Point solver) to minimize logistics cost.
        
        Variables:
            x[0] = Standard Truck quantity (units)
            x[1] = Air Freight quantity (units)
            x[2] = Rail quantity (units)
            
        Objective:
            Minimize sum(cost[i] * x[i])
            
        Constraints:
            1. Hard Budget: sum(cost[i] * x[i]) <= maximum_budget
            2. Demand: sum(x[i]) >= required_quantity  -->  -sum(x[i]) <= -required_quantity
            3. Capacity bounds: 0 <= x[i] <= capacity[i]
        """
        req_qty = float(required_quantity)
        max_bgt = float(maximum_budget)

        # Objective function coefficients
        c = self.costs.copy()

        # If preferred mode requested and valid, bias objective slightly to favor it if mathematically feasible
        if preferred_mode and preferred_mode in self.modes:
            pref_idx = self.modes.index(preferred_mode)
            c[pref_idx] = c[pref_idx] * 0.95

        # Inequality constraints: A_ub @ x <= b_ub
        # Row 0: Budget constraint
        # Row 1: Demand constraint (-x0 - x1 - x2 <= -required_quantity)
        A_ub = [
            self.costs.copy(),
            [-1.0, -1.0, -1.0]
        ]
        b_ub = [
            max_bgt,
            -req_qty
        ]

        # Bounds: 0 <= x[i] <= capacity[i]
        bounds = [(0.0, cap) for cap in self.capacities]

        # Execute linprog with modern HiGHS solver
        try:
            result = linprog(c, A_ub=A_ub, b_ub=b_ub, bounds=bounds, method='highs')
        except Exception as e:
            logger.error(f"SciPy linprog execution exception: {e}")
            result = type('Result', (), {'success': False, 'status': 4, 'message': str(e), 'x': None, 'fun': None})()

        # Independent constraint validation
        validation = self.validate_optimization_solution(result, req_qty, max_bgt)
        is_feasible = validation["feasible"]
        actual_cost = validation["calculated_total_cost"] if is_feasible else 0.0
        allocations = validation["allocations"]
        total_supplied = validation["total_supplied"]

        # Map SciPy status code to clear description
        status_map = {
            0: "OPTIMAL",
            1: "ITERATION_LIMIT",
            2: "INFEASIBLE",
            3: "UNBOUNDED",
            4: "NUMERICAL_DIFFICULTY"
        }
        solver_status_str = status_map.get(getattr(result, 'status', -1), "INFEASIBLE" if not is_feasible else "OPTIMAL")

        # Detailed constraint audit
        audit = {
            "solver_success": bool(result.success and is_feasible),
            "solver_status": solver_status_str,
            "objective_value": float(result.fun) if result.success and result.fun is not None else 0.0,
            "maximum_budget": max_bgt,
            "calculated_total_cost": actual_cost,
            "remaining_budget": max(0.0, max_bgt - actual_cost) if is_feasible else 0.0,
            "budget_utilization": round((actual_cost / max_bgt * 100), 2) if max_bgt > 0 and is_feasible else 0.0,
            "budget_constraint_status": "PASSED" if is_feasible else "FAILED",
            "overall_feasibility": "FEASIBLE" if is_feasible else "INFEASIBLE",
            "minimum_feasible_cost": validation["minimum_feasible_cost"],
            "budget_gap": validation["budget_gap"],
            "violations": validation["violations"],
            "allocations": {mode: qty for mode, qty in zip(self.modes, allocations)},
            "Budget": {
                "passed": is_feasible,
                "limit": max_bgt,
                "actual": actual_cost
            },
            "Capacity": {
                "passed": is_feasible,
                "limit": self.total_network_capacity,
                "actual": total_supplied
            },
            "Demand": {
                "passed": is_feasible,
                "required": req_qty,
                "supplied": total_supplied
            }
        }

        # Determine dominant selected option
        selected_option = "None"
        if is_feasible and any(q > 0 for q in allocations):
            best_idx = int(np.argmax(allocations))
            selected_option = self.modes[best_idx]

        return {
            "decision_id": f"DEC-{uuid.uuid4().hex[:6].upper()}",
            "status": "OPTIMAL" if is_feasible else "INFEASIBLE",
            "success": is_feasible,
            "objective_value": float(result.fun) if result.success and result.fun is not None else None,
            "selected_option": selected_option,
            "recommended_quantity": total_supplied,
            "total_cost": actual_cost,
            "budget_limit": max_bgt,
            "audit": audit,
            "feasible": is_feasible,
            "violations": validation["violations"]
        }
