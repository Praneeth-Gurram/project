import pandas as pd
import numpy as np
import random
from datetime import datetime, timedelta

# Create dummy data for Smart Logistics
np.random.seed(42)
num_records = 1000

order_ids = [f"ORD{str(i).zfill(5)}" for i in range(1, num_records + 1)]
dates = [datetime(2023, 1, 1) + timedelta(days=random.randint(0, 365)) for _ in range(num_records)]
origins = random.choices(["New York", "Los Angeles", "Chicago", "Houston", "Phoenix"], k=num_records)
destinations = random.choices(["Miami", "Seattle", "Denver", "Atlanta", "Boston"], k=num_records)
weights = np.random.uniform(5.0, 500.0, num_records).round(2)
freight_cost = (weights * np.random.uniform(1.5, 3.5, num_records)).round(2)
delivery_status = random.choices(["Delivered", "In Transit", "Delayed", "Cancelled"], weights=[0.7, 0.15, 0.1, 0.05], k=num_records)
vehicle_type = random.choices(["Truck", "Van", "Train", "Air"], k=num_records)
customer_rating = np.random.choice([1, 2, 3, 4, 5], p=[0.05, 0.05, 0.1, 0.4, 0.4], size=num_records)

df = pd.DataFrame({
    'OrderID': order_ids,
    'OrderDate': dates,
    'Origin': origins,
    'Destination': destinations,
    'Weight_kg': weights,
    'VehicleType': vehicle_type,
    'FreightCost_USD': freight_cost,
    'DeliveryStatus': delivery_status,
    'CustomerRating': customer_rating
})

# Introduce some missing values for realistic scenario
df.loc[df.sample(frac=0.05).index, 'CustomerRating'] = np.nan
df.loc[df.sample(frac=0.02).index, 'FreightCost_USD'] = np.nan

df.to_csv('data/raw/smart_logistics.csv', index=False)
print("Dummy data generated successfully at data/raw/smart_logistics.csv")
