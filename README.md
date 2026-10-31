# Synterview AI Backend — Cloud-Ready REST API

Synterview is an AI-powered mock interview platform that conducts automated technical and behavioral interviews, transcribes candidate audio answers via Cloud Speech-to-Text, calculates speech metrics (words per minute, filler word rates, pauses), evaluates answers using AI LLM models, and generates final performance report summaries.

This repository contains the **100% Cloud-Ready REST API Backend** built with **FastAPI**, **SQLAlchemy**, **Pydantic**, and **JWT Authentication**.

> **Cloud Architecture Note:** The backend has zero dependencies on local GPUs, PyTorch model downloads, CUDA, or local Whisper installations. It runs on standard CPU containers (e.g. Render, Docker) and connects to cloud APIs for Speech-to-Text and AI evaluation.

---

## 🏗️ Architecture

```text
College Computer / Client Browser / Frontend
                    ↓
            HTTPS REST API
                    ↓
         Synterview FastAPI Backend
                    ↓
 ┌──────────────────┼──────────────────┐
 ↓                  ↓                  ↓
SQLAlchemy DB   Cloud STT API     AI Provider API
(SQLite / PG) (OpenAI Speech)  (OpenAI / Gemini)
 ↓                  ↓                  ↓
 └──────────────────┴──────────────────┘
                    ↓
            Evaluation Engine
                    ↓
           Final Performance Report
```

---

## ⚡ Quick Start (Local Development)

### 1. Prerequisites
- Python 3.10+ installed
- Virtual environment created

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/Immortal05-RAO/synterview_mark2.git
cd synterview_mark2

# Activate virtual environment (Windows)
.\.venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Environment Configuration
Copy `.env.example` to `.env`:
```env
ENVIRONMENT=development
PORT=5000
DATABASE_URL=sqlite:///./synterview.db

JWT_SECRET=change-me
JWT_REFRESH_SECRET=change-me-too

# AI Provider: openai, gemini, or fallback
AI_PROVIDER=openai
AI_MODEL=gpt-4o-mini
AI_API_KEY=your_openai_api_key_here

# Speech Provider: openai, local or fallback (SPEECH_API_KEY defaults to AI_API_KEY when AI_PROVIDER=openai)
SPEECH_PROVIDER=openai
SPEECH_API_KEY=your_openai_api_key_here

CORS_ORIGIN=*
DEMO_MODE=false
```

### 4. Run Server
```bash
python main.py
```
The server will start at `http://localhost:5000`.
- **Interactive Swagger Docs:** `http://localhost:5000/docs`
- **ReDoc Docs:** `http://localhost:5000/redoc`
- **Health Check:** `http://localhost:5000/api/health`

### 5. Run Test Suite
```bash
pytest -v tests/
```

---

## ☁️ Cloud Deployment Guide (Render / Docker)

### Option 1: Deploy with Docker
```bash
# Build Docker image
docker build -t synterview-backend .

# Run Docker container
docker run -p 5000:5000 -e PORT=5000 --env-file .env synterview-backend
```

### Option 2: Deploy to Render
1. Create a **Web Service** on Render from your GitHub repository (Runtime: Docker, or Python with the start command below).
2. Set Environment Variables in the platform dashboard:
   - `ENVIRONMENT=production`
   - `PORT` is injected by Render automatically; do not hard-code it
   - `DATABASE_URL` = PostgreSQL connection URL (e.g., `postgresql://user:pass@host:5432/dbname`)
   - `JWT_SECRET` = your secret
   - `JWT_REFRESH_SECRET` = your secret
   - `AI_PROVIDER` = `openai` or `gemini` or `fallback`
   - `AI_API_KEY` = your API key
   - `CORS_ORIGIN` = your frontend URL (e.g. `https://your-app.vercel.app`)
3. Render notes:
   - The free web service's disk is ephemeral and the service sleeps when idle, so use a Render PostgreSQL database for `DATABASE_URL` (SQLite data is lost on every deploy/restart). Free Render Postgres databases expire after a limited period; check Render's current free-tier terms.
   - Set `VITE_API_URL` on the frontend (Vercel) to your Render URL.
4. Start Command:
   ```bash
   python main.py
   ```

---

## 📑 API Endpoint Documentation

### 1. Health Check
- `GET /api/health`
  Returns service operational status and database connection health.

### 2. Authentication
- `POST /api/auth/register` — Register new candidate user
- `POST /api/auth/login` — Authenticate and receive `accessToken` & `refreshToken`
- `POST /api/auth/refresh` — Refresh access token
- `POST /api/auth/logout` — Invalidate user session
- `GET /api/auth/me` — Retrieve active authenticated candidate profile

### 3. Interview Lifecycle
- `POST /api/interviews` — Create a new interview session
  ```json
  {
    "role": "Software Engineer",
    "experience": "Fresher",
    "difficulty": "Medium",
    "interviewType": "Technical",
    "numberOfQuestions": 5
  }
  ```
- `POST /api/interviews/{id}/start` — Generate/initialize questions and start interview
- `GET /api/interviews/{id}/current` — Get active question (hides future questions)
- `POST /api/interviews/{id}/answer` — Submit answer (Text JSON or Multipart Audio File)
- `GET /api/interviews/{id}/report` — Retrieve aggregated performance report
- `GET /api/interviews` — List candidate's past interview sessions
- `GET /api/interviews/{id}` — Get interview configuration details
- `DELETE /api/interviews/{id}` — Delete an interview session

---

## 🔄 End-to-End Demo Sequence

```text
Register Candidate -> Login -> Create Interview -> Start Interview -> Receive Question 1 ->
Submit Answer (Text or Audio) -> Receive Answer Evaluation & Speech Metrics -> Receive Question 2 ->
Submit Answer 2 -> ... -> Final Question -> Complete Interview -> Fetch Final Report
```

If external AI API keys are omitted or external services fail, Synterview automatically degrades to its **Deterministic Fallback Question Bank & Rule-Based Evaluation Engine**, ensuring 100% demo availability.

---

## 🛡️ Security & Privacy
- Passwords hashed using `bcrypt` (72-byte salt truncated utf-8); refresh tokens are stored SHA-256 hashed.
- In `ENVIRONMENT=production` the server refuses to start with the default demo JWT secrets.
- Without a real STT engine, audio yields an empty transcript (a canned one is only used when `DEMO_MODE=true`).
- Access tokens valid for 15 minutes; Refresh tokens valid for 7 days.
- Temporary audio uploads (limited by `MAX_UPLOAD_MB`) processed and unlinked from filesystem immediately after transcription.
