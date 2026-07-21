import nbformat as nbf

nb = nbf.v4.new_notebook()

cells = []

# Title and Intro
cells.append(nbf.v4.new_markdown_cell("""# Smart Logistics Internship Project - Day 1
## Data Exploration and Project Setup

Welcome to Day 1 of the Smart Logistics Internship Project! In this notebook, we will set up our project workspace, understand the project structure, load our dataset, and perform an initial exploratory data analysis (EDA). We will also derive business interpretations from the data.
"""))

# Task 1 & 2: Project Structure
cells.append(nbf.v4.new_markdown_cell("""### 1. Project Structure

A well-organized project structure is crucial for any data science or analytics project. It ensures reproducibility, collaboration, and scalability. Here is the structure we have created for this project:

- `data/`: 
  - `raw/`: Stores the original, immutable dataset (`smart_logistics.csv`). We never modify these files.
  - `processed/`: Stores cleaned and transformed data ready for modeling or analysis.
- `notebooks/`: Contains Jupyter Notebooks like this one, used for exploration, analysis, and prototyping.
- `src/`: Holds the source code (Python scripts) for data processing, feature engineering, and model training.
- `models/`: Stores trained machine learning models for later use.
- `reports/`: Contains generated reports, visualizations, and summary presentations.
- `README.md`: The main documentation file explaining the project, setup instructions, and execution steps.
"""))

# Task 3: Import Libraries
cells.append(nbf.v4.new_markdown_cell("""### 2. Import Required Libraries

First, we need to import the necessary Python libraries. We'll use `pandas` for data manipulation and analysis.

**PEP8 Standard:** All imports are placed at the top of the file, on separate lines.
"""))

cells.append(nbf.v4.new_code_cell("""# Import the pandas library for data manipulation and analysis
import pandas as pd

# Import warnings to suppress unnecessary warnings for a cleaner output
import warnings
warnings.filterwarnings('ignore')
"""))

# Task 4: Load Dataset
cells.append(nbf.v4.new_markdown_cell("""### 3. Load the Smart Logistics Dataset

We will now load the dataset from our `data/raw/` directory into a pandas DataFrame. A DataFrame is a 2-dimensional labeled data structure, similar to a spreadsheet or SQL table.
"""))

cells.append(nbf.v4.new_code_cell("""# Define the path to the dataset
# It is best practice to use relative paths so the code works on different machines
file_path = '../data/raw/smart_logistics.csv'

# Load the CSV file into a pandas DataFrame
# The read_csv function automatically parses the file and infers data types
try:
    df = pd.read_csv(file_path)
    print("Dataset loaded successfully!")
except FileNotFoundError:
    print(f"Error: The file at {file_path} was not found. Please ensure the project structure is correct.")
"""))

# Task 5 & 6 & 9: Display and Explain Outputs
cells.append(nbf.v4.new_markdown_cell("""### 4. Initial Data Exploration

Now that the data is loaded, let's explore it to understand its structure, variables, and overall quality.

#### 4.1. First 5 Rows (`head()`)
Let's look at the first few rows to get a feel for the data.
"""))

cells.append(nbf.v4.new_code_cell("""# Display the first 5 rows of the DataFrame
df.head()
"""))

cells.append(nbf.v4.new_markdown_cell("""**Explanation:** The `head()` function returns the first 5 rows of the dataset. 
**Business Interpretation:** We can see that each row represents a single order with details like order date, origin, destination, vehicle type, and delivery status. This gives us an immediate snapshot of the logistics operations.
"""))

# tail()
cells.append(nbf.v4.new_markdown_cell("""#### 4.2. Last 5 Rows (`tail()`)
Next, we examine the last few rows. This helps ensure that the entire dataset was loaded correctly and checks for any corrupted data at the end of the file.
"""))

cells.append(nbf.v4.new_code_cell("""# Display the last 5 rows of the DataFrame
df.tail()
"""))

cells.append(nbf.v4.new_markdown_cell("""**Explanation:** The `tail()` function returns the last 5 rows.
**Business Interpretation:** Similar to `head()`, this confirms the consistency of the data entries across the timeline of orders.
"""))

# sample()
cells.append(nbf.v4.new_markdown_cell("""#### 4.3. Random Sample (`sample()`)
Viewing a random sample prevents bias that might arise from only looking at the very beginning or end of chronological data.
"""))

cells.append(nbf.v4.new_code_cell("""# Display a random sample of 5 rows from the DataFrame
# random_state is set for reproducibility
df.sample(5, random_state=42)
"""))

cells.append(nbf.v4.new_markdown_cell("""**Explanation:** The `sample(5)` function returns 5 randomly selected rows.
**Business Interpretation:** This provides an unbiased look at typical transactions. We can see a mix of different statuses like 'Delivered' or 'Delayed', which represents the real-world variance in logistics.
"""))

# shape
cells.append(nbf.v4.new_markdown_cell("""#### 4.4. Dataset Dimensions (`shape`)
How large is our dataset?
"""))

cells.append(nbf.v4.new_code_cell("""# Display the shape (number of rows and columns) of the DataFrame
df.shape
"""))

cells.append(nbf.v4.new_markdown_cell("""**Explanation:** The `shape` attribute returns a tuple representing (number of rows, number of columns).
**Business Interpretation:** Knowing the volume of transactions (rows) and the number of data points per transaction (columns) helps us understand the scale of our logistics operations and plan computational resources accordingly.
"""))

# columns
cells.append(nbf.v4.new_markdown_cell("""#### 4.5. Column Names (`columns`)
Let's list all the variables available in our dataset.
"""))

cells.append(nbf.v4.new_code_cell("""# Display all column names in the DataFrame
df.columns
"""))

cells.append(nbf.v4.new_markdown_cell("""**Explanation:** The `columns` attribute returns a list-like object of all column headers.
**Business Interpretation:** These columns represent the Key Performance Indicators (KPIs) and operational metrics we can analyze. For example, `FreightCost_USD` directly impacts profitability, while `DeliveryStatus` and `CustomerRating` reflect service quality.
"""))

# info()
cells.append(nbf.v4.new_markdown_cell("""#### 4.6. Concise Summary (`info()`)
We need a technical summary of the DataFrame, including data types and non-null counts.
"""))

cells.append(nbf.v4.new_code_cell("""# Display a concise summary of the DataFrame including non-null counts and data types
df.info()
"""))

cells.append(nbf.v4.new_markdown_cell("""**Explanation:** The `info()` method prints information about the DataFrame, including the index dtype and columns, non-null values, and memory usage.
**Business Interpretation:** We can identify columns with missing values (e.g., if `CustomerRating` has fewer non-null values than the total rows). Missing data in critical fields like `FreightCost_USD` might indicate reporting errors that need to be addressed by the data engineering or operational teams.
"""))

# dtypes
cells.append(nbf.v4.new_markdown_cell("""#### 4.7. Data Types (`dtypes`)
Let's specifically look at the data types for each column to ensure they are loaded correctly.
"""))

cells.append(nbf.v4.new_code_cell("""# Display the data type of each column
df.dtypes
"""))

cells.append(nbf.v4.new_markdown_cell("""**Explanation:** The `dtypes` attribute returns a Series with the data type of each column.
**Business Interpretation:** Ensuring correct data types is critical. For instance, `OrderDate` should ideally be a datetime object for time-series analysis, and `FreightCost_USD` must be numeric to calculate total costs. (Note: If `OrderDate` is an 'object'/string, we'll need to convert it in the data cleaning phase).
"""))

# describe()
cells.append(nbf.v4.new_markdown_cell("""#### 4.8. Statistical Summary (`describe()`)
Finally, let's generate descriptive statistics for our numerical columns.
"""))

cells.append(nbf.v4.new_code_cell("""# Generate descriptive statistics for numerical columns
df.describe()
"""))

cells.append(nbf.v4.new_markdown_cell("""**Explanation:** The `describe()` method computes summary statistics like count, mean, standard deviation, minimum, maximum, and quartiles for numerical columns.
**Business Interpretation:** 
- The **mean** `FreightCost_USD` gives us the average shipping cost per order.
- The **min** and **max** values help identify outliers (e.g., an unusually high freight cost).
- The quartiles (25%, 50%, 75%) show the distribution of weights and costs, helping us understand if the majority of our shipments are lightweight or heavy, which influences vehicle selection and pricing strategies.
"""))

# Task 10: Summary
cells.append(nbf.v4.new_markdown_cell("""### 5. Summary of Day 1

Today, we successfully established the foundation for the Smart Logistics project. 
1. **Project Setup:** We created a standardized, professional folder structure.
2. **Data Ingestion:** We successfully loaded the raw dataset using pandas.
3. **Data Profiling:** We performed an initial exploration using basic pandas functions (`head`, `info`, `describe`, etc.).
4. **Insights:** We identified the size of our dataset, the data types we are working with, and spotted potential areas requiring data cleaning (like missing customer ratings or costs).

This preliminary understanding is crucial before moving on to deeper analysis.
"""))

# Task 11, 12, 13: Git, README, Day 2
cells.append(nbf.v4.new_markdown_cell("""### 6. Next Steps & Version Control

#### Suggested Git Commit Message
> `feat: setup project structure and add day 1 EDA notebook`
> 
> - Created standard directories (data, notebooks, src, models, reports)
> - Generated Day 1 notebook for initial data exploration
> - Loaded and profiled smart_logistics.csv

#### Suggested README Updates
To keep the project documentation up to date, add the following to the `README.md`:
- **Project Structure:** Briefly describe what each folder contains.
- **Data Setup:** Explain where the raw dataset should be placed (`data/raw/`).
- **Dependencies:** Mention that `pandas` is required to run the notebooks.

#### What's coming on Day 2?
On **Day 2**, we will focus on **Data Cleaning and Preprocessing**. This will involve:
- Handling missing values identified today.
- Converting data types (e.g., parsing strings to datetime objects).
- Identifying and treating outliers.
- Creating new calculated features (Feature Engineering) to aid deeper business analysis.
"""))

nb.cells = cells

# Save the notebook
with open('notebooks/Day_1_Data_Exploration.ipynb', 'w') as f:
    nbf.write(nb, f)

print("Notebook generated successfully at notebooks/Day_1_Data_Exploration.ipynb")
