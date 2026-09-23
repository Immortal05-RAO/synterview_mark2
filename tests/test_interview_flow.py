import os
import uuid
import pytest
from fastapi.testclient import TestClient
from src.app import app

client = TestClient(app)


@pytest.fixture
def auth_headers():
    unique_email = f"candidate_{uuid.uuid4().hex[:8]}@synterview.ai"
    password = "InterviewPassword123!"
    reg_resp = client.post("/api/auth/register", json={
        "name": "Interview Tester",
        "email": unique_email,
        "password": password
    })
    token = reg_resp.json()["accessToken"]
    return {"Authorization": f"Bearer {token}"}


def test_complete_interview_lifecycle(auth_headers):
    # 1. Create Interview
    create_resp = client.post("/api/interviews", headers=auth_headers, json={
        "role": "Software Engineer",
        "experience": "Fresher",
        "difficulty": "Medium",
        "interviewType": "Technical",
        "numberOfQuestions": 2
    })
    assert create_resp.status_code == 201
    c_data = create_resp.json()
    assert c_data["success"] is True
    interview_id = c_data["interview"]["id"]
    assert c_data["interview"]["status"] == "CREATED"

    # 2. Start Interview
    start_resp = client.post(f"/api/interviews/{interview_id}/start", headers=auth_headers)
    assert start_resp.status_code == 200
    s_data = start_resp.json()
    assert s_data["success"] is True
    assert s_data["questionNumber"] == 1
    assert s_data["totalQuestions"] == 2
    q1_id = s_data["question"]["id"]
    assert "text" in s_data["question"]

    # 3. Get Current Question
    curr_resp = client.get(f"/api/interviews/{interview_id}/current", headers=auth_headers)
    assert curr_resp.status_code == 200
    curr_data = curr_resp.json()
    assert curr_data["questionNumber"] == 1
    assert curr_data["question"]["id"] == q1_id

    # 4. Submit Answer to Q1 (Text)
    ans1_resp = client.post(f"/api/interviews/{interview_id}/answer", headers=auth_headers, json={
        "questionId": q1_id,
        "answer": "A process is an executing program instance with its own memory space, whereas a thread is a lightweight execution path within a process."
    })
    assert ans1_resp.status_code == 200
    ans1_data = ans1_resp.json()
    assert ans1_data["success"] is True
    assert ans1_data["completed"] is False
    assert "evaluation" in ans1_data
    assert ans1_data["evaluation"]["overallScore"] > 0
    assert ans1_data["nextQuestion"] is not None
    q2_id = ans1_data["nextQuestion"]["id"]

    # 5. Submit Answer to Q2 (Multipart Audio/Text)
    ans2_resp = client.post(
        f"/api/interviews/{interview_id}/answer",
        headers=auth_headers,
        data={"questionId": q2_id, "answer": "Normalization eliminates data redundancy and anomalies across relational database tables."}
    )
    assert ans2_resp.status_code == 200
    ans2_data = ans2_resp.json()
    assert ans2_data["success"] is True
    assert ans2_data["completed"] is True
    assert ans2_data["message"] == "Interview completed"

    # 6. Fetch Final Report
    rep_resp = client.get(f"/api/interviews/{interview_id}/report", headers=auth_headers)
    assert rep_resp.status_code == 200
    rep_data = rep_resp.json()
    assert rep_data["success"] is True
    report = rep_data["report"]
    assert report["overallScore"] > 0
    assert len(report["questionResults"]) == 2
    assert len(report["strengths"]) > 0
    assert len(report["recommendations"]) > 0

    # 7. List Interviews
    list_resp = client.get("/api/interviews", headers=auth_headers)
    assert list_resp.status_code == 200
    l_data = list_resp.json()
    assert l_data["success"] is True
    assert len(l_data["interviews"]) >= 1

    # 8. Delete Interview
    del_resp = client.delete(f"/api/interviews/{interview_id}", headers=auth_headers)
    assert del_resp.status_code == 200
    assert del_resp.json()["success"] is True
