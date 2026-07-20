"""
Optimization Engine

Initializes the prescriptive analytics
optimization model using PuLP.
"""

from pulp import (
    LpProblem,
    LpVariable,
    LpBinary,
    LpMaximize
)


class SupplyPrescriptOptimizer:
    """
    Optimization engine responsible for
    generating logistics decisions using
    Linear Programming.
    """

    def __init__(self):

        self.problem = LpProblem(
            "SupplyPrescriptOptimization",
            LpMaximize
        )

        self.decision_variables = {}

    def initialize_variables(self, asset_ids):
        """
        Create one binary decision variable
        for every asset.
        """

        self.decision_variables = {
            asset_id: LpVariable(
                f"asset_{asset_id}",
                cat=LpBinary
            )
            for asset_id in asset_ids
        }

    def get_variables(self):
        """
        Return optimization variables.
        """

        return self.decision_variables