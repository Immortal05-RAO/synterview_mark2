import io
import uuid
from fastapi.testclient import TestClient
from src.app import app

client = TestClient(app)


def test_audio_upload_and_speech_metrics():
    # 1. Register candidate
    email = f"audio_tester_{uuid.uuid4().hex[:8]}@synterview.ai"
    reg_resp = client.post("/api/auth/register", json={
        "name": "Audio Candidate",
        "email": email,
        "password": "Password123!"
    })
    token = reg_resp.json()["accessToken"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Create Interview
    c_resp = client.post("/api/interviews", headers=headers, json={
        "role": "Software Engineer",
        "experience": "Fresher",
        "difficulty": "Easy",
        "interviewType": "Technical",
        "numberOfQuestions": 1
    })
    interview_id = c_resp.json()["interview"]["id"]

    # 3. Start Interview
    s_resp = client.post(f"/api/interviews/{interview_id}/start", headers=headers)
    q_id = s_resp.json()["question"]["id"]

    # 4. Submit Audio File as Multipart Form with text fallback
    fake_audio_bytes = b"ID3" + b"\x00" * 20000
    fake_file = ("response.mp3", io.BytesIO(fake_audio_bytes), "audio/mpeg")

    ans_resp = client.post(
        f"/api/interviews/{interview_id}/answer",
        headers=headers,
        data={"questionId": q_id, "answer": "Database indexing improves query performance by allowing efficient lookups."},
        files={"audio": fake_file}
    )
    assert ans_resp.status_code == 200
    a_data = ans_resp.json()
    assert a_data["success"] is True
    assert a_data["completed"] is True
    assert "speechMetrics" in a_data
    assert "totalWords" in a_data["speechMetrics"]


def test_audio_without_any_text_is_rejected_with_clear_error():
    email = f"nospeech_{uuid.uuid4().hex[:8]}@synterview.ai"
    token = client.post("/api/auth/register", json={
        "name": "No Speech", "email": email, "password": "Password123!"
    }).json()["accessToken"]
    headers = {"Authorization": f"Bearer {token}"}

    interview_id = client.post("/api/interviews", headers=headers, json={
        "role": "Software Engineer", "experience": "Fresher", "difficulty": "Easy",
        "interviewType": "Technical", "numberOfQuestions": 1
    }).json()["interview"]["id"]
    q_id = client.post(f"/api/interviews/{interview_id}/start", headers=headers).json()["question"]["id"]

    resp = client.post(
        f"/api/interviews/{interview_id}/answer",
        headers=headers,
        data={"questionId": q_id, "durationSeconds": "4"},
        files={"audio": ("response.webm", io.BytesIO(b"\x00" * 5000), "audio/webm")},
    )
    assert resp.status_code == 422
    assert resp.json()["error"]["code"] == "NO_SPEECH_DETECTED"


def test_browser_transcript_is_used_when_server_stt_is_unavailable():
    email = f"browserstt_{uuid.uuid4().hex[:8]}@synterview.ai"
    token = client.post("/api/auth/register", json={
        "name": "Browser STT", "email": email, "password": "Password123!"
    }).json()["accessToken"]
    headers = {"Authorization": f"Bearer {token}"}

    interview_id = client.post("/api/interviews", headers=headers, json={
        "role": "Software Engineer", "experience": "Fresher", "difficulty": "Easy",
        "interviewType": "Technical", "numberOfQuestions": 1
    }).json()["interview"]["id"]
    q_id = client.post(f"/api/interviews/{interview_id}/start", headers=headers).json()["question"]["id"]

    resp = client.post(
        f"/api/interviews/{interview_id}/answer",
        headers=headers,
        data={"questionId": q_id, "answer": "An index lets the database find rows without scanning the whole table.", "durationSeconds": "8"},
        files={"audio": ("response.webm", io.BytesIO(b"\x00" * 5000), "audio/webm")},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["completed"] is True
    assert body["speechMetrics"]["durationSeconds"] == 8.0
    assert body["speechMetrics"]["wordsPerMinute"] > 0
