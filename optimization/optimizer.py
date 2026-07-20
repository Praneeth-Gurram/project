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

        Example:

        A101_inventory
        A101_dispatch
        A101_route
        A101_waiting_time
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

    def get_asset_variables(self, asset_id):
        """
        Return all decision variables
        associated with an asset.
        """

        return self.decision_variables.get(asset_id, {})

    def get_variables(self):
        """
        Return all optimization variables.
        """

        return self.decision_variables