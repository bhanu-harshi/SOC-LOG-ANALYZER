# 🛡️ SOC Log Analyzer

The **SOC Log Analyzer** is a full-stack, AI-powered cybersecurity application designed to parse, detect, and analyze anomalies from system and network logs (such as Zscaler logs). 

It leverages a **FastAPI** backend to process uploads and communicate with **OpenAI GPT-4o** to identify potential threats. The results are displayed on a sleek, dark-mode **React + Vite** frontend dashboard, providing security analysts with a professional and intuitive interface for threat hunting.

---

## ✨ Features

- **🤖 AI Threat Analysis:** Uses the OpenAI API to analyze log entries for malicious patterns and anomalies.
- **📄 Log Parsing:** Specializes in processing complex cybersecurity logs (e.g., Zscaler CSVs).
- **💻 Premium Dashboard:** A modern, high-tier frontend UI designed with a cyber-aesthetic, featuring advanced data visualization using Recharts.
- **🗄️ Relational Database Storage:** Uses PostgreSQL to persist logs, users, and analysis results securely.

---

## 📁 File Structure

```text
SOC-LOG-ANALYZER/
│
├── backend/                       # Python FastAPI Backend
│   ├── app/                       # Main application models, routes, and logic
│   │   ├── api/                   # API router handlers
│   │   ├── core/                  # Database and configuration setup
│   │   ├── services/              # AI and Parsing logic
│   │   └── main.py                # FastAPI application entry point
│   ├── tests/                     # Tests for uploading, zscaler, and llm
│   ├── requirements.txt           # Python dependencies
│   ├── .env                       # Backend environment variables
│   └── venv/                      # Virtual environment (ignored in git)
│
├── frontend/                      # React Frontend (Vite)
│   ├── src/                       # React source files
│   │   ├── api/                   # Axios client for communicating with backend
│   │   ├── components/            # Reusable UI components
│   │   ├── pages/                 # Dashboard views
│   │   └── main.tsx               # Frontend entry point
│   ├── public/                    # Static public assets
│   ├── package.json               # Node.js dependencies and scripts
│   ├── vite.config.ts             # Vite configuration
│   └── .env.local                 # Frontend environment variables
│
├── README.md                      # Project documentation (this file)
└── .gitignore                     # Git ignored files and directories
```

---

## 🚀 Getting Started

Follow these step-by-step instructions to set up the project locally after cloning from GitHub.

### 📋 Prerequisites

Make sure you have the following installed on your machine:
- **Node.js** (v20+ recommended) - [Download](https://nodejs.org/)
- **Python** (v3.13+ recommended) - [Download](https://www.python.org/)
- **PostgreSQL** (running locally on port `5432`) - [Download](https://www.postgresql.org/)
- **Git** - [Download](https://git-scm.com/)

### 1️⃣ Clone the Repository

Clone the project to your local machine:

```bash
git clone https://github.com/bhanu-harshi/soc-log-analyzer.git
cd soc-log-analyzer
```

### 2️⃣ Backend Setup (FastAPI)

The backend handles API routes, database connections, log parsing, and AI integrations.

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Create and activate a virtual environment:**
   ```bash
   python -m venv venv
   
   # For Windows:
   venv\Scripts\activate
   
   # For macOS/Linux:
   source venv/bin/activate
   ```

3. **Install the Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Environment Variables:**
   Create a `.env` file inside the `backend` directory (`backend/.env`) with the following required variables:
   
   ```env
   # PostgreSQL connection string
   DATABASE_URL=postgresql://<YOUR_USER>:<YOUR_PASSWORD>@localhost:5432/soc_logs
   
   # Security Keys
   JWT_SECRET_KEY=supersecretkey
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=60
   
   # AI Integration
   OPENAI_API_KEY=your_openai_api_key_here
   OPENAI_MODEL=gpt-4o
   USE_LLM=true
   ```

   > **Note:** Make sure you create the `soc_logs` database inside your local PostgreSQL server before proceeding!

5. **Run the Backend Server:**
   ```bash
   uvicorn app.main:app --reload
   ```
   The backend API will now be running at `http://localhost:8000`. You can view the full interactive API documentation at `http://localhost:8000/docs`.

---

### 3️⃣ Frontend Setup (React / Vite)

The frontend provides an interactive dashboard where users can view alerts, analyze logs, and identify threats visually.

1. **Open a NEW terminal window** (leave the backend running) and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. **Install the Node dependencies:**
   ```bash
   npm install
   ```

3. **Environment Variables:**
   Create a `.env.local` file inside the `frontend` directory (`frontend/.env.local`) to configure the connection to the local backend:
   ```env
   VITE_API_URL=http://localhost:8000
   ```

4. **Start the Frontend Development Server:**
   ```bash
   npm run dev
   ```

The sleek dashboard will automatically open in your local browser (usually accessible at `http://localhost:5173` or `http://localhost:5174`).

---

## Working Preview

Please Refer to the following link : https://drive.google.com/file/d/1g9btT1GehyhnZb-hqdcNz-I7llPsOt7F/view?usp=sharing for the Working preview.

## 🛠️ Tech Stack

- **Frontend:** React 19, TypeScript, Vite, TailwindCSS 4, Recharts
- **Backend:** Python 3.13, FastAPI, SQLAlchemy, Uvicorn
- **Database:** PostgreSQL
- **AI Integration:** OpenAI API (GPT-4o)
