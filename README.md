# SupplyPrescript – Closed-Loop Prescriptive Analytics & EDA

## Project Description
This project analyzes logistics and supply chain data using PostgreSQL and Python. It helps identify shipment delays, inventory levels, and logistics performance.

## Project Structure
- `data/`: 
  - `raw/`: Stores the original, immutable dataset (e.g., `smart_logistics.csv`). We never modify these files.
  - `processed/`: Stores cleaned and transformed data ready for modeling or analysis.
- `notebooks/`: Contains Jupyter Notebooks used for exploration, analysis, and prototyping (e.g., Day 1 exploration).
- `src/`: Holds the source code (Python scripts) for data processing, feature engineering, and model training.
- `models/`: Stores trained machine learning models for later use.
- `reports/`: Contains generated reports, visualizations, and summary presentations.

## Technologies Used
- PostgreSQL
- SQL
- Python (Pandas, NumPy, Matplotlib)
- Jupyter Notebook
- Git & GitHub

## Dataset
Smart Logistics Dataset

## Roles & Contributions
- Created the PostgreSQL database
- Imported the dataset
- Wrote SQL queries
- Performed data analysis
- Set up the Python EDA environment

## Author
KAMBAM JAGADEESH KUMAR REDDY

## Getting Started (Python EDA)
1. Clone this repository.
2. Install the required libraries: `pandas`, `numpy`, `matplotlib`, and `jupyter`.
3. Navigate to the `notebooks/` directory.
4. Launch Jupyter Notebook and open the relevant notebooks.

## Daily Progress
- **Day 1**: Project structure setup, loading data, and initial exploratory data analysis (EDA).
- **Day 2**: Data Cleaning and Preprocessing (Completed). Audited data issues (missing values, incorrect types, whitespaces), imputed missing freight costs grouped by vehicle type, handled missing customer ratings with an Unrated placeholder, standardized text columns, and exported clean data to `data/processed/smart_logistics_clean.csv`.
- **Day 3**: Complete Univariate Analysis. Analyzed numerical variables (Mean, Median, Mode, Variance, Standard Deviation, Min, Max, Quartiles) using Histograms, Boxplots, and Density Plots. Analyzed categorical variables (Count, Frequency, Percentage) using Bar Charts and Pie Charts. Provided business insights and professional interpretations for every metric and chart.

