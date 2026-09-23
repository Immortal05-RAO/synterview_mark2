import uuid
from fastapi.testclient import TestClient
from src.app import app

client = TestClient(app)


def test_auth_full_flow():
    unique_email = f"test_{uuid.uuid4().hex[:8]}@synterview.ai"
    password = "SecurePassword123!"

    # 1. Register
    reg_resp = client.post("/api/auth/register", json={
        "name": "Demo Candidate",
        "email": unique_email,
        "password": password
    })
    assert reg_resp.status_code == 201
    reg_data = reg_resp.json()
    assert reg_data["success"] is True
    assert "accessToken" in reg_data
    assert "refreshToken" in reg_data

    access_token = reg_data["accessToken"]
    refresh_token = reg_data["refreshToken"]

    # 2. Get Me Profile
    me_resp = client.get("/api/auth/me", headers={"Authorization": f"Bearer {access_token}"})
    assert me_resp.status_code == 200
    me_data = me_resp.json()
    assert me_data["success"] is True
    assert me_data["user"]["email"] == unique_email
    assert me_data["user"]["name"] == "Demo Candidate"

    # 3. Login
    login_resp = client.post("/api/auth/login", json={
        "email": unique_email,
        "password": password
    })
    assert login_resp.status_code == 200
    login_data = login_resp.json()
    assert login_data["success"] is True
    assert "accessToken" in login_data

    active_refresh_token = login_data["refreshToken"]

    # 4. Refresh Token
    ref_resp = client.post("/api/auth/refresh", json={"refreshToken": active_refresh_token})
    assert ref_resp.status_code == 200
    ref_data = ref_resp.json()
    assert ref_data["success"] is True
    assert "accessToken" in ref_data

    # 5. Duplicate Register -> 409 Conflict
    dup_resp = client.post("/api/auth/register", json={
        "name": "Duplicate Candidate",
        "email": unique_email,
        "password": password
    })
    assert dup_resp.status_code == 409
    assert dup_resp.json()["error"]["code"] == "USER_ALREADY_EXISTS"
