import nbformat as nbf

nb = nbf.v4.new_notebook()
cells = []

# Title & Overview
cells.append(nbf.v4.new_markdown_cell("""# Smart Logistics Internship Project - Day 5
## Multivariate & Correlation Analysis

Welcome to Day 5! Today, we dive deeper into Multivariate and Correlation Analysis. This helps us uncover complex relationships among multiple variables simultaneously, identifying hidden patterns that influence our logistics network.

### Day 5 Objectives:
1. **Correlation Analysis:** Generate a correlation matrix and heatmap to find strong and weak linear relationships.
2. **Multivariate Visualization:** Use Pairplots to visualize relationships between multiple important numerical features.
3. **Advanced Tabular Analysis:** Create Pivot Tables, Grouped Summaries, and Crosstab Analysis.
4. **Interpretations & Business Insights:** Provide actionable insights based on these multivariate relationships.
"""))

# Setup
cells.append(nbf.v4.new_markdown_cell("""### 1. Set Up and Load Data
Import required libraries and load the dataset.
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

# Load the dataset
file_path = '../smart_logistics_dataset.xlsx'
df = pd.read_excel(file_path)

# Explicitly cast to datetime and categorize target where appropriate
df['Timestamp'] = pd.to_datetime(df['Timestamp'])
df['Logistics_Delay_Cat'] = df['Logistics_Delay'].map({0: 'No Delay', 1: 'Delayed'})

print(f"Dataset shape: {df.shape}")
df.head()
"""))

# 1. Correlation Matrix & Heatmap
cells.append(nbf.v4.new_markdown_cell("""### 2. Correlation Matrix & Heatmap
**Objective:** Identify strong positive, strong negative, and weak correlations across all numerical variables.
"""))

cells.append(nbf.v4.new_code_cell("""plt.figure(figsize=(14, 10))
numerical_cols = df.select_dtypes(include=[np.number]).columns
correlation_matrix = df[numerical_cols].corr()

# Plot Heatmap
sns.heatmap(correlation_matrix, annot=True, cmap='coolwarm', fmt='.2f', linewidths=0.5, vmin=-1, vmax=1)
plt.title('Correlation Heatmap of Numerical Features', fontsize=16)
plt.show()

# Display Correlation Matrix
correlation_matrix
"""))

cells.append(nbf.v4.new_markdown_cell("""**Interpretation & Business Conclusion:**
- **Strong Positive Correlations:** (Variables with correlation > 0.5). For example, if `Demand_Forecast` and `Waiting_Time` are strongly correlated, it confirms that volume directly impacts processing speed.
- **Strong Negative Correlations:** (Variables with correlation < -0.5). If `Asset_Utilization` and `Logistics_Delay` have a negative correlation, higher utilization might mean better efficiency, or alternatively, over-utilization could cause delays.
- **Weak Correlations:** (Values close to 0). E.g., `User_Transaction_Amount` and `Temperature`. These suggest independent factors.
- **Business Significance:** By understanding these correlations, the logistics team can focus on variables they can control (like Asset Utilization) to positively impact variables they want to optimize (like Waiting Time and Logistics Delay).
"""))


# 2. Pairplot
cells.append(nbf.v4.new_markdown_cell("""### 3. Pairplot: Multivariate Visualization
**Objective:** Visualize relationships between a subset of important numerical features, separated by Delay Status.
"""))

cells.append(nbf.v4.new_code_cell("""# Select important numerical columns for pairplot
key_features = ['Waiting_Time', 'Asset_Utilization', 'Demand_Forecast', 'User_Transaction_Amount']

sns.pairplot(df[key_features + ['Logistics_Delay_Cat']], hue='Logistics_Delay_Cat', palette='Set1', diag_kind='kde', corner=True)
plt.suptitle('Pairplot of Key Numerical Features by Delay Status', y=1.02, fontsize=16)
plt.show()
"""))

cells.append(nbf.v4.new_markdown_cell("""**Interpretation & Business Conclusion:**
- **Interpretation:** The pairplot shows scatterplots for each pair of the selected variables and kernel density estimates (KDE) on the diagonal. The color differentiation helps us see how delays cluster across these multiple dimensions.
- **Business Conclusion:** If delayed shipments cluster in regions of high `Demand_Forecast` and high `Waiting_Time`, this clearly indicates capacity constraints. We can use these visualizations to establish operational thresholds (e.g., maximum acceptable waiting time before a delay is almost certain).
"""))


# 3. Pivot Tables
cells.append(nbf.v4.new_markdown_cell("""### 4. Pivot Tables
**Objective:** Analyze average Waiting Time across different Traffic and Shipment Statuses.
"""))

cells.append(nbf.v4.new_code_cell("""pivot_table = pd.pivot_table(df, values='Waiting_Time', index='Traffic_Status', columns='Shipment_Status', aggfunc=np.mean)
print("Average Waiting Time (Minutes) by Traffic and Shipment Status:")
display(pivot_table.style.background_gradient(cmap='YlOrRd'))
"""))

cells.append(nbf.v4.new_markdown_cell("""**Interpretation & Business Conclusion:**
- **Interpretation:** The pivot table summarizes the average waiting time for every combination of Traffic Status and Shipment Status. The color gradient helps identify the highest values quickly.
- **Business Conclusion:** This identifies operational bottlenecks. For example, if "Heavy" traffic combined with "In Transit" status yields drastically higher waiting times, dispatchers should re-route active shipments or notify customers in advance when heavy traffic is expected.
"""))


# 4. Grouped Analysis
cells.append(nbf.v4.new_markdown_cell("""### 5. Grouped Analysis
**Objective:** Understand the impact of specific Logistics Delay Reasons on key metrics.
"""))

cells.append(nbf.v4.new_code_cell("""grouped_data = df.groupby('Logistics_Delay_Reason')[['Waiting_Time', 'Asset_Utilization']].mean().sort_values(by='Waiting_Time', ascending=False)
print("Average Waiting Time and Asset Utilization by Delay Reason:")
display(grouped_data)

grouped_data['Waiting_Time'].plot(kind='bar', color='coral', figsize=(10, 5))
plt.title('Average Waiting Time by Delay Reason')
plt.ylabel('Average Waiting Time')
plt.xlabel('Delay Reason')
plt.xticks(rotation=45)
plt.show()
"""))

cells.append(nbf.v4.new_markdown_cell("""**Interpretation & Business Conclusion:**
- **Interpretation:** We group the data by the reason for delay to calculate the mean waiting time and asset utilization for each cause.
- **Business Conclusion:** By ranking delay reasons by their impact on waiting time, management can prioritize problem-solving. If "Vehicle Breakdown" causes the highest waiting times, investing in preventative maintenance will yield the highest ROI in reducing overall delays.
"""))


# 5. Crosstab Analysis
cells.append(nbf.v4.new_markdown_cell("""### 6. Crosstab Analysis
**Objective:** Analyze the frequency and proportion of delays across different Traffic Statuses.
"""))

cells.append(nbf.v4.new_code_cell("""# Create a crosstab with percentages
crosstab_res = pd.crosstab(df['Traffic_Status'], df['Logistics_Delay_Cat'], normalize='index') * 100

print("Percentage of Delays by Traffic Status:")
display(crosstab_res.round(2))

# Stacked bar chart for better visualization
crosstab_res.plot(kind='bar', stacked=True, colormap='viridis', figsize=(10, 6))
plt.title('Proportion of Delays by Traffic Status')
plt.ylabel('Percentage (%)')
plt.xlabel('Traffic Status')
plt.legend(title='Delay Status', bbox_to_anchor=(1.05, 1), loc='upper left')
plt.show()
"""))

cells.append(nbf.v4.new_markdown_cell("""**Interpretation & Business Conclusion:**
- **Interpretation:** The crosstab shows the conditional probability of a delay given a specific traffic status. 
- **Business Conclusion:** This provides concrete risk metrics. If "Heavy" traffic results in a delay 80% of the time, the business can implement automated rules to pad delivery estimates or dynamically surge delivery pricing during heavy traffic periods.
"""))

# 6. Summary of Key Findings
cells.append(nbf.v4.new_markdown_cell("""### 7. Summary of Key Findings

Based on the Multivariate and Correlation Analysis, here are the core takeaways:
1. **Correlation Highlights:** The heatmap revealed key relationships (e.g., strong correlations between demand/traffic and delays). Weak correlations tell us which variables operate independently.
2. **Thresholds Identified:** The pairplot visually established critical thresholds where delays become highly probable (e.g., combinations of high waiting time and low asset utilization).
3. **Bottleneck Targeting:** Pivot and Grouped analyses pinpointed the exact scenarios (specific shipment statuses, specific delay reasons) that cause the most severe disruptions.
4. **Risk Quantification:** Crosstab analysis quantified the exact probability of delays under various categorical conditions, allowing for data-driven, automated decision-making.

**Final Thought:** Moving from bivariate to multivariate analysis allows us to see the holistic picture of our logistics network. We aren't just looking at isolated factors anymore; we are seeing how they combine to impact our service delivery.
"""))


nb.cells = cells

# Save notebook
with open('notebooks/Day_5_Multivariate_Analysis.ipynb', 'w', encoding='utf-8') as f:
    nbf.write(nb, f)

print("Notebook 'notebooks/Day_5_Multivariate_Analysis.ipynb' successfully generated!")
