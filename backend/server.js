require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { calculateCO2e } = require('./co2_calculator');
const { GoogleGenAI } = require('@google/genai');

const app = express();
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'https://ecopulse-cefdf.web.app',
    'https://ecopulse-cefdf.firebaseapp.com',
  ],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

const PORT = process.env.PORT || 8080;
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const AQI_LABELS = { 1:'Good', 2:'Fair', 3:'Moderate', 4:'Poor', 5:'Very Poor' };

// ── Healthcheck ──
app.get('/health', (req, res) => res.send('OK'));

// ── CO2e calculation (pure CPU, instant) ──
app.post('/api/calculate', (req, res) => {
  try {
    const co2e = calculateCO2e(req.body);
    res.json({ co2e });
  } catch {
    res.status(500).json({ error: 'Calculation failed' });
  }
});

// ── Recommendation: AQI + Gemini IN PARALLEL ──
app.get('/api/recommendation', async (req, res) => {
  const { lat, lon, recentCo2e, commuteMode } = req.query;
  if (!lat || !lon) return res.status(400).json({ error: 'Missing lat/lon' });

  // Fire AQI and build Gemini prompt simultaneously
  const aqiPromise = axios.get(
    `http://api.openweathermap.org/data/2.5/air_pollution/forecast?lat=${lat}&lon=${lon}&appid=${process.env.OPENWEATHER_API_KEY}`,
    { timeout: 4000 }
  ).then(r => {
    const list = r.data.list || [];
    const aqi = list.length > 0 ? list[0].main.aqi : 2;
    return { aqi, aqiText: AQI_LABELS[aqi] || 'Fair' };
  }).catch(() => ({ aqi: 2, aqiText: 'Fair' })); // graceful fallback

  // We need AQI value to build the prompt, so await AQI first (it's fast ~200ms)
  // then fire Gemini immediately after
  const { aqi, aqiText } = await aqiPromise;

  const prompt = `You are EcoPulse AI. Give ONE short actionable eco tip (max 20 words).
AQI: ${aqi} (${aqiText}). Daily CO2e: ${recentCo2e || 0}kg. Commute: ${commuteMode || 'unknown'}.
If AQI ≥4 focus on health. If AQI ≤2 encourage outdoor low-carbon transport. Be specific.`;

  try {
    const geminiRes = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      // Limit output tokens for speed
      generationConfig: { maxOutputTokens: 60, temperature: 0.7 },
    });
    res.json({ recommendation: geminiRes.text?.trim() || 'Try one car-free trip today.', aqi, aqiText });
  } catch (err) {
    res.json({ recommendation: 'Try replacing one car trip with public transit today.', aqi, aqiText });
  }
});

// ── Chatbot (Gemini, short output) ──
app.post('/api/chat', async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Message required' });

  const prompt = `You are EcoPulse Assistant. EcoPulse tracks carbon footprint (transport/diet/energy), shows live AQI, gives Gemini AI tips, has streak/plant growth system, uses Firebase Auth + Firestore, is 100% free.
Answer in max 40 words, be warm and use 1-2 emojis. If unrelated to EcoPulse/environment, redirect politely.
User: ${message}`;

  try {
    const r = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      generationConfig: { maxOutputTokens: 80, temperature: 0.7 },
    });
    res.json({ reply: r.text?.trim() || "I'm not sure — try asking about carbon tracking or AQI! 🌿" });
  } catch {
    res.status(500).json({ reply: "Sorry, having trouble right now. Try again in a moment 🌿" });
  }
});

app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
