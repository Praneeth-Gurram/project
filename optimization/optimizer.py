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
)

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

    def __init__(self):

        self.problem = LpProblem(
            "SupplyPrescriptOptimization",
            LpMaximize
        )

        self.decision_variables = {}

    def initialize_variables(self, asset_ids):
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