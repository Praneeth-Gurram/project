# SupplyPrescript Optimization Module

## Overview

This module implements the prescriptive analytics component of the
SupplyPrescript project using Linear Programming (PuLP).

The optimization engine works alongside the XGBoost prediction model
to recommend logistics actions that maximize operational benefit.

---

## Workflow

Dataset
↓

XGBoost Prediction

↓

Benefit Score Generation

↓

PuLP Optimization

↓

Recommendation Objects

---

## Available Actions

- Increase Inventory
- Prioritize Dispatch
- Alternative Route
- Reduce Waiting Time

---

## Components

config.py

Stores optimization configuration values.

optimizer.py

Implements the Linear Programming model.

recommendation.py

Defines Recommendation objects.

feedback.py

Connects prediction outputs with optimization.

constraints.py

Reserved for future business constraints.

audit.py

Reserved for optimization auditing.

---

## Technologies

- Python
- PuLP
- XGBoost
- Pandas

