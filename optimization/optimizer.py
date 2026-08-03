"""
Optimization Engine

Initializes the prescriptive analytics
optimization model using PuLP.
"""

from pulp import (
    LpProblem,
    LpVariable,
    LpBinary,
    LpMaximize,
    lpSum,
    LpStatus,
    value,
    PULP_CBC_CMD
)

from optimization.recommendation import Recommendation

def solve(self):
    """
    Solve the optimization problem.
    """

    self.problem.solve(PULP_CBC_CMD(msg=False))

    return LpStatus[self.problem.status]


def generate_recommendations(self, benefit_scores):
    """
    Convert optimization results into
    Recommendation objects.
    """

    recommendations = []

    for asset in self.decision_variables:

        selected_action = None

        for action in self.ACTIONS:

            variable = self.decision_variables[asset][action]

            if value(variable) == 1:

                selected_action = action
                break

        if selected_action is None:
            continue

        recommendation = Recommendation(
            asset_id=asset,
            action=selected_action,
            priority="HIGH",
            reason="Optimization selected highest-benefit action.",
            estimated_cost=0.0,
            expected_benefit=benefit_scores[asset][selected_action]
        )

        recommendations.append(recommendation)

    return recommendations

def add_constraints(self):
    """
    Add business constraints to the optimization model.

    Each asset can receive only one
    optimization action.
    """

    for asset in self.decision_variables:

        self.problem += (
            lpSum(
                self.decision_variables[asset][action]
                for action in self.ACTIONS
            ) <= 1,
            f"One_Action_Per_Asset_{asset}"
        )


class SupplyPrescriptOptimizer:
    """
    Linear Programming optimizer responsible
    for selecting the best logistics action
    for every asset.
    """

    ACTIONS = [
        "inventory",
        "dispatch",
        "route",
        "waiting_time",
    ]

def validate_assets(self, asset_ids):
    """
    Validate asset identifiers before
    optimization begins.
    """

    if not asset_ids:
        raise ValueError("Asset list cannot be empty.")

    if len(asset_ids) != len(set(asset_ids)):
        raise ValueError("Duplicate Asset_ID values detected.")

    def __init__(self):

        self.problem = LpProblem(
            "SupplyPrescriptOptimization",
            LpMaximize
        )

        self.decision_variables = {}

    def self.validate_assets(asset_ids) initialize_variables(self, asset_ids):
        """
        Create one binary decision variable
        for every asset-action combination.
        """

        self.decision_variables = {
            asset_id: {
                action: LpVariable(
                    f"{asset_id}_{action}",
                    cat=LpBinary
                )
                for action in self.ACTIONS
            }
            for asset_id in asset_ids
        }

    def set_objective(self, benefit_scores):
        """
        Maximize total business benefit.

        Parameters
        ----------
        benefit_scores : dict

        Example:

        {
            "A101": {
                "inventory": 8,
                "dispatch": 12,
                "route": 15,
                "waiting_time": 10
            }
        }
        """

        self.problem += lpSum(
            benefit_scores[asset][action]
            * self.decision_variables[asset][action]
            for asset in self.decision_variables
            for action in self.ACTIONS
        )

    def get_asset_variables(self, asset_id):
        return self.decision_variables.get(asset_id, {})

    def get_variables(self):
        return self.decision_variables