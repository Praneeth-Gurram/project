"""
XGBoost Prediction Service

Loads the trained XGBoost model and prepares
logistics data for delay prediction.
"""

import pickle
from pathlib import Path

import pandas as pd


MODEL_PATH = (
    Path(__file__).resolve().parent.parent / "xgboost_model.pkl"
)


class PredictionService:
    """
    Handles loading the trained XGBoost model
    and generating delay probabilities.
    """

    def __init__(self):
        self.model = None
        self.feature_cols = None

        self._load_model()

    def _load_model(self):
        """
        Load the trained XGBoost model and
        feature configuration.
        """

        if not MODEL_PATH.exists():
            raise FileNotFoundError(
                f"XGBoost model not found at: {MODEL_PATH}"
            )

        with open(MODEL_PATH, "rb") as file:
            model_data = pickle.load(file)

        self.model = model_data["model"]
        self.feature_cols = model_data["feature_cols"]

    def predict_probability(self, data):
        """
        Generate delay probability for
        the supplied logistics data.

        Parameters
        ----------
        data : pandas.DataFrame

        Returns
        -------
        pandas.Series
            Probability of logistics delay.
        """

        missing_columns = [
            column
            for column in self.feature_cols
            if column not in data.columns
        ]

        if missing_columns:
            raise ValueError(
                f"Missing required features: {missing_columns}"
            )

        features = data[self.feature_cols].copy()

        probabilities = self.model.predict_proba(features)[:, 1]

        return pd.Series(
            probabilities,
            index=data.index,
            name="delay_probability"
        )