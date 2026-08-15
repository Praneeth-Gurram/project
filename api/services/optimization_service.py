"""
Optimization Service

Connects XGBoost prediction results
with the existing PuLP optimization engine.
"""

from optimization.feedback import OptimizationFeedback


class OptimizationService:
    """
    API-facing service for prescriptive analytics.
    """

    def __init__(self):
        self.feedback = OptimizationFeedback()

    def optimize(self, predictions):
        """
        Generate logistics recommendations from
        predicted delay probabilities.

        Parameters
        ----------
        predictions : dict
            Mapping of Asset_ID to delay probability.

        Returns
        -------
        list[dict]
            JSON-ready optimization recommendations.
        """

        if not predictions:
            raise ValueError("Predictions cannot be empty.")

        asset_ids = list(predictions.keys())

        recommendations = self.feedback.optimize(
            asset_ids,
            predictions,
        )

        return [
            recommendation.to_dict()
            for recommendation in recommendations
        ]