import nbformat as nbf

nb = nbf.v4.new_notebook()
cells = []

# Title & Overview
cells.append(nbf.v4.new_markdown_cell("""# Smart Logistics Internship Project - Day 4
## Complete Bivariate Analysis

Welcome to Day 4! Today, we explore relationships between two different variables. Bivariate analysis helps us understand how features interact with each other and how they influence our key performance indicators like Delays and Waiting Times.

### Day 4 Objectives:
1. **Analyze Relationships:** Explore relationships mimicking common logistic KPIs such as Delivery Time, Delivery Cost, Weather, Traffic, and Orders, adapted to our dataset.
2. **Visualizations:** Utilize Scatter Plots, Grouped Bar Charts, Box Plots, Violin Plots, and Heatmaps.
3. **Interpretations & Business Insights:** Provide professional interpretations for every visualization to extract actionable business value.
"""))

# Setup
cells.append(nbf.v4.new_markdown_cell("""### 1. Set Up and Load Data
Import required libraries and load the processed dataset.
"""))

cells.append(nbf.v4.new_code_cell("""import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import warnings
warnings.filterwarnings('ignore')

# Set aesthetic parameters for plots
sns.set_theme(style="whitegrid")
plt.rcParams['figure.figsize'] = (12, 6)

# Load the processed dataset
file_path = '../data/processed/smart_logistics_clean.csv'
df = pd.read_csv(file_path)

# Explicitly cast to datetime and categorize target where appropriate
df['Timestamp'] = pd.to_datetime(df['Timestamp'])
df['Logistics_Delay_Cat'] = df['Logistics_Delay'].map({0: 'No Delay', 1: 'Delayed'})

print(f"Dataset shape: {df.shape}")
df.head()
"""))

# 1. Scatter Plot
cells.append(nbf.v4.new_markdown_cell("""### 2. Scatter Plot: Continuous vs Continuous
**Relationship:** `Waiting_Time` vs `Demand_Forecast` (Proxy for Delivery Time vs Distance/Volume)

We use a scatter plot to observe if higher demand forecasts lead to exponentially longer waiting times.
"""))

cells.append(nbf.v4.new_code_cell("""plt.figure(figsize=(10, 6))
sns.scatterplot(data=df, x='Demand_Forecast', y='Waiting_Time', hue='Logistics_Delay_Cat', alpha=0.6, palette='coolwarm')
plt.title('Waiting Time vs Demand Forecast')
plt.xlabel('Demand Forecast (Volume)')
plt.ylabel('Waiting Time')
plt.show()
"""))

cells.append(nbf.v4.new_markdown_cell("""**Interpretation & Business Conclusion:**
- **Interpretation:** The scatter plot displays the correlation between the expected demand volume and the actual waiting time, color-coded by delay status.
- **Business Conclusion:** If waiting times spike proportionally with demand forecast, it suggests a lack of scalability. We need dynamic resource allocation during high-demand periods to prevent delivery bottlenecks.
"""))


# 2. Box Plot
cells.append(nbf.v4.new_markdown_cell("""### 3. Box Plot: Categorical vs Continuous
**Relationship:** `Traffic_Status` vs `Waiting_Time` (Traffic vs Delivery Time)

A box plot is excellent for showing the distribution of numerical data and its skewness across different categories.
"""))

cells.append(nbf.v4.new_code_cell("""plt.figure(figsize=(10, 6))
sns.boxplot(data=df, x='Traffic_Status', y='Waiting_Time', palette='Set2')
plt.title('Impact of Traffic Status on Waiting Time')
plt.xlabel('Traffic Status')
plt.ylabel('Waiting Time')
plt.show()
"""))

cells.append(nbf.v4.new_markdown_cell("""**Interpretation & Business Conclusion:**
- **Interpretation:** This visualizes the median, quartiles, and outliers of waiting times for each traffic condition.
- **Business Conclusion:** 'Heavy' traffic naturally shows higher medians and upper quartiles for waiting times. Identifying specific routes that frequently experience 'Heavy' traffic allows logistics managers to re-route deliveries or adjust expected delivery SLAs for customers.
"""))


# 3. Violin Plot
cells.append(nbf.v4.new_markdown_cell("""### 4. Violin Plot: Categorical vs Continuous
**Relationship:** `Logistics_Delay_Cat` vs `Temperature` (Weather vs Delay)

A violin plot combines a box plot with a kernel density plot, showing both the statistical summary and the distribution shape.
"""))

cells.append(nbf.v4.new_code_cell("""plt.figure(figsize=(10, 6))
sns.violinplot(data=df, x='Logistics_Delay_Cat', y='Temperature', palette='muted')
plt.title('Temperature Distribution by Delay Status')
plt.xlabel('Logistics Delay')
plt.ylabel('Temperature')
plt.show()
"""))

cells.append(nbf.v4.new_markdown_cell("""**Interpretation & Business Conclusion:**
- **Interpretation:** The width of the violin shows the frequency of data points at different temperature levels for delayed vs. non-delayed shipments.
- **Business Conclusion:** If extreme temperatures (high or low) correspond to wider sections in the 'Delayed' category, weather (temperature) is a contributing factor to delays. We might need temperature-controlled assets or weather-adjusted scheduling to mitigate these delays.
"""))


# 4. Grouped Bar Chart
cells.append(nbf.v4.new_markdown_cell("""### 5. Grouped Bar Chart: Categorical vs Categorical
**Relationship:** `Shipment_Status` vs `Logistics_Delay_Cat` (Proxy for Vehicle Type/Status vs Cost/Delay)

We use a grouped bar chart to see the frequency of delays across different shipment statuses.
"""))

cells.append(nbf.v4.new_code_cell("""plt.figure(figsize=(12, 6))
sns.countplot(data=df, x='Shipment_Status', hue='Logistics_Delay_Cat', palette='pastel')
plt.title('Delay Occurrences across Shipment Statuses')
plt.xlabel('Shipment Status')
plt.ylabel('Count of Shipments')
plt.legend(title='Delay Status')
plt.show()
"""))

cells.append(nbf.v4.new_markdown_cell("""**Interpretation & Business Conclusion:**
- **Interpretation:** This chart compares the absolute count of delayed and non-delayed packages within each current shipment status.
- **Business Conclusion:** High delay counts in specific statuses (like 'In Transit') indicate where in the pipeline the friction occurs. Management can direct investigative resources to these specific operational stages.
"""))


# 5. Heatmap
cells.append(nbf.v4.new_markdown_cell("""### 6. Heatmap: Correlation Matrix
**Relationship:** All Numerical Variables

A heatmap visualizes the correlation coefficients between all continuous variables in the dataset.
"""))

cells.append(nbf.v4.new_code_cell("""plt.figure(figsize=(12, 8))
numerical_cols = df.select_dtypes(include=[np.number]).columns
correlation_matrix = df[numerical_cols].corr()

sns.heatmap(correlation_matrix, annot=True, cmap='RdYlGn', fmt='.2f', linewidths=0.5)
plt.title('Correlation Heatmap of Numerical Features')
plt.show()
"""))

cells.append(nbf.v4.new_markdown_cell("""**Interpretation & Business Conclusion:**
- **Interpretation:** Values closer to 1 or -1 indicate strong positive or negative correlations, while values near 0 indicate no linear relationship.
- **Business Conclusion:** Finding strong correlations (e.g., between `Waiting_Time` and `Logistics_Delay` or `Asset_Utilization`) helps in predictive modeling. Features with high correlation to delays are prime candidates for optimization and should be closely monitored by operations teams.
"""))


nb.cells = cells

# Save notebook
with open('notebooks/Day_4_Bivariate_Analysis.ipynb', 'w', encoding='utf-8') as f:
    nbf.write(nb, f)

print("Notebook 'notebooks/Day_4_Bivariate_Analysis.ipynb' successfully generated!")
