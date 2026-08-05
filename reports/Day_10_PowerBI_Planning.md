# Day 10: Power BI Dashboard Planning

This document serves as the architectural blueprint for importing the `smart_logistics_engineered.csv` dataset into Power BI and developing a comprehensive BI dashboard solution.

## 1. Data Preparation
- **Import Source:** `smart_logistics_engineered.csv`
- **Data Types Validation:** Ensure `Timestamp` is a Date/Time hierarchy. Ensure `Geo_Cluster`, `Asset_ID`, and `Extreme_Weather_Flag` are treated as Categorical text.
- **Relationships:** Since we are using a flat table, no star schema modeling is required for this phase.

## 2. Dashboard Structure & Layout

We recommend a two-page layout: an **Executive Dashboard** (high-level KPIs) and an **Operational Dashboard** (deep-dive analytics).

### Page 1: Executive Dashboard
**Target Audience:** C-Suite, Supply Chain Directors.
**Objective:** Provide a 30-second overview of network health.

- **KPI Cards (Top Row):**
  - Total Deliveries
  - On-Time Delivery %
  - Average Delay (Minutes)
  - Total Revenue ($)
  - Operational Efficiency Score (0-100)
- **Visualizations:**
  - **Line Chart:** Delivery Volume & On-Time % Trend (X-axis: Timestamp hierarchy Month/Week).
  - **Donut Chart:** Revenue Breakdown by Geo_Cluster.
  - **Bar Chart:** Top 5 Best vs. Worst Performing Geo_Clusters by Delay %.

### Page 2: Operational Dashboard
**Target Audience:** Dispatchers, Fleet Managers, Route Planners.
**Objective:** Identify root causes of delays and manage physical assets.

- **Visualizations:**
  - **Map Visual:** Scatter map using `Latitude` and `Longitude`, bubble size by `User_Transaction_Amount`, colored by `Logistics_Delay` (Red for Delayed, Green for On-time).
  - **Matrix Table (Driver/Asset Performance):** Rows = `Asset_ID`, Columns = `Asset_Utilization`, `Asset_Performance_Score`, `Total Deliveries`. Sorted descending by Performance Score.
  - **Stacked Column Chart:** Delays Breakdown by `Logistics_Delay_Reason` & `Extreme_Weather_Flag`.
  - **Scatter Plot:** `Asset_Utilization` (X) vs. `Waiting_Time` (Y) to spot overworked assets.

## 3. UI / UX Recommendations

- **Color Palette:**
  - Primary: Deep Blue (#0F2C59) and Slate Grey.
  - Status Indicators: Emerald Green (#2E8B57) for On-time, Crimson Red (#DC143C) for Delays, Warning Amber (#FFBF00) for High Demand.
- **Slicers (Left Panel or Top Bar):**
  - Date Range (Slider)
  - Geo_Cluster (Dropdown)
  - Traffic_Status (Checkboxes)
- **Navigation:** Use Power BI Buttons to seamlessly toggle between the Executive and Operational pages.
- **Tooltips:** Create a custom tooltip page. When a user hovers over a `Geo_Cluster` on the main page, the tooltip should show the Top 3 Delay Reasons for that specific zone.
- **Drill-through:** Allow users to right-click an `Asset_ID` on the Executive dashboard and drill through to a hidden page showing that specific vehicle's entire historical route.
