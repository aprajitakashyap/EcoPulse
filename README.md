# 🌍 EcoPulse — Smart Carbon & Air Quality Assistant

> Hack2Skill Hackathon Submission · Vertical: **Sustainability / Climate Action**

---

## 1. Chosen Vertical

**Sustainability / Climate Action Assistant**

EcoPulse helps individuals track their personal carbon footprint across daily activities (transport, diet, energy) while using real-time air quality data (AQI) as an immediate, emotional context layer for personalized AI recommendations powered by Google Gemini 2.5 Flash.

---

## 2. Approach & Logic

EcoPulse is built around two complementary signals:

| Signal | Purpose | Source |
|--------|---------|--------|
| **CO₂e** (carbon dioxide equivalent) | Long-term quantitative tracking | DEFRA/EPA emission factors |
| **AQI** (Air Quality Index) | Real-time emotional hook + health context | OpenWeather API |

**Decision logic:**
- AQI ≥ 4 (Poor/Very Poor) → Gemini recommends health-focused actions (avoid outdoor commute, wear a mask)
- AQI ≤ 2 (Good/Fair) → Gemini encourages low-carbon outdoor transport (walk, bike)
- CO₂e is calculated client-side using validated emission factors, then stored in Firestore
- Recommendations are cached for 10 minutes (sessionStorage) to avoid unnecessary Gemini API calls

**Stats logic (all verified):**
- Weekly total: sum of entries within the **last 7 calendar days only**
- Daily average: `weekTotal ÷ actual days logged` (not a fixed 7)
- Projected annual: `dailyAvg × 365`

---

## 3. How the Solution Works

```
Browser (React + Vite)
  ├── Firebase Auth  ──── Google OAuth / Email+Password
  ├── Firestore      ──── User profiles + activity entries (row-level security)
  └── fetch()        ──── Backend API calls

Backend (Express on Node.js — Cloud Run)
  ├── /api/calculate     ──── Stateless CO₂e calculation
  ├── /api/recommendation ─── OpenWeather AQI + Gemini 2.5 Flash tip (parallel)
  ├── /api/chat          ──── Gemini-powered AI chatbot
  └── /health            ──── Healthcheck endpoint
```

**Key features:**
- 🔐 Firebase Auth (Google + email/password)
- 📊 CO₂e tracking: transport, diet, energy
- 🌬️ Live AQI via OpenWeather
- 🤖 Gemini 2.5 Flash AI recommendation + chatbot
- 📈 Visual trends with pastel bar chart
- 🗑️ Delete entries with 5-second Undo
- 🔥 Daily streak + virtual plant growth system (🌱→🌍)
- ⚡ Performance: lazy route loading, localStorage-first data, parallel API calls

---

## 4. Setup Instructions

### Prerequisites
- Node.js ≥ 18
- A Firebase project with Auth (Google + Email) and Firestore enabled
- OpenWeather API key (free tier)
- Google Gemini API key

### Local Development

```bash
# 1. Clone
git clone https://github.com/aprajitakashyap/EcoPulse.git
cd EcoPulse

# 2. Backend
cd backend
cp ../.env.example .env
# Fill in GEMINI_API_KEY and OPENWEATHER_API_KEY in .env
npm install
npm start          # runs on http://localhost:8080

# 3. Frontend (new terminal)
cd frontend
npm install
npm run dev        # runs on http://localhost:5173
```

### Environment Variables

Create `backend/.env`:
```
GEMINI_API_KEY=your_gemini_key
OPENWEATHER_API_KEY=your_openweather_key
```

Frontend uses the Firebase config already in `src/firebase.js` (public keys, safe to commit).

### Production Deployment

```bash
# Deploy frontend to Firebase Hosting
npm run build -C frontend
firebase deploy --only hosting

# Deploy backend to Google Cloud Run
cd backend
gcloud run deploy ecopulse-backend --source . --platform managed --allow-unauthenticated
```

---

## 5. Testing

```bash
cd backend
npm test
```

5 test cases covering all CO₂e calculation paths:
- Transport emissions (car, bus, train, bike, walk)
- Diet emissions (vegan, vegetarian, omnivore, meat-heavy)
- Energy emissions (kWh → kg CO₂e)
- Combined multi-source calculation
- Graceful handling of missing / invalid inputs

---

## 6. Assumptions Made

- Emission factors are hardcoded constants based on DEFRA/EPA guidelines (2023). Real-world values vary by country and grid mix.
- AQI fallback value is 2 (Fair) when OpenWeather is unavailable — never blocks the UI.
- Location for AQI uses GPS or a curated list of ~15 major cities. Unlisted cities default to Delhi coordinates.
- Diet CO₂e covers food production only (not packaging/transport of food).
- Energy CO₂e uses a global average grid intensity of 0.4 kg/kWh; actual value varies by region.
- Streak resets if a day is missed (no grace period).
- The app stores up to 50 entries in localStorage and up to 7 in Firestore (per query limit).

---

## 7. Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 8, Tailwind CSS 4 |
| Backend | Node.js, Express 5 |
| AI | Google Gemini 2.5 Flash (`@google/genai`) |
| Auth | Firebase Authentication |
| Database | Cloud Firestore |
| Hosting | Firebase Hosting |
| Backend Deploy | Google Cloud Run |
| Weather/AQI | OpenWeather Air Pollution API |
| Testing | Jest |

---

## 8. Project Structure

```
EcoPulse/
├── backend/
│   ├── server.js              # Express API (calculate, recommendation, chat)
│   ├── co2_calculator.js      # Pure CO₂e calculation logic
│   └── co2_calculator.test.js # Jest test suite
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── Landing.jsx    # Public landing page
│       │   ├── Auth.jsx       # Login / register
│       │   ├── Onboarding.jsx # First-time profile setup
│       │   ├── Dashboard.jsx  # Main user dashboard
│       │   ├── LogEntry.jsx   # Activity logging form
│       │   ├── TrendView.jsx  # Chart + entry management
│       │   └── ChatBot.jsx    # Floating AI assistant
│       ├── db.js              # Firestore + localStorage data layer
│       ├── firebase.js        # Firebase initialisation
│       └── co2_calculator.js  # Client-side CO₂e (mirrors backend)
├── firestore.rules            # Row-level security rules
├── firebase.json              # Hosting + Firestore config
└── .env.example               # Environment variable template
```
