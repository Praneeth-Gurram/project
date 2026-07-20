"""
Recommendation Data Model

Defines the structure used to represent
optimization recommendations generated
by the prescriptive analytics engine.
"""

from dataclasses import dataclass


@dataclass
class Recommendation:
    """
    Represents a single optimization recommendation
    for an asset predicted to experience delays.
    """

    asset_id: str
    action: str
    priority: str
    reason: str
    estimated_cost: float
    expected_benefit: float

    def to_dict(self):
        """
        Convert recommendation into dictionary format.
        Useful for APIs and JSON serialization.
        """
        return {
            "asset_id": self.asset_id,
            "action": self.action,
            "priority": self.priority,
            "reason": self.reason,
            "estimated_cost": self.estimated_cost,
            "expected_benefit": self.expected_benefit,
        }

    def __str__(self):
        return (
            f"[{self.priority}] "
            f"{self.asset_id} -> {self.action} "
            f"(Cost: {self.estimated_cost}, "
            f"Benefit: {self.expected_benefit})"
        )