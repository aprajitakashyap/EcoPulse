#!/bin/bash
set -e

PROJECT_ID="ecopulse-cefdf"
REGION="us-central1"
SERVICE_NAME="ecopulse-backend"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " EcoPulse — Full Deployment Script"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 1. Set project
echo "→ Setting gcloud project..."
gcloud config set project $PROJECT_ID

# 2. Enable required APIs
echo "→ Enabling Cloud Run & Build APIs..."
gcloud services enable run.googleapis.com cloudbuild.googleapis.com --quiet

# 3. Deploy backend to Cloud Run (source-based, no Docker Hub needed)
echo "→ Deploying backend to Cloud Run..."
cd backend
gcloud run deploy $SERVICE_NAME \
  --source . \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --set-env-vars "GEMINI_API_KEY=${GEMINI_API_KEY},OPENWEATHER_API_KEY=${OPENWEATHER_API_KEY}" \
  --memory 512Mi \
  --min-instances 0 \
  --max-instances 3 \
  --quiet

# 4. Get the deployed URL
BACKEND_URL=$(gcloud run services describe $SERVICE_NAME \
  --region $REGION \
  --format 'value(status.url)')

echo "✅ Backend deployed at: $BACKEND_URL"

# 5. Write frontend env
cd ../frontend
echo "VITE_BACKEND_URL=$BACKEND_URL" > .env.production

# 6. Build frontend with Cloud Run URL
echo "→ Building frontend..."
npm run build

# 7. Deploy frontend to Firebase Hosting
cd ..
echo "→ Deploying frontend to Firebase Hosting..."
firebase login --no-localhost 2>/dev/null || true
firebase use $PROJECT_ID
firebase deploy --only hosting --message "Deploy $(date '+%Y-%m-%d %H:%M')"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ DEPLOYMENT COMPLETE"
echo "   Frontend: https://$PROJECT_ID.web.app"
echo "   Backend:  $BACKEND_URL"
echo "   Health:   $BACKEND_URL/health"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
