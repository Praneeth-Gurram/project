import sys
import unittest
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from fastapi.testclient import TestClient

from backend.main import app


class DashboardApiTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_dashboard_summary_endpoint(self):
        response = self.client.get('/dashboard/summary')
        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertIn('stats', body)
        self.assertIn('summary', body)
        self.assertGreater(len(body['stats']), 0)

    def test_orders_endpoint(self):
        response = self.client.get('/orders')
        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertIsInstance(body, list)
        self.assertGreater(len(body), 0)
        self.assertIn('name', body[0])

    def test_shipments_endpoint(self):
        response = self.client.get('/shipments')
        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response.json(), list)


if __name__ == '__main__':
    unittest.main()
