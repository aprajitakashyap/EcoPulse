# EcoPulse

## Chosen Vertical
Sustainability / Climate Action Assistant. This solution fits by helping users track their individual carbon footprint across daily activities (transport, energy, diet) while using real-time air quality data (AQI) as an emotional hook and context for personalized AI recommendations.

## Approach and Logic
EcoPulse distinguishes between CO2e as a tracked, long-term metric and AQI as a short-term, immediate emotional hook. While CO2e tracking provides quantitative progress, the daily AI-generated recommendations use the Gemini API combined with real forecasted AQI data to give actionable, contextual advice (e.g., suggesting an alternate commute if AQI is expected to spike).

## How the Solution Works
Frontend (React/Vite) ↔ Cloud Run (Node.js/Express) ↔ Firestore / Gemini API / OpenWeather API
1. The frontend collects user logs.
2. The backend calculates CO2e, fetches AQI, and requests Gemini for personalized insights.
3. Data is stored securely in Firestore using user-scoped rules.

## Setup Instructions
1. Clone the repository.
2. Create a `.env` in the root (see `.env.example`).
3. Frontend: `cd frontend && npm install && npm run dev`
4. Backend: `cd backend && npm install && npm start`
5. Deployment: `firebase deploy` for hosting, and `gcloud run deploy --source .` in `backend` for Cloud Run.

## Testing
To run the backend test suite for CO2e calculations:
`cd backend && npm install && npm test`

## Assumptions Made
- Using generic DEFRA/EPA-style emission factors for simplicity, hardcoded in the backend.
- Using OpenWeather API for air quality.
- Some advanced features like push notifications are deferred to keep the repo size minimal.
