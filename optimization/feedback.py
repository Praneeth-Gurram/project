"""
Feedback Module

Converts prediction outputs into
optimization benefit scores.
"""

from optimization.optimizer import SupplyPrescriptOptimizer


class OptimizationFeedback:
    """
    Bridges the machine learning model
    and optimization engine.
    """

    def generate_benefit_scores(self, predictions):
        """
        Convert prediction probabilities
        into benefit scores for each action.

        Parameters
        ----------
        predictions : dict

        Example

        {
            "A101": 0.91,
            "A102": 0.42
        }
        """

        benefit_scores = {}

        for asset, probability in predictions.items():

            benefit_scores[asset] = {

                "inventory": probability * 8,

                "dispatch": probability * 10,

                "route": probability * 12,

                "waiting_time": probability * 9,
            }

        return benefit_scores

    def optimize(self, asset_ids, predictions):

        optimizer = SupplyPrescriptOptimizer()

        optimizer.initialize_variables(asset_ids)

        benefit_scores = self.generate_benefit_scores(predictions)

        optimizer.set_objective(benefit_scores)

        optimizer.add_constraints()

        optimizer.solve()

        return optimizer.generate_recommendations(
            benefit_scores
        )