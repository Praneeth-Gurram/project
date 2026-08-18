# Supply Prescript XAI - Project Report

**Project Name:** Supply Prescript XAI  
**Repository:** Praneeth-Gurram/project  
**Branch:** vivek/frontend  
**Report Date:** August 18, 2026  

---

## Executive Summary

Supply Prescript XAI is an enterprise-grade Explainable AI (XAI) module designed to translate complex Machine Learning predictions into actionable business insights for logistics and supply chain optimization. This project combines predictive analytics with prescriptive recommendations to enhance decision-making for supply chain professionals.

### Key Value Proposition
- **Demystifies AI Models:** Converts "black box" predictions into human-readable business translations
- **Root Cause Analysis:** Identifies why delays occur, not just that they will occur
- **ROI-Driven Recommendations:** Provides cost-benefit analysis for prescriptive actions
- **Enterprise-Ready:** Built with production-grade scalability and reliability

---

## Project Structure

### Repository Overview
```
project/
├── backend/                              # FastAPI backend services
├── website/                              # Frontend / web interface
├── supply-prescript-ai/                  # Core XAI module
├── notebooks/                            # Jupyter notebooks for analysis
├── reports/                              # Generated reports directory
├── smart_logistics_dataset.xlsx          # Training dataset (Excel format)
├── smart_logistics_engineered.csv        # Engineered features dataset
├── generate_day4_notebook.py             # Notebook generation scripts
├── generate_day5_notebook.py
├── generate_day6_notebook.py
├── generate_day7_notebook.py
├── generate_day8_notebook.py
├── generate_day9_notebook.py
└── .vscode/                              # VS Code configuration
```

### Language Composition
| Language | Percentage | Use Case |
|----------|-----------|----------|
| **Jupyter Notebook** | 80.6% | Data analysis, model development, exploratory data science |
| **JavaScript** | 9.1% | Frontend interactivity |
| **Python** | 4.4% | Backend services, data processing |
| **TypeScript** | 2.7% | Type-safe frontend code |
| **HTML** | 2.4% | Web interface markup |
| **CSS** | 0.8% | Styling |

---

## Core Features

### 1. **Explainability Engine (XAI via SHAP)**
- **Technology:** SHAP (SHapley Additive exPlanations)
- **Input:** XGBoost model predictions + feature values
- **Output:** 
  - Local feature contributions per shipment
  - Waterfall visualizations
  - Human-readable business translations

### 2. **Predictive Module**
- **Model:** XGBoost
- **Task:** Predicting supply chain delays (in minutes)
- **Base Value Extraction:** Captures model baseline predictions
- **Feature Impact Ranking:** Identifies top 10 contributing factors per prediction

### 3. **Prescriptive Optimization Engine**
- **Function:** Generates targeted recommendations based on feature explanations
- **Output Metrics:**
  - Expected cost of intervention
  - Projected delay reduction
  - Overall ROI analysis
  - Before vs. after comparison

### 4. **Confidence Scoring System**
Three-level confidence indicators:
1. **Model Confidence:** Overall model reliability
2. **Prediction Confidence:** Certainty in the specific prediction
3. **Recommendation Confidence:** Trust in prescriptive actions

---

## Backend Architecture

### API Endpoints (FastAPI - Default Port: 8001)

#### 1. **Prediction Explanation**
```
GET /prediction-explanation/{shipment_id}
```
- Returns predicted delay in minutes
- Includes probability scores
- Provides business translation text
- Lists top 10 contributing features ranked by impact

#### 2. **Feature Importance**
```
GET /feature-importance
```
- Global aggregated feature importance across entire dataset
- Helps identify systematic delay drivers

#### 3. **Recommendation Explanation**
```
GET /recommendation-explanation/{shipment_id}
```
- Executes prescriptive optimization
- Returns expected cost of action
- Provides delay reduction estimates
- Includes ROI calculations

#### 4. **Confidence Scores**
```
GET /confidence-score/{shipment_id}
```
- System confidence indicators
- Multiple confidence levels:
  - Model confidence
  - Prediction confidence
  - Recommendation confidence

---

## Data Pipeline

### Data Sources
- **Primary Dataset:** `smart_logistics_dataset.xlsx` (117.6 KB)
  - Contains raw supply chain data
  
- **Engineered Features:** `smart_logistics_engineered.csv` (132.2 KB)
  - Processed and feature-engineered dataset
  - Ready for model training/inference

### Notebook Generation System
The project includes automated notebook generation scripts for multi-day analysis:
- Day 4-9 analysis notebooks
- Each generates comprehensive analysis outputs
- Configured for progressive feature engineering and model evaluation

---

## SHAP Pipeline Workflow

```
Raw Prediction Data
        ↓
Extract XGBoost Base Value
        ↓
Calculate Marginal Contribution of Feature X
        ↓
Rank Features by Absolute Impact
        ↓
Generate Waterfall Visualizations
```

---

## Technology Stack

### Backend
- **Framework:** FastAPI
- **ML Model:** XGBoost
- **Explainability:** SHAP
- **Language:** Python

### Frontend
- **Languages:** JavaScript, TypeScript
- **Styling:** CSS, HTML
- **Visualization:** Plotly
- **Framework:** React (inferred from architecture)

### Data Management
- **Formats:** Excel (XLSX), CSV
- **Analysis:** Jupyter Notebooks

---

## Use Cases

### 1. **Dispatcher Decision Support**
- Why is this shipment predicted to be delayed?
- What actions can reduce this specific delay?
- What's the ROI on intervention?

### 2. **Supply Chain Analytics**
- Which factors most frequently cause delays?
- How do delays vary across regions/routes?
- Predictive capacity planning

### 3. **Performance Optimization**
- Identify bottlenecks with high impact
- Prioritize improvement initiatives
- Measure intervention effectiveness

### 4. **Stakeholder Communication**
- Translate complex predictions into business language
- Justify AI-driven recommendations
- Build trust in automation

---

## Development Timeline & Artifacts

### Generated Components
- **Day 4-9 Notebooks:** Progressive model development and feature engineering
- **Reports Directory:** Centralized output location for analyses
- **Notebooks Directory:** Jupyter notebook repository

---

## Quality & Trust Mechanisms

### Why Trust This AI?
1. **Transparent Explanations:** Every prediction includes feature-level explanations
2. **Business Translation:** Technical outputs converted to actionable insights
3. **Root Cause Focus:** Identifies why problems occur
4. **ROI Validation:** Recommendations include cost-benefit analysis
5. **Confidence Scoring:** Multi-level confidence indicators for all outputs

---

## Deployment Considerations

### Current Status
- Core XAI module implemented
- FastAPI backend ready (port 8001)
- React-based frontend in development
- Data pipeline automated via notebook generators

### Scalability Features
- RESTful API design for horizontal scaling
- Batch processing capability via notebook system
- Modular architecture (predictor, explainer, prescriber separate)

---

## Key Metrics & KPIs

| Metric | Purpose | Target |
|--------|---------|--------|
| Model Accuracy | Prediction reliability | To be benchmarked |
| Explanation Coverage | % features explained | 100% |
| ROI Accuracy | Recommendation validity | To be validated |
| API Response Time | User experience | <500ms per request |
| Confidence Scores | Trust indicators | High confidence for >80% predictions |

---

## Next Steps & Recommendations

1. **Frontend Development:** Complete React UI with interactive visualizations
2. **Model Validation:** Benchmark XGBoost performance on test sets
3. **A/B Testing:** Validate ROI recommendations in production
4. **Documentation:** API specification and user guides
5. **Monitoring:** Implement logging and performance metrics
6. **Scaling:** Containerization and orchestration (Docker/Kubernetes)

---

## Conclusion

Supply Prescript XAI represents a significant advancement in enterprise AI adoption by bridging the gap between predictive accuracy and business interpretability. The modular architecture, combined with SHAP-based explanations and prescriptive optimization, positions this project as a valuable tool for supply chain professionals seeking to leverage AI for competitive advantage.

---

**Report Prepared For:** vivek/frontend branch  
**Repository:** https://github.com/Praneeth-Gurram/project  
**Generated:** 2026-08-18
