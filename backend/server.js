require('dotenv').config();
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const axios = require('axios');
const { calculateCO2e } = require('./co2_calculator');

// Import Gemini SDK (Google Generative AI)
const { GoogleGenerativeAI } = require('@google/genai');

// Initialize Firebase Admin (assuming default credentials or env config)
// In production on Cloud Run, admin.initializeApp() uses the default service account.
admin.initializeApp();
const db = admin.firestore();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8080;

// Initialize Gemini
const ai = new GoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });

// Auth Middleware to verify Firebase ID token
const verifyAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).send('Unauthorized');
  }
  const idToken = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    res.status(401).send('Unauthorized');
  }
};

// Route: Add a daily entry
app.post('/api/entries', verifyAuth, async (req, res) => {
  try {
    const { transport, diet, energy, date } = req.body;
    const uid = req.user.uid;
    
    // Calculate CO2e
    const co2e = calculateCO2e({ transport, diet, energy });

    // Prepare document
    const entryData = {
      transport: transport || null,
      diet: diet || null,
      energy: energy || null,
      co2e,
      date: date || new Date().toISOString(),
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    };

    // Write to Firestore (users/{uid}/entries/{entryId})
    const docRef = await db.collection('users').doc(uid).collection('entries').add(entryData);

    res.status(200).json({ id: docRef.id, co2e, message: 'Entry logged successfully' });
  } catch (error) {
    console.error('Error logging entry:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Route: Get personalized recommendation
app.get('/api/recommendation', verifyAuth, async (req, res) => {
  try {
    const { lat, lon, recentCo2e, commuteMode } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({ error: 'Missing lat/lon for AQI' });
    }

    // 1. Fetch AQI from OpenWeather
    const aqiRes = await axios.get(`http://api.openweathermap.org/data/2.5/air_pollution/forecast?lat=${lat}&lon=${lon}&appid=${process.env.OPENWEATHER_API_KEY}`);
    const forecastList = aqiRes.data.list || [];
    // Just get the current/next few hours AQI (1 = Good, 5 = Very Poor)
    const currentAqi = forecastList.length > 0 ? forecastList[0].main.aqi : 1;
    
    const aqiDescriptions = {
      1: "Good", 2: "Fair", 3: "Moderate", 4: "Poor", 5: "Very Poor"
    };
    const aqiText = aqiDescriptions[currentAqi] || "Unknown";

    // 2. Build Prompt for Gemini
    const prompt = `You are EcoPulse, an AI climate action assistant. 
User Context: 
- Current AQI is ${currentAqi} (${aqiText}).
- Recent daily CO2e footprint: ${recentCo2e || 0} kg.
- Typical commute mode: ${commuteMode || 'unknown'}.

Task: Provide ONE short, personalized, and actionable recommendation for today (max 25 words). 
If AQI is poor (4 or 5), focus on health and adjusting commute. 
If AQI is good (1 or 2), encourage low-carbon outdoor transport (like walking or biking).
Do not use generic text, explicitly mention the AQI or their commute.`;

    // 3. Call Gemini API
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    const recommendation = response.text || "Try replacing one car trip with public transit today.";

    res.status(200).json({ recommendation, aqi: currentAqi, aqiText });
  } catch (error) {
    console.error('Error generating recommendation:', error);
    res.status(500).json({ error: 'Failed to generate recommendation', details: error.message });
  }
});

// Healthcheck
app.get('/health', (req, res) => res.send('OK'));

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
