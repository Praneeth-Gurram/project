import pytest
from fastapi.testclient import TestClient
import os
import sys
import time

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from main import app

client = TestClient(app)

def test_login_endpoint_variations():
    """Verify that all auth route aliases support POST without 405 Method Not Allowed."""
    endpoints = ["/api/auth/login", "/api/login", "/auth/login", "/login"]
    for ep in endpoints:
        res = client.post(ep, json={
            "email": "admin@logisphere.ai",
            "password": "admin123"
        })
        assert res.status_code == 200, f"Endpoint {ep} failed with status {res.status_code}: {res.text}"
        assert res.json()["success"] is True

def test_login_invalid_password():
    response = client.post("/api/auth/login", json={
        "email": "admin@logisphere.ai",
        "password": "wrongpassword"
    })
    assert response.status_code == 401
    assert "Invalid email or password" in response.json()["detail"]

def test_login_empty_fields():
    response = client.post("/api/auth/login", json={
        "email": "",
        "password": ""
    })
    assert response.status_code == 400

def test_register_endpoint_variations():
    """Verify that all registration route aliases support POST without 405 Method Not Allowed."""
    endpoints = ["/api/auth/register", "/api/register", "/auth/register", "/register"]
    for i, ep in enumerate(endpoints):
        unique_email = f"analyst_alias_{i}_{int(time.time())}@logisphere.ai"
        res = client.post(ep, json={
            "name": f"Alias Tester {i}",
            "email": unique_email,
            "password": "securepassword123",
            "confirm_password": "securepassword123",
            "company": "Global LogiSphere Fleet",
            "role": "Logistics Director"
        })
        assert res.status_code == 200, f"Endpoint {ep} failed with status {res.status_code}: {res.text}"
        assert res.json()["success"] is True

def test_registration_password_mismatch():
    response = client.post("/api/auth/register", json={
        "name": "David Thorne",
        "email": "david_mismatch@logisphere.ai",
        "password": "securepass123",
        "confirm_password": "differentpass"
    })
    assert response.status_code == 400
    assert "Passwords do not match" in response.json()["detail"]

def test_registration_weak_password():
    response = client.post("/api/auth/register", json={
        "name": "David Thorne",
        "email": "david_weak@logisphere.ai",
        "password": "123",
        "confirm_password": "123"
    })
    assert response.status_code == 400
    assert "at least 6 characters" in response.json()["detail"]

def test_registration_duplicate_email():
    response = client.post("/api/auth/register", json={
        "name": "Sarah Chen",
        "email": "admin@logisphere.ai",
        "password": "anotherpassword",
        "confirm_password": "anotherpassword"
    })
    assert response.status_code == 409
    assert "already exists" in response.json()["detail"]

def test_google_auth_endpoint_variations():
    endpoints = ["/api/auth/google", "/api/google", "/auth/google", "/google"]
    for ep in endpoints:
        res = client.post(ep, json={
            "email": "sarah.chen@google.com",
            "name": "Sarah Chen",
            "credential": "mock.google.jwt"
        })
        assert res.status_code == 200, f"Endpoint {ep} failed with status {res.status_code}: {res.text}"
        assert res.json()["success"] is True

def test_forgot_password_variations():
    endpoints = ["/api/auth/forgot-password", "/api/forgot-password", "/auth/forgot-password", "/forgot-password"]
    for ep in endpoints:
        res = client.post(ep, json={
            "email": "director@logisphere.ai"
        })
        assert res.status_code == 200, f"Endpoint {ep} failed with status {res.status_code}: {res.text}"
        assert res.json()["success"] is True

def test_verify_auth_token():
    response = client.get("/api/auth/verify", headers={
        "Authorization": "Bearer LOGISPHERE-12345"
    })
    assert response.status_code == 200
    assert response.json()["valid"] is True

# ====================================================
# QUICK WORKSPACE DEMO ACCOUNT TESTS
# ====================================================

def test_demo_login_admin():
    endpoints = ["/api/auth/demo", "/api/demo-login", "/auth/demo", "/demo-login"]
    for ep in endpoints:
        res = client.post(ep, json={"role": "admin"})
        assert res.status_code == 200
        data = res.json()
        assert data["success"] is True
        assert "LOGISPHERE-DEMO-ADMIN" in data["token"]
        assert data["user"]["role_key"] == "admin"
        assert data["user"]["badge"] == "ADMIN"
        assert "overview-section" in data["user"]["allowed_modules"]
        assert "xai-section" in data["user"]["allowed_modules"]

def test_demo_login_director():
    res = client.post("/api/auth/demo", json={"role": "director"})
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "LOGISPHERE-DEMO-DIRECTOR" in data["token"]
    assert data["user"]["role_key"] == "director"
    assert data["user"]["badge"] == "DIRECTOR"
    assert "tracking-section" not in data["user"]["allowed_modules"]
    assert "reports-section" in data["user"]["allowed_modules"]

def test_demo_login_operator():
    res = client.post("/api/auth/demo", json={"role": "operator"})
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "LOGISPHERE-DEMO-OPERATOR" in data["token"]
    assert data["user"]["role_key"] == "operator"
    assert data["user"]["badge"] == "OPERATOR"
    assert "tracking-section" in data["user"]["allowed_modules"]
    assert "reports-section" not in data["user"]["allowed_modules"]

def test_demo_login_invalid_role():
    res = client.post("/api/auth/demo", json={"role": "superadmin_unknown"})
    assert res.status_code == 400
    assert "Invalid demo role" in res.json()["detail"]

def test_role_permission_restriction_operator():
    """Verify that an Operator token trying to execute strategic recommendations receives 403 Forbidden."""
    operator_token = "Bearer LOGISPHERE-DEMO-OPERATOR-99999"
    res = client.post("/execute-strategic-recommendation", 
        json={
            "recommendation_id": 1,
            "title": "Restricted Board Action",
            "action": "Express Air Freight",
            "budget": 50000.0,
            "expected_delay": 5,
            "expected_cost": 25000.0,
            "quantity": 100
        },
        headers={"Authorization": operator_token}
    )
    assert res.status_code == 403
    assert "Access denied" in res.json()["detail"]

def test_role_permission_allow_director_or_admin():
    """Verify that Admin and Director tokens are permitted to execute strategic recommendations."""
    admin_token = "Bearer LOGISPHERE-DEMO-ADMIN-99999"
    res = client.post("/execute-strategic-recommendation", 
        json={
            "recommendation_id": 2,
            "title": "Authorized Board Action",
            "action": "Priority Route",
            "budget": 200000.0,
            "expected_delay": 5,
            "expected_cost": 100000.0,
            "quantity": 100
        },
        headers={"Authorization": admin_token}
    )
    assert res.status_code == 200
    assert res.json()["status"] == "success"
