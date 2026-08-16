"""
Optimization Engine

Simple prescriptive optimization engine.

For the submission model, each asset receives at most
one action. The action with the highest calculated
benefit is selected directly.
"""

from optimization.recommendation import Recommendation


class SupplyPrescriptOptimizer:
    """
    Optimization engine responsible for selecting
    the best logistics action for every asset.
    """

    ACTIONS = [
        "inventory",
        "dispatch",
        "route",
        "waiting_time",
    ]

    def __init__(self):
        self.decision_variables = {}

    def validate_assets(self, asset_ids):
        """
        Validate asset identifiers before optimization.
        """

        if not asset_ids:
            raise ValueError("Asset list cannot be empty.")

        if len(asset_ids) != len(set(asset_ids)):
            raise ValueError(
                "Duplicate Asset_ID values detected."
            )

    def initialize_variables(self, asset_ids):
        """
        Initialize the decision structure.

        The original version used binary PuLP variables.
        For the submission model, a direct benefit comparison
        is sufficient because each asset can receive only
        one action.
        """

        self.validate_assets(asset_ids)

        self.decision_variables = {}

        for asset in asset_ids:
            self.decision_variables[asset] = {
                action: 0
                for action in self.ACTIONS
            }

    def set_objective(self, benefit_scores):
        """
        Store benefit scores used to select
        the best action for each asset.
        """

        self.benefit_scores = benefit_scores

    def add_constraints(self):
        """
        Business constraint:

        Each asset can receive only one action.

        This is enforced automatically when the
        highest-benefit action is selected.
        """

        pass

    def solve(self):
        """
        Select the highest-benefit action for
        every asset.
        """

        if not hasattr(self, "benefit_scores"):
            raise ValueError(
                "Benefit scores must be set before solving."
            )

        for asset in self.decision_variables:

            scores = self.benefit_scores.get(asset, {})

            if not scores:
                continue

            best_action = max(
                self.ACTIONS,
                key=lambda action: scores.get(action, 0)
            )

            for action in self.ACTIONS:
                self.decision_variables[asset][action] = (
                    1 if action == best_action else 0
                )

        return "Optimal"

    def generate_recommendations(self, benefit_scores):
        """
        Convert optimization results into
        Recommendation objects.
        """

        recommendations = []

        for asset in self.decision_variables:

            selected_action = None

            for action in self.ACTIONS:

                if self.decision_variables[asset][action] == 1:
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
                expected_benefit=benefit_scores[
                    asset
                ][selected_action],
            )

            recommendations.append(recommendation)

        return recommendations

    def get_asset_variables(self, asset_id):
        return self.decision_variables.get(
            asset_id,
            {}
        )

    def get_variables(self):
        return self.decision_variables