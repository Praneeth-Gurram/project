import nbformat as nbf

nb = nbf.v4.new_notebook()
cells = []

# Title & Overview
cells.append(nbf.v4.new_markdown_cell("""# Smart Logistics Internship Project - Day 8
## Advanced Business Insights

Welcome to Day 8! Today, we leverage our engineered dataset to generate high-level, advanced business insights. This analysis bridges the gap between raw data and executive decision-making.

### Day 8 Objectives:
Analyze the dataset to identify:
1. **Best/Worst Performing Geographical Zones** (Proxy for Cities/Routes)
2. **Best/Worst Performing Vehicles** (Using `Asset_ID`)
3. **Delivery Trends over Time**
4. **Highest Cost Deliveries vs Revenue**
5. **Insights on Delays by Traffic/Weather**
"""))

# Setup
cells.append(nbf.v4.new_code_cell("""import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import warnings
warnings.filterwarnings('ignore')

# Set aesthetic parameters for plots
sns.set_theme(style="whitegrid")
plt.rcParams['figure.figsize'] = (12, 6)

# Load the engineered dataset from Day 7
file_path = '../smart_logistics_engineered.csv'
df = pd.read_csv(file_path)

# Ensure Timestamp is datetime
df['Timestamp'] = pd.to_datetime(df['Timestamp'])

print(f"Dataset shape: {df.shape}")
df.head(2)
"""))

# 1. Best / Worst Zones (Cities/Routes Proxy)
cells.append(nbf.v4.new_markdown_cell("""### 1. Zone Performance (Proxy for Cities/Routes)
Using the `Geo_Cluster` feature we built, we can identify which geographic zones are operating efficiently and which are struggling with delays.
"""))

cells.append(nbf.v4.new_code_cell("""zone_stats = df.groupby('Geo_Cluster').agg(
    Avg_Wait_Time=('Waiting_Time', 'mean'),
    Delay_Percentage=('Logistics_Delay', lambda x: x.mean() * 100),
    Total_Revenue=('User_Transaction_Amount', 'sum')
).sort_values(by='Delay_Percentage')

print("Geographical Zone Performance (Sorted by lowest delay %):")
display(zone_stats.round(2))

fig, ax1 = plt.subplots(figsize=(10, 6))

# Bar chart for Delay %
sns.barplot(data=zone_stats.reset_index(), x='Geo_Cluster', y='Delay_Percentage', color='lightcoral', ax=ax1)
ax1.set_ylabel('Delay Percentage (%)', color='red')
ax1.tick_params(axis='y', labelcolor='red')

# Line chart for Revenue
ax2 = ax1.twinx()
sns.lineplot(data=zone_stats.reset_index(), x='Geo_Cluster', y='Total_Revenue', color='darkblue', marker='o', ax=ax2, linewidth=2)
ax2.set_ylabel('Total Revenue', color='darkblue')
ax2.tick_params(axis='y', labelcolor='darkblue')

plt.title('Zone Performance: Delay % vs Total Revenue')
plt.show()
"""))

cells.append(nbf.v4.new_markdown_cell("""**Business Insight:**
- **Best Route/Zone:** The zone with the lowest `Delay_Percentage` and reasonable revenue is our best-performing area. Operations here are smooth.
- **Worst Route/Zone:** A zone with high revenue but high `Delay_Percentage` indicates we are providing poor service to our highest-paying areas. This zone needs immediate operational support.
"""))

# 2. Best / Worst Vehicles (Asset_ID)
cells.append(nbf.v4.new_markdown_cell("""### 2. Best / Worst Vehicles (Asset_ID)
We evaluate the performance of our physical fleet by looking at our `Asset_Performance_Score`.
"""))

cells.append(nbf.v4.new_code_cell("""asset_stats = df.groupby('Asset_ID').agg(
    Avg_Performance_Score=('Asset_Performance_Score', 'mean'),
    Total_Deliveries=('Asset_ID', 'count')
).sort_values(by='Avg_Performance_Score', ascending=False)

best_assets = asset_stats.head(3)
worst_assets = asset_stats.tail(3)

print("🏆 Best Performing Vehicles:")
display(best_assets)
print("\\n⚠️ Worst Performing Vehicles:")
display(worst_assets)

plt.figure(figsize=(14, 6))
sns.barplot(data=asset_stats.reset_index(), x='Asset_ID', y='Avg_Performance_Score', palette='viridis')
plt.title('Average Performance Score by Vehicle (Asset_ID)')
plt.xticks(rotation=45)
plt.show()
"""))

cells.append(nbf.v4.new_markdown_cell("""**Business Insight:**
- Vehicles with high scores are our "Most Efficient Drivers/Vehicles". They have high utilization and low waiting times.
- Vehicles with the lowest scores are underutilized or constantly delayed. They require maintenance checks or their assigned drivers require additional training.
"""))

# 3. Delivery Trends Over Time
cells.append(nbf.v4.new_markdown_cell("""### 3. Delivery Trends Over Time
We analyze how delivery volume and average waiting times fluctuate based on the month.
"""))

cells.append(nbf.v4.new_code_cell("""# Extract Month for trend analysis
df['Month'] = df['Timestamp'].dt.month

trend_stats = df.groupby('Month').agg(
    Total_Deliveries=('Asset_ID', 'count'),
    Avg_Wait_Time=('Waiting_Time', 'mean')
).reset_index()

fig, ax1 = plt.subplots(figsize=(12, 6))

# Deliveries per month
sns.barplot(data=trend_stats, x='Month', y='Total_Deliveries', color='lightblue', ax=ax1)
ax1.set_ylabel('Total Deliveries', color='blue')
ax1.set_xlabel('Month (1-12)')

# Waiting time per month
ax2 = ax1.twinx()
sns.lineplot(data=trend_stats, x='Month', y='Avg_Wait_Time', color='orange', marker='s', ax=ax2, linewidth=3)
ax2.set_ylabel('Average Waiting Time (Mins)', color='orange')

plt.title('Monthly Delivery Volume vs Average Waiting Time')
plt.show()
"""))

cells.append(nbf.v4.new_markdown_cell("""**Business Insight:**
- If we see `Total_Deliveries` increasing during specific months while `Avg_Wait_Time` also spikes, our network lacks the elasticity to handle peak seasons.
- We need to onboard temporary contractors before these historical spike months.
"""))

# 4. Highest Cost Deliveries (Lost Revenue Potential)
cells.append(nbf.v4.new_markdown_cell("""### 4. Highest Cost Deliveries
We look at deliveries with the lowest `Revenue_Per_Wait_Minute`. These are technically our "Highest Cost" deliveries because they consume massive amounts of time for very little financial return.
"""))

cells.append(nbf.v4.new_code_cell("""worst_deliveries = df.sort_values(by='Revenue_Per_Wait_Minute', ascending=True).head(5)
print("Top 5 'Highest Cost' (Most Inefficient) Deliveries:")
display(worst_deliveries[['Asset_ID', 'Geo_Cluster', 'Waiting_Time', 'User_Transaction_Amount', 'Revenue_Per_Wait_Minute']])
"""))

cells.append(nbf.v4.new_markdown_cell("""**Business Insight:**
- These specific deliveries represent a drain on resources. We should investigate if these clusters or asset combinations frequently result in these highly inefficient trips and consider restructuring pricing for these specific routes.
"""))

nb.cells = cells

# Save notebook
with open('notebooks/Day_8_Advanced_Insights.ipynb', 'w', encoding='utf-8') as f:
    nbf.write(nb, f)

print("Notebook 'notebooks/Day_8_Advanced_Insights.ipynb' successfully generated!")
