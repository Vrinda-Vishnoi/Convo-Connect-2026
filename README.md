# ConvoConnect

ConvoConnect is an automated recruitment screening platform designed to streamline the technical hiring process. By integrating intelligent resume parsing with dynamic, conversational interviews, it empowers recruiters to efficiently filter candidates based on real technical competency, communication skills, and role fit—before scheduling human interviews.

## 🚀 Key Features

- **Automated Resume Analysis:** Instantly parses candidate resumes and evaluates them against specific job descriptions, highlighting key matching skills and missing requirements.
- **Dynamic Interview Engine:** Conducts adaptive, conversational technical interviews based on the candidate's unique background and the target role.
- **Comprehensive Evaluation Rubric:** Automatically generates actionable insights and weighted scores across three dimensions:
  - Technical Proficiency
  - Communication Clarity
  - Holistic Role Fit
- **Interactive Dashboards:** Provides tailored, real-time dashboards for both candidates (for taking the interview) and recruiters (for reviewing evaluation reports and match percentages).

## 💻 Tech Stack

**Frontend (Client)**
- React 19 & TypeScript
- Vite for lightning-fast builds
- Tailwind CSS for responsive, modern UI
- Zustand for lightweight state management

**Backend (API)**
- Python & FastAPI for high-performance, asynchronous endpoints
- SQLAlchemy for robust ORM
- PostgreSQL (Neon Serverless) for reliable data persistence

**Infrastructure & Deployment**
- Vercel for Edge Network frontend hosting
- Render for managed backend web services
- Neon DB for serverless PostgreSQL

## 🛠️ Local Development Setup

To run this project locally, you will need Node.js and Python installed.

### 1. Database Setup
Ensure you have a PostgreSQL instance running locally or a cloud database connection string.

### 2. Backend Setup
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Or `.venv\Scripts\activate` on Windows
pip install -r requirements.txt
```

Create a `.env` file in the `backend` directory:
```env
DATABASE_URL=postgresql://user:password@localhost/convoconnect
GEMINI_API_KEY=your_api_key_here
FRONTEND_ORIGIN=http://localhost:5173
```

Start the FastAPI server:
```bash
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend Setup
```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend` directory:
```env
VITE_API_URL=http://localhost:8000/api
```

Start the development server:
```bash
npm run dev
```

## 📈 Architecture & Design Philosophy

ConvoConnect was built with a focus on **extensibility and user experience**. 
- The backend relies on a strictly typed, modular design using Pydantic schemas and FastAPI routers, making it highly testable and easy to scale.
- The frontend architecture leverages React's latest features alongside a robust design system to ensure that both recruiters and candidates have a seamless, premium experience.

---
*Built with precision by Vrinda.*
