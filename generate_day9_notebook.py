import nbformat as nbf

nb = nbf.v4.new_notebook()
cells = []

# Title & Overview
cells.append(nbf.v4.new_markdown_cell("""# Smart Logistics Internship Project - Day 9
## KPI Calculations

Welcome to Day 9! Key Performance Indicators (KPIs) are the measurable values that demonstrate how effectively a company is achieving key business objectives. 

### Day 9 Objectives:
Calculate the following global KPIs dynamically based on our engineered dataset:
1. **Total Deliveries**
2. **Completed vs Delayed Deliveries**
3. **On-Time Delivery Percentage**
4. **Average Delivery/Waiting Time**
5. **Total Revenue & Average Transaction Amount**
6. **Average Asset Utilization**
7. **Operational Efficiency Score**
"""))

# Setup
cells.append(nbf.v4.new_code_cell("""import pandas as pd
import numpy as np

# Load the engineered dataset
file_path = '../smart_logistics_engineered.csv'
df = pd.read_csv(file_path)

print(f"Dataset successfully loaded. Ready for KPI calculation!")
"""))

# 1. Calculate KPIs
cells.append(nbf.v4.new_markdown_cell("""### 1. Calculating the KPIs
We will calculate these dynamically so that if the dataset updates, the KPIs update automatically.
"""))

cells.append(nbf.v4.new_code_cell("""# 1. Deliveries
total_deliveries = len(df)
delayed_deliveries = df['Logistics_Delay'].sum()
completed_on_time = total_deliveries - delayed_deliveries
on_time_percentage = (completed_on_time / total_deliveries) * 100

# 2. Time & Revenue
avg_waiting_time = df['Waiting_Time'].mean()
total_revenue = df['User_Transaction_Amount'].sum()
avg_transaction_amount = df['User_Transaction_Amount'].mean()

# 3. Efficiency
avg_asset_utilization = df['Asset_Utilization'].mean()
# Operational Efficiency = (On-time % * Avg Asset Utilization)
operational_efficiency = (on_time_percentage / 100) * avg_asset_utilization * 100

print("✅ KPIs Calculated successfully!")
"""))

# 2. Display KPI Cards
cells.append(nbf.v4.new_markdown_cell("""### 2. KPI Summary Cards
Below is a formatted summary of our network's overall performance.
"""))

cells.append(nbf.v4.new_code_cell("""print("="*40)
print(" 🚛 SMART LOGISTICS - GLOBAL KPIs 🚛")
print("="*40)
print(f"📦 Total Deliveries: {total_deliveries:,}")
print(f"⏱️  Delayed Deliveries: {delayed_deliveries:,} ({100-on_time_percentage:.1f}%)")
print(f"✅ On-Time Delivery %: {on_time_percentage:.1f}%")
print("-" * 40)
print(f"⏳ Average Wait Time: {avg_waiting_time:.1f} Mins")
print(f"💰 Total Revenue: ${total_revenue:,.2f}")
print(f"💵 Avg Transaction: ${avg_transaction_amount:,.2f}")
print("-" * 40)
print(f"🚚 Avg Asset Utilization: {avg_asset_utilization:.1f}%")
print(f"📈 Operational Efficiency Score: {operational_efficiency:.1f}/100")
print("="*40)
"""))

# 3. Explain Every KPI
cells.append(nbf.v4.new_markdown_cell("""### 3. Explanation of KPIs

- **Total Deliveries:** The total count of shipments/transactions in the dataset. Provides baseline scale.
- **Delayed Deliveries & On-Time %:** The core metric for customer satisfaction. If On-Time % drops below our SLA (e.g., 90%), immediate action is needed.
- **Average Wait Time:** Directly measures processing/delivery speed. Lowering this increases customer satisfaction and asset throughput.
- **Total Revenue & Avg Transaction:** Financial health metrics. A high total revenue paired with a high delay percentage means we are risking our most valuable accounts.
- **Avg Asset Utilization:** Measures how well we are using our fleet capacity. Values between 70-85% are usually ideal; >90% indicates strain, <60% indicates wasted resources.
- **Operational Efficiency Score:** A custom composite score (On-Time % × Avg Asset Utilization). It drops if vehicles are empty OR if they are full but always late. It peaks when vehicles are optimally packed and arriving on time.
"""))


nb.cells = cells

# Save notebook
with open('notebooks/Day_9_KPI_Calculations.ipynb', 'w', encoding='utf-8') as f:
    nbf.write(nb, f)

print("Notebook 'notebooks/Day_9_KPI_Calculations.ipynb' successfully generated!")
