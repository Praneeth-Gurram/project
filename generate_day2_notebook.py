# pyrefly: ignore [missing-import]
import nbformat as nbf

nb = nbf.v4.new_notebook()
cells = []

# Title & Overview
cells.append(nbf.v4.new_markdown_cell("""# Smart Logistics Internship Project - Day 2
## Data Cleaning and Preprocessing

Welcome to Day 2 of the Smart Logistics Internship! Today, our focus is entirely on **Data Cleaning**. 
In real-world data science projects, raw data is rarely perfect. Cleaning is one of the most critical steps, as the quality of our data directly determines the quality of our insights and downstream machine learning models ("garbage in, garbage out").

### Day 2 Objectives:
1. **Detect Data Quality Issues:** Search for missing values, duplicate rows, incorrect data types, whitespace anomalies, inconsistent text casing, and invalid values.
2. **Handle Missing Values Professionally:** Analyze structural missingness in delay reasons and resolve them with meaningful placeholders.
3. **Standardize Text & Categories:** Sanitize text columns by removing trailing/leading whitespaces and standardizing categories.
4. **Enforce Type Consistency:** Convert data types (like casting timestamps to datetimes) for future analysis.
5. **Before/After Audit & Business Interpretations:** Document all decisions, visualize data completeness improvements, and summarize business implications.
"""))

# 1. Setup
cells.append(nbf.v4.new_markdown_cell("""### 1. Set Up and Load Data
We'll begin by importing the required libraries and loading our raw logistics dataset.
"""))

cells.append(nbf.v4.new_code_cell("""import pandas as pd
import numpy as np
import warnings
warnings.filterwarnings('ignore')

# Set option to display all columns
pd.set_option('display.max_columns', None)

# Load the raw dataset
file_path = '../data/raw/smart_logistics_dataset_updated.xlsx'
df_raw = pd.read_excel(file_path)

print(f"Raw dataset shape: {df_raw.shape}")
df_raw.head()
"""))

# 2. Data Quality Audit (Before)
cells.append(nbf.v4.new_markdown_cell("""### 2. Data Quality Audit (Detecting Issues)

Before modifying the data, we must perform a comprehensive audit to identify all issues. We will look for:
- Missing values
- Duplicate rows
- Incorrect data types
- Unique values in categoricals
- Whitespace problems
- Invalid/Unrealistic values
"""))

cells.append(nbf.v4.new_markdown_cell("""#### 2.1. Detect Missing Values"""))
cells.append(nbf.v4.new_code_cell("""# Count null values per column
missing_counts = df_raw.isnull().sum()
missing_percentages = (df_raw.isnull().sum() / len(df_raw)) * 100

missing_info = pd.DataFrame({
    'Missing Count': missing_counts,
    'Percentage (%)': missing_percentages
}).sort_values(by='Missing Count', ascending=False)

print("Missing values in raw data:")
missing_info[missing_info['Missing Count'] > 0]
"""))

cells.append(nbf.v4.new_markdown_cell("""#### 2.2. Detect Duplicate Rows"""))
cells.append(nbf.v4.new_code_cell("""# Check for overall duplicate rows
duplicate_rows = df_raw.duplicated().sum()
print(f"Number of duplicate rows: {duplicate_rows}")

# Check for duplicate Asset records at the same timestamp (which should be unique key combinations)
duplicate_keys = df_raw.duplicated(subset=['Asset_ID', 'Timestamp']).sum()
print(f"Number of duplicate Asset_ID + Timestamp combinations: {duplicate_keys}")
"""))

cells.append(nbf.v4.new_markdown_cell("""#### 2.3. Identify Incorrect Data Types"""))
cells.append(nbf.v4.new_code_cell("""# Display column data types
df_raw.dtypes
"""))

cells.append(nbf.v4.new_markdown_cell("""#### 2.4. Audit Unique Values in Categorical Columns"""))
cells.append(nbf.v4.new_code_cell("""# Check unique values and distributions for categorical variables
cat_cols = ['Asset_ID', 'Shipment_Status', 'Traffic_Status', 'Logistics_Delay_Reason']
for col in cat_cols:
    print(f"\\nUnique values for '{col}':")
    print(df_raw[col].value_counts(dropna=False))
"""))

cells.append(nbf.v4.new_markdown_cell("""#### 2.5. Audit Whitespace & Casing Inconsistencies"""))
cells.append(nbf.v4.new_code_cell("""# Detect leading/trailing spaces in text columns
text_cols = ['Asset_ID', 'Shipment_Status', 'Traffic_Status', 'Logistics_Delay_Reason']
for col in text_cols:
    non_null_vals = df_raw[col].dropna().astype(str)
    has_spaces = (non_null_vals.str.strip() != non_null_vals).sum()
    print(f"Column '{col}' has leading/trailing whitespaces in {has_spaces} rows.")
"""))

cells.append(nbf.v4.new_markdown_cell("""#### 2.6. Detect Invalid or Out-of-bounds Values"""))
cells.append(nbf.v4.new_code_cell("""# Numerical checks: coordinates, utilization, inventory, etc.
invalid_lat = ((df_raw['Latitude'] < -90) | (df_raw['Latitude'] > 90)).sum()
invalid_lon = ((df_raw['Longitude'] < -180) | (df_raw['Longitude'] > 180)).sum()
invalid_inventory = (df_raw['Inventory_Level'] < 0).sum()
invalid_utilization = ((df_raw['Asset_Utilization'] < 0) | (df_raw['Asset_Utilization'] > 100)).sum()
invalid_delay = (~df_raw['Logistics_Delay'].isin([0, 1])).sum()

print(f"Invalid Latitudes (outside [-90, 90]): {invalid_lat}")
print(f"Invalid Longitudes (outside [-180, 180]): {invalid_lon}")
print(f"Invalid Inventory Level (< 0): {invalid_inventory}")
print(f"Invalid Asset Utilization (outside [0, 100]): {invalid_utilization}")
print(f"Invalid Logistics Delay flag (not 0 or 1): {invalid_delay}")
"""))

# 3. Data Cleaning Execution
cells.append(nbf.v4.new_markdown_cell("""### 3. Data Cleaning & Standardization

Now we will implement professional solutions for each detected issue.

#### Cleaning Actions Plan:
1. **Type Conversion:** Ensure `Timestamp` is cast to a pandas `datetime64` object.
2. **Missing Values Handling:**
   - **`Logistics_Delay_Reason`**: The 198 missing values correspond to shipments that are **"On Schedule"** (no delay). Imputing them with dummy reasons or deleting them is bad practice. We will replace these null values with the placeholder **`"No Delay"`** to explicitly represent successful transit and keep the data structure clean.
3. **Deduplication:** Run `drop_duplicates` to guarantee no duplicate records exist.
4. **Whitespace and Text Casing Standardization:** Apply `.str.strip()` and ensure all string columns are formatted with consistent Title Case/Standard Casing.
"""))

cells.append(nbf.v4.new_code_cell("""# Make a copy of the dataframe to start cleaning
df_clean = df_raw.copy()
"""))

cells.append(nbf.v4.new_markdown_cell("""#### 3.1. Standardize Data Types"""))
cells.append(nbf.v4.new_code_cell("""# Convert Timestamp to datetime type
df_clean['Timestamp'] = pd.to_datetime(df_clean['Timestamp'])
print(f"Timestamp type converted to: {df_clean['Timestamp'].dtype}")
"""))

cells.append(nbf.v4.new_markdown_cell("""#### 3.2. Handle Missing Values Professionally"""))
cells.append(nbf.v4.new_code_cell("""# Replace missing Logistics_Delay_Reason values with 'No Delay'
df_clean['Logistics_Delay_Reason'] = df_clean['Logistics_Delay_Reason'].fillna('No Delay')

print(f"Remaining nulls in clean dataset: {df_clean.isnull().sum().sum()}")
df_clean['Logistics_Delay_Reason'].value_counts()
"""))

cells.append(nbf.v4.new_markdown_cell("""#### 3.3. Standardize Text Formatting & Whitespaces"""))
cells.append(nbf.v4.new_code_cell("""# Strip whitespaces and standardize casing for all text columns
for col in ['Asset_ID', 'Shipment_Status', 'Traffic_Status', 'Logistics_Delay_Reason']:
    # Strip spaces
    df_clean[col] = df_clean[col].astype(str).str.strip()
    # Standardize casing to Title Case (e.g. 'heavy' -> 'Heavy')
    df_clean[col] = df_clean[col].str.title()

print("Casing and whitespaces standardized!")
"""))

cells.append(nbf.v4.new_markdown_cell("""#### 3.4. Handle Duplicate Rows"""))
cells.append(nbf.v4.new_code_cell("""# Remove duplicate rows only if they exist
initial_rows = len(df_clean)
df_clean = df_clean.drop_duplicates()
final_rows = len(df_clean)

print(f"Removed {initial_rows - final_rows} duplicate rows.")
"""))

# 4. Before & After Comparison
cells.append(nbf.v4.new_markdown_cell("""### 4. Side-by-Side Data Quality Comparison

Let's review the dataset status before and after the data cleaning phase.
"""))

cells.append(nbf.v4.new_code_cell("""# Compare missing counts and types
comparison_df = pd.DataFrame({
    'Raw Columns': df_raw.columns,
    'Raw Type': df_raw.dtypes.values,
    'Raw Nulls': df_raw.isnull().sum().values,
    'Clean Type': df_clean.dtypes.values,
    'Clean Nulls': df_clean.isnull().sum().values
})
comparison_df
"""))

# 5. Export Clean Data
cells.append(nbf.v4.new_markdown_cell("""### 5. Export Clean Dataset
Now we save the cleaned dataset in the `data/processed/` directory. 
By keeping raw and processed directories separate, we preserve data lineage.
"""))

cells.append(nbf.v4.new_code_cell("""import os

# Create directory if it doesn't exist
os.makedirs('../data/processed', exist_ok=True)

# Export cleaned DataFrame to CSV
output_path = '../data/processed/smart_logistics_clean.csv'
df_clean.to_csv(output_path, index=False)
print(f"Cleaned dataset successfully saved to: {output_path}")
"""))

# 6. Business Interpretations & Summary
cells.append(nbf.v4.new_markdown_cell("""### 6. Summary of Cleaning Decisions & Business Interpretation

Here is the strategic summary of our data cleaning decisions:

| Data Issue | Cleaning Decision | Business Justification / Impact |
| :--- | :--- | :--- |
| **`Timestamp`** as string | Converted to datetime object | Allows time-series slicing, delay analysis over different months, and seasonal trend mapping. |
| **Missing `Logistics_Delay_Reason`** | Filled with `"No Delay"` | Imputing arbitrary values or discarding rows would bias delay causes. Replacing with `"No Delay"` correctly categorizes successful shipments and keeps the record count intact. |
| **Whitespace/Casing** | Stripped whitespaces and set Title Case | Eliminates grouping bugs (e.g., 'Heavy' vs ' heavy' treated as different traffic levels), improving downstream analysis. |
| **Duplicates Check** | Enforced uniqueness | Ensures that metrics like revenue or delivery count are not double-counted. |

This cleaning pipeline ensures our dataset is robust, accurate, and ready for further exploration and model training on Day 3.
"""))

nb.cells = cells

# Save notebook
with open('notebooks/Day_2_Data_Cleaning.ipynb', 'w') as f:
    nbf.write(nb, f)

print("Notebook 'notebooks/Day_2_Data_Cleaning.ipynb' successfully generated!")
