import sqlite3
import os
from contextlib import contextmanager

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'operational.db')

def init_db():
    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS operational_decisions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                decision_id TEXT UNIQUE NOT NULL,
                shipment_id INTEGER NOT NULL,
                selected_option TEXT NOT NULL,
                optimized_cost REAL NOT NULL,
                expected_delay REAL NOT NULL,
                solver_objective_value REAL NOT NULL,
                optimization_status TEXT NOT NULL,
                constraint_status TEXT NOT NULL,
                execution_status TEXT NOT NULL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS workflow_states (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                prediction_status TEXT NOT NULL DEFAULT 'PENDING',
                optimization_status TEXT NOT NULL DEFAULT 'PENDING',
                decision_status TEXT NOT NULL DEFAULT 'PENDING',
                execution_status TEXT NOT NULL DEFAULT 'PENDING',
                outcome_status TEXT NOT NULL DEFAULT 'PENDING',
                learning_status TEXT NOT NULL DEFAULT 'PENDING',
                
                -- State Data
                decision_id TEXT,
                selected_option TEXT,
                expected_cost REAL,
                expected_delay REAL,
                actual_cost REAL,
                actual_delay REAL,
                
                -- Audit Data (Optimization)
                optimization_audit_json TEXT
            )
        ''')
        
        # Initialize default workflow if not exists
        cursor.execute("SELECT COUNT(*) FROM workflow_states")
        if cursor.fetchone()[0] == 0:
            cursor.execute("INSERT INTO workflow_states (prediction_status) VALUES ('ACTIVE')")
            
        conn.commit()

@contextmanager
def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

# Initialize on module load
init_db()
