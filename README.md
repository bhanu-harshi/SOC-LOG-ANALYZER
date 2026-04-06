# SOC Log Analyzer - Full Stack Cybersecurity Application

A premium, full-stack log analysis and threat detection tool designed for SOC (Security Operations Center) analysts. This app parses raw server and proxy logs (e.g., Zscaler, NGINX), detects anomalies based on heuristics and AI, and visualizes them intelligently in a chronological timeline.

## Features
- **Frontend**: React (Vite, TypeScript) with a stunning cyberpunk/glassmorphism UI layout, custom CSS timeline, anomaly glow-effects, and intuitive stat mapping.
- **Backend**: FastAPI (Python), fully integrating LLM (OpenAI) insights and anomaly generation logic.
- **Database**: PostgreSQL Native integration.

## Installation & Setup Requirements
Make sure you have installed on your system:
- [Node.js (v18+)](https://nodejs.org/)
- [Python 3.10+](https://www.python.org/)
- [PostgreSQL](https://www.postgresql.org/)

### 1. Database Setup
Ensure PostgreSQL is running locally on port `5432` with a database named `soc_logs`.

### 2. Backend Initialization
The backend utilizes Python virtual environments.

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# Mac/Linux
source venv/bin/activate

pip install -r requirements.txt
```

Verify your `backend/.env` file exists and has the correct keys configured, for example:
```env
DATABASE_URL=postgresql://postgres:123@localhost:5432/soc_logs
JWT_SECRET_KEY=supersecretkey
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
OPENAI_API_KEY=sk-...
USE_LLM=true
```

Run database migrations natively and boot the server:
```bash
python seed_user.py # (Optional) To seed an `admin`/`admin123` user account.
uvicorn app.main:app --reload
```
The FastAPI instance will be available at http://localhost:8000.

### 3. Frontend Initialization
In a new terminal window:

```bash
cd frontend
npm install
npm run dev
```

The React frontend UI will be running on the default local port printed (usually `http://localhost:5173`).

---
### System Usage
- Head to the Frontend UI URL.
- Log in with the operator credentials (e.g. `admin` / `admin123`).
- Select a `.log` or `.txt` log file (You can mock this up using ZScaler formats).
- Observe the timeline view automatically parsing logs, flagging unexpected anomalies, and emitting an LLM-based intelligent Threat Analysis Summary.
