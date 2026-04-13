# OnboardAI — Smart Employee Onboarding Tracker

A full-stack app that tracks new hire onboarding progress using a Flask REST API, SQLite, and a React + Tailwind CSS frontend. An ML model (RandomForest) predicts each employee's onboarding status: **On Track**, **At Risk**, or **Delayed**.

---

## What it does

- Dashboard with employee cards showing progress bars and ML-predicted status badges
- Employee detail page with task list grouped by status, live status dropdowns, and a category breakdown chart
- Admin panel to add employees, assign tasks, and delete records
- Rule-based fallback if the ML model hasn't been trained yet

---

## Project structure

```
/backend        Flask API, SQLAlchemy models, ML model
/frontend       React + Vite + Tailwind CSS
README.md
```

---

## Local setup

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
python ml_model.py              # trains and saves model.pkl
python db_init.py               # seeds the database
python app.py                   # starts on http://localhost:5000
```

### Frontend

```bash
cd frontend
npm install
npm run dev                     # starts on http://localhost:3000
```

---

## Deployment

### Backend → Render.com (free tier)

1. Push the repo to GitHub
2. Go to [render.com](https://render.com) → New → Web Service
3. Connect your GitHub repo and set the **Root Directory** to `backend`
4. Set:
   - **Build command:** `pip install -r requirements.txt`
   - **Start command:** `gunicorn app:app`
   - **Runtime:** Python 3.11
5. Add environment variables:
   - `FRONTEND_URL` → your Netlify URL (e.g. `https://your-app.netlify.app`)
6. Add a **Disk** (free tier: 1 GB) mounted at `/opt/render/project/src/instance` for SQLite persistence
7. Click **Deploy** — your API will be live at `https://your-backend-url.onrender.com`

> Note: free tier instances spin down after inactivity. First request after sleep may take ~30s.

### Frontend → Netlify

1. Go to [netlify.com](https://netlify.com) → Add new site → Import from Git
2. Set **Base directory** to `frontend`
3. Build command and publish directory are auto-detected from `netlify.toml`
4. Add environment variable:
   - `VITE_API_URL` → your Render backend URL
5. Click **Deploy**

---

## Live URLs

| Service  | URL |
|----------|-----|
| Frontend | `https://________________________.netlify.app` |
| Backend  | `https://________________________.onrender.com` |
