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

SELECT COUNT(*) FROM logistics_data;

SELECT * FROM logistics_data LIMIT 5;

SELECT COUNT(*) AS total_records
FROM logistics_data;

SELECT *
FROM logistics_data
LIMIT 10;

SELECT
COUNT(*) FILTER (WHERE shipment_status IS NULL) AS null_shipment_status,
COUNT(*) FILTER (WHERE inventory_level IS NULL) AS null_inventory,
COUNT(*) FILTER (WHERE logistics_delay IS NULL) AS null_delay
FROM logistics_data;

SELECT *
FROM logistics_data
WHERE logistics_delay > 0;

database_queries.sql
--added average inventory level query
Average Inventory Level
SELECT AVG(inventory_level) AS avg_inventory
FROM logistics_data;

Test change
SELECT NOW();
