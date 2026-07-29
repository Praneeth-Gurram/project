import nbformat as nbf

nb = nbf.v4.new_notebook()
cells = []

# Title & Overview
cells.append(nbf.v4.new_markdown_cell("""# Smart Logistics Internship Project - Day 3
## Complete Univariate Analysis

Welcome to Day 3! Today, we will dive deep into understanding each individual variable in our dataset. Univariate analysis is crucial for discovering patterns, understanding the distribution of our data, and identifying potential outliers.

### Day 3 Objectives:
1. **Numerical Analysis:** For every numerical column, we will calculate Mean, Median, Mode, Variance, Standard Deviation, Minimum, Maximum, Quartiles, and plot Histograms, Boxplots, and Density Plots.
2. **Categorical Analysis:** For every categorical column, we will calculate Count, Frequency, Percentage, and plot Bar Charts and Pie Charts.
3. **Interpretations & Business Insights:** Every chart will be interpreted with professional markdown explanations to extract real business value.
"""))

# Setup
cells.append(nbf.v4.new_markdown_cell("""### 1. Set Up and Load Clean Data
We'll begin by importing the required libraries and loading our processed logistics dataset from Day 2.
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

# Explicitly cast Timestamp to datetime for completeness
df['Timestamp'] = pd.to_datetime(df['Timestamp'])

# Treat Logistics_Delay as categorical for proper analysis
df['Logistics_Delay'] = df['Logistics_Delay'].astype(str)

print(f"Dataset shape: {df.shape}")
df.head()
"""))

# Helper Functions
cells.append(nbf.v4.new_markdown_cell("""### 2. Helper Functions for Automated Analysis
To maintain clean and DRY (Don't Repeat Yourself) code, we define functions to calculate statistics and plot charts for numerical and categorical variables.
"""))

cells.append(nbf.v4.new_code_cell("""def analyze_numerical(column_name, data):
    print(f"--- {column_name} ---")
    
    # Statistical measures
    mean_val = data[column_name].mean()
    median_val = data[column_name].median()
    mode_val = data[column_name].mode()[0]
    variance_val = data[column_name].var()
    std_val = data[column_name].std()
    min_val = data[column_name].min()
    max_val = data[column_name].max()
    q1 = data[column_name].quantile(0.25)
    q2 = data[column_name].quantile(0.50)
    q3 = data[column_name].quantile(0.75)
    
    stats_df = pd.DataFrame({
        'Measure': ['Mean', 'Median', 'Mode', 'Variance', 'Standard Deviation', 'Minimum', 'Maximum', 'Q1 (25%)', 'Q2 (50%)', 'Q3 (75%)'],
        'Value': [mean_val, median_val, mode_val, variance_val, std_val, min_val, max_val, q1, q2, q3]
    })
    display(stats_df.style.format({'Value': "{:.2f}"}))
    
    # Plots
    fig, axes = plt.subplots(1, 3, figsize=(18, 5))
    
    # Histogram
    sns.histplot(data[column_name], kde=False, ax=axes[0], color='teal')
    axes[0].set_title(f'Histogram of {column_name}')
    
    # Boxplot
    sns.boxplot(x=data[column_name], ax=axes[1], color='orange')
    axes[1].set_title(f'Boxplot of {column_name}')
    
    # Density Plot
    sns.kdeplot(data[column_name], fill=True, ax=axes[2], color='purple')
    axes[2].set_title(f'Density Plot of {column_name}')
    
    plt.tight_layout()
    plt.show()

def analyze_categorical(column_name, data):
    print(f"--- {column_name} ---")
    
    # Frequencies and Percentages
    count_series = data[column_name].value_counts()
    percent_series = data[column_name].value_counts(normalize=True) * 100
    
    summary_df = pd.DataFrame({
        'Count': count_series,
        'Frequency': count_series,  # Count is frequency
        'Percentage (%)': percent_series
    })
    display(summary_df.style.format({'Percentage (%)': "{:.2f}%"}))
    
    # Plots
    fig, axes = plt.subplots(1, 2, figsize=(14, 6))
    
    # Bar Chart
    sns.barplot(x=count_series.index, y=count_series.values, ax=axes[0], palette='viridis')
    axes[0].set_title(f'Bar Chart of {column_name}')
    axes[0].set_ylabel('Count')
    axes[0].tick_params(axis='x', rotation=45)
    
    # Pie Chart
    axes[1].pie(count_series.values, labels=count_series.index, autopct='%1.1f%%', startangle=140, colors=sns.color_palette('viridis', len(count_series)))
    axes[1].set_title(f'Pie Chart of {column_name}')
    
    plt.tight_layout()
    plt.show()
"""))

# Numerical Variables
cells.append(nbf.v4.new_markdown_cell("""### 3. Univariate Analysis: Numerical Columns
We will analyze each numerical metric to understand distributions, central tendencies, and dispersions.
"""))

# Generate cells for numerical variables
num_vars = ['Inventory_Level', 'Temperature', 'Humidity', 'Waiting_Time', 
            'User_Transaction_Amount', 'User_Purchase_Frequency', 'Asset_Utilization', 'Demand_Forecast']

interpretations_num = {
    'Inventory_Level': "The histogram and density plot show the distribution of stock levels across facilities. The boxplot helps identify if there are warehouses operating at unusually high or low inventory extremes.",
    'Temperature': "Monitoring temperature is critical for perishable logistics. The metrics show the average operating conditions, while the boxplot highlights any deviations (outliers) that could risk product spoilage.",
    'Humidity': "Similar to temperature, humidity distribution impacts storage quality. The spread indicates the consistency of the environmental controls.",
    'Waiting_Time': "A critical KPI. The right-skewness typically seen in waiting times indicates that while most operations are efficient, there are long-tail instances causing significant delays. Addressing the outliers seen in the boxplot can improve overall efficiency.",
    'User_Transaction_Amount': "This represents the monetary value associated with users. The distribution highlights spending behavior, often showing a concentrated average with some high-value outliers.",
    'User_Purchase_Frequency': "Indicates user engagement. The mode and median help establish the baseline customer behavior, which is useful for forecasting future demand.",
    'Asset_Utilization': "Ideally, this should be concentrated at a high percentage without maxing out (which causes wear and tear). The density plot reveals if assets are generally underutilized or overutilized.",
    'Demand_Forecast': "Shows the anticipated volume. Comparing its variance with actual inventory levels can highlight alignment or mismatch in capacity planning."
}

for var in num_vars:
    cells.append(nbf.v4.new_markdown_cell(f"#### 3.x. {var}"))
    cells.append(nbf.v4.new_code_cell(f"analyze_numerical('{var}', df)"))
    cells.append(nbf.v4.new_markdown_cell(f"**Interpretation & Insight:**\n{interpretations_num[var]}"))

# Categorical Variables
cells.append(nbf.v4.new_markdown_cell("""### 4. Univariate Analysis: Categorical Columns
We will analyze categorical variables to understand segment sizes and operational statuses.
"""))

cat_vars = ['Shipment_Status', 'Traffic_Status', 'Logistics_Delay_Reason', 'Logistics_Delay']

interpretations_cat = {
    'Shipment_Status': "The bar chart provides a quick snapshot of overall logistics health. High proportions of 'Delayed' or 'Cancelled' indicate systemic issues, whereas a dominant 'Delivered' slice in the pie chart shows healthy operations.",
    'Traffic_Status': "Understanding the breakdown of traffic conditions (e.g., Heavy, Moderate, Light) contextualizes delivery performance. If 'Heavy' traffic is highly frequent, routing optimizations are urgently needed.",
    'Logistics_Delay_Reason': "This is the most actionable insight. The Pareto principle often applies here—identifying the top 1-2 delay reasons from the bar chart allows management to focus improvement efforts where they will have the most impact. 'No Delay' serves as our baseline.",
    'Logistics_Delay': "This binary flag (0=No, 1=Yes) encapsulates the ultimate success rate of the logistics network. The percentage split shown in the pie chart is the primary metric for tracking overall reliability."
}

for var in cat_vars:
    cells.append(nbf.v4.new_markdown_cell(f"#### 4.x. {var}"))
    cells.append(nbf.v4.new_code_cell(f"analyze_categorical('{var}', df)"))
    cells.append(nbf.v4.new_markdown_cell(f"**Business Insight:**\n{interpretations_cat[var]}"))


nb.cells = cells

# Save notebook
with open('notebooks/Day_3_Univariate_Analysis.ipynb', 'w', encoding='utf-8') as f:
    nbf.write(nb, f)

print("Notebook 'notebooks/Day_3_Univariate_Analysis.ipynb' successfully generated!")
