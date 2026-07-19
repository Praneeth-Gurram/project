-- Create Table
CREATE TABLE logistics_data (
    timestamp DATE,
    asset_id VARCHAR(20),
    latitude NUMERIC(10,6),
    longitude NUMERIC(10,6),
    inventory_level INT,
    shipment_status VARCHAR(30),
    temperature NUMERIC(5,2),
    humidity NUMERIC(5,2),
    traffic_status VARCHAR(30),
    waiting_time INT,
    user_transaction_amount NUMERIC(10,2),
    user_purchase_frequency INT,
    logistics_delay_reason VARCHAR(100),
    asset_utilization NUMERIC(5,2),
    demand_forecast INT,
    logistics_delay INT
);

-- View all records
SELECT * FROM logistics_data;

-- Total number of records
SELECT COUNT(*) AS total_records
FROM logistics_data;

-- First 10 records
SELECT *
FROM logistics_data
LIMIT 10;

-- Check NULL values
SELECT
COUNT(*) FILTER (WHERE shipment_status IS NULL) AS null_shipment_status,
COUNT(*) FILTER (WHERE inventory_level IS NULL) AS null_inventory,
COUNT(*) FILTER (WHERE logistics_delay IS NULL) AS null_delay
FROM logistics_data;

-- Average inventory level
SELECT AVG(inventory_level) AS average_inventory
FROM logistics_data;

-- Maximum inventory level
SELECT MAX(inventory_level) AS max_inventory
FROM logistics_data;

-- Minimum inventory level
SELECT MIN(inventory_level) AS min_inventory
FROM logistics_data;

-- Average temperature
SELECT AVG(temperature) AS average_temperature
FROM logistics_data;

-- Average humidity
SELECT AVG(humidity) AS average_humidity
FROM logistics_data;

-- Shipment status count
SELECT shipment_status, COUNT(*) AS total
FROM logistics_data
GROUP BY shipment_status;

-- Traffic status count
SELECT traffic_status, COUNT(*) AS total
FROM logistics_data
GROUP BY traffic_status;

-- Delay reason count
SELECT logistics_delay_reason, COUNT(*) AS total
FROM logistics_data
GROUP BY logistics_delay_reason;

-- Average waiting time
SELECT AVG(waiting_time) AS average_waiting_time
FROM logistics_data;

-- Highest waiting time
SELECT MAX(waiting_time) AS highest_waiting_time
FROM logistics_data;

-- Total transaction amount
SELECT SUM(user_transaction_amount) AS total_transaction_amount
FROM logistics_data;

-- Average transaction amount
SELECT AVG(user_transaction_amount) AS average_transaction_amount
FROM logistics_data;

-- Average purchase frequency
SELECT AVG(user_purchase_frequency) AS average_purchase_frequency
FROM logistics_data;

-- Average asset utilization
SELECT AVG(asset_utilization) AS average_asset_utilization
FROM logistics_data;

-- Average demand forecast
SELECT AVG(demand_forecast) AS average_demand_forecast
FROM logistics_data;

-- Records with logistics delay
SELECT *
FROM logistics_data
WHERE logistics_delay = 1;

-- Records without logistics delay
SELECT *
FROM logistics_data
WHERE logistics_delay = 0;

-- High inventory records
SELECT *
FROM logistics_data
WHERE inventory_level > 500;

-- High temperature records
SELECT *
FROM logistics_data
WHERE temperature > 35;

-- Heavy traffic shipments
SELECT *
FROM logistics_data
WHERE traffic_status = 'Heavy';

-- Delivered shipments
SELECT *
FROM logistics_data
WHERE shipment_status = 'Delivered';

-- Pending shipments
SELECT *
FROM logistics_data
WHERE shipment_status = 'Pending';

-- Order by inventory level
SELECT *
FROM logistics_data
ORDER BY inventory_level DESC;

-- Order by transaction amount
SELECT *
FROM logistics_data
ORDER BY user_transaction_amount DESC;

-- Top 10 highest transaction records
SELECT *
FROM logistics_data
ORDER BY user_transaction_amount DESC
LIMIT 10;

-- Asset utilization by shipment status
SELECT
    shipment_status,
    AVG(asset_utilization) AS avg_utilization
FROM logistics_data
GROUP BY shipment_status;

-- Delay count by traffic status
SELECT
    traffic_status,
    COUNT(*) AS total_delays
FROM logistics_data
WHERE logistics_delay = 1
GROUP BY traffic_status;

-- Total delayed shipments
SELECT COUNT(*) AS delayed_shipments
FROM logistics_data
WHERE logistics_delay = 1;

-- Current timestamp
SELECT NOW();