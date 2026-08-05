import pandas as pd
import json
import numpy as np
from sklearn.cluster import KMeans

def generate_dashboard_data():
    file_path = '../smart_logistics_dataset.xlsx'
    df = pd.read_excel(file_path)

    # ----------------------------------------------------
    # Feature Engineering (Day 7)
    # ----------------------------------------------------
    kmeans = KMeans(n_clusters=5, random_state=42, n_init=10)
    df['Geo_Cluster'] = kmeans.fit_predict(df[['Latitude', 'Longitude']])
    df['Geo_Cluster'] = df['Geo_Cluster'].map({
        0: 'Zone North', 1: 'Zone South', 2: 'Zone East', 3: 'Zone West', 4: 'Zone Central'
    })

    df['Extreme_Weather_Flag'] = np.where(
        ((df['Temperature'] < 10) | (df['Temperature'] > 35)) | (df['Humidity'] > 90),
        1, 0
    )

    df['Wait_Percentile'] = df['Waiting_Time'].rank(pct=True)
    df['Asset_Performance_Score'] = df['Asset_Utilization'] * (1 - df['Wait_Percentile']) * 100

    # ----------------------------------------------------
    # KPI Calculations (Day 9)
    # ----------------------------------------------------
    total_deliveries = len(df)
    delayed_deliveries = int(df['Logistics_Delay'].sum())
    completed_on_time = total_deliveries - delayed_deliveries
    on_time_percentage = (completed_on_time / total_deliveries) * 100
    
    avg_waiting_time = df['Waiting_Time'].mean()
    total_revenue = df['User_Transaction_Amount'].sum()
    avg_asset_utilization = df['Asset_Utilization'].mean()
    operational_efficiency = (on_time_percentage / 100) * avg_asset_utilization * 100

    # ----------------------------------------------------
    # Chart Data (Day 4 - 8)
    # ----------------------------------------------------
    # 1. Cluster Performance Data
    cluster_stats = df.groupby('Geo_Cluster').agg(
        Delay_Percentage=('Logistics_Delay', lambda x: x.mean() * 100)
    ).reset_index().to_dict(orient='records')
    cluster_labels = [row['Geo_Cluster'] for row in cluster_stats]
    cluster_delays = [round(row['Delay_Percentage'], 2) for row in cluster_stats]

    # 2. Traffic Impact Data
    traffic_stats = df.groupby('Traffic_Status').agg(
        Delay_Count=('Logistics_Delay', 'sum')
    ).reset_index().to_dict(orient='records')
    traffic_labels = [row['Traffic_Status'] for row in traffic_stats]
    traffic_delays = [int(row['Delay_Count']) for row in traffic_stats]

    # 3. Scatter Data (Demand vs Wait Time - sampled to 100 points for performance)
    scatter_df = df[['Demand_Forecast', 'Waiting_Time']].sample(100, random_state=42)
    scatter_data = [{'x': int(row['Demand_Forecast']), 'y': int(row['Waiting_Time'])} for _, row in scatter_df.iterrows()]

    # 4. Asset Performance (Top 3 and Bottom 3)
    asset_stats = df.groupby('Asset_ID').agg(
        Avg_Score=('Asset_Performance_Score', 'mean')
    ).sort_values(by='Avg_Score', ascending=False)
    
    top_assets = asset_stats.head(3).reset_index()
    bottom_assets = asset_stats.tail(3).reset_index()
    combined_assets = pd.concat([top_assets, bottom_assets])
    
    asset_labels = combined_assets['Asset_ID'].tolist()
    asset_scores = [round(score, 1) for score in combined_assets['Avg_Score'].tolist()]

    # 5. Weather Impact Data
    weather_impact = df.groupby('Extreme_Weather_Flag')['Logistics_Delay'].mean() * 100
    weather_labels = ["Normal Weather", "Extreme Weather"]
    weather_delays = [
        round(weather_impact.get(0, 0), 1), 
        round(weather_impact.get(1, 0), 1)
    ]

    # ----------------------------------------------------
    # Compile JSON
    # ----------------------------------------------------
    data = {
        "kpis": {
            "totalDeliveries": int(total_deliveries),
            "onTimePercentage": float(round(on_time_percentage, 1)),
            "avgWaitTime": float(round(avg_waiting_time, 1)),
            "totalRevenue": float(round(total_revenue, 2)),
            "efficiencyScore": float(round(operational_efficiency, 1))
        },
        "charts": {
            "deliveryStatus": {
                "labels": ["On-Time", "Delayed"],
                "data": [int(completed_on_time), int(delayed_deliveries)]
            },
            "clusterDelays": {
                "labels": cluster_labels,
                "data": cluster_delays
            },
            "trafficDelays": {
                "labels": traffic_labels,
                "data": traffic_delays
            },
            "scatterDemandWait": {
                "data": scatter_data
            },
            "assetPerformance": {
                "labels": asset_labels,
                "data": asset_scores
            },
            "weatherImpact": {
                "labels": weather_labels,
                "data": weather_delays
            }
        }
    }

    # Save to data.json
    with open('data.json', 'w') as f:
        json.dump(data, f, indent=4)
        
    print("Dashboard data successfully generated at data.json")

if __name__ == "__main__":
    generate_dashboard_data()
