/**
 * @file server.js
 * @description EcoPulse Express API server.
 * Provides CO2e calculation, AQI-based AI recommendations,
 * and an AI chatbot powered by Google Gemini 2.5 Flash.
 *
 * Routes:
 *   GET  /health                - Liveness probe
 *   POST /api/calculate         - Stateless CO2e calculation
 *   GET  /api/recommendation    - AQI + Gemini personalised eco tip
 *   POST /api/chat              - EcoPulse AI assistant
 */

'use strict';

require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const axios   = require('axios');
const { calculateCO2e } = require('./co2_calculator');
const { GoogleGenAI }   = require('@google/genai');

const app  = express();
const PORT = process.env.PORT || 8080;

/** @type {Object.<number, string>} AQI level labels per OpenWeather scale (1–5) */
const AQI_LABELS = { 1:'Good', 2:'Fair', 3:'Moderate', 4:'Poor', 5:'Very Poor' };

// ── Middleware ─────────────────────────────────────────────────────────────
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

// Initialise Gemini client (lazy — only used on recommendation/chat routes)
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// ── Routes ─────────────────────────────────────────────────────────────────

/**
 * @route GET /health
 * @description Liveness probe used by Cloud Run and load balancers.
 * @returns {string} Plain text "OK"
 */
app.get('/health', (_req, res) => res.send('OK'));

/**
 * @route POST /api/calculate
 * @description Stateless CO2e calculation. No external API calls.
 * @param {Object} req.body - Activity data
 * @param {Object} [req.body.transport] - { mode: string, distanceKm: number }
 * @param {Object} [req.body.diet]      - { type: string, days: number }
 * @param {Object} [req.body.energy]    - { kwh: number }
 * @returns {Object} { co2e: number }
 */
app.post('/api/calculate', (req, res) => {
  try {
    const co2e = calculateCO2e(req.body);
    res.json({ co2e });
  } catch (err) {
    console.error('Calculate error:', err.message);
    res.status(500).json({ error: 'Calculation failed' });
  }
});

/**
 * @route GET /api/recommendation
 * @description Fetches real-time AQI for the user's location, then calls
 * Gemini 2.5 Flash to generate a personalised single-sentence eco tip.
 * AQI fetch and Gemini prompt are constructed in parallel where possible.
 * AQI failures fall back to level 2 (Fair) so the UI is never blocked.
 *
 * @param {string} req.query.lat        - Latitude
 * @param {string} req.query.lon        - Longitude
 * @param {string} [req.query.recentCo2e] - Weekly CO2e total (kg)
 * @param {string} [req.query.commuteMode] - Typical commute mode
 * @returns {Object} { recommendation: string, aqi: number, aqiText: string }
 */
app.get('/api/recommendation', async (req, res) => {
  const { lat, lon, recentCo2e, commuteMode } = req.query;
  if (!lat || !lon) return res.status(400).json({ error: 'Missing lat/lon' });

  // Fetch AQI (with graceful fallback)
  const aqiPromise = axios.get(
    `http://api.openweathermap.org/data/2.5/air_pollution/forecast?lat=${lat}&lon=${lon}&appid=${process.env.OPENWEATHER_API_KEY}`,
    { timeout: 4000 }
  ).then(r => {
    const list = r.data.list || [];
    const aqi  = list.length > 0 ? list[0].main.aqi : 2;
    return { aqi, aqiText: AQI_LABELS[aqi] || 'Fair' };
  }).catch(() => ({ aqi: 2, aqiText: 'Fair' }));

  const { aqi, aqiText } = await aqiPromise;

  const prompt = `You are EcoPulse AI. Give ONE short actionable eco tip (max 20 words).
AQI: ${aqi} (${aqiText}). Daily CO2e: ${recentCo2e || 0}kg. Commute: ${commuteMode || 'unknown'}.
If AQI ≥4 focus on health. If AQI ≤2 encourage outdoor low-carbon transport. Be specific.`;

  try {
    const geminiRes = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      generationConfig: { maxOutputTokens: 60, temperature: 0.7 },
    });
    res.json({
      recommendation: geminiRes.text?.trim() || 'Try one car-free trip today.',
      aqi,
      aqiText,
    });
  } catch (err) {
    console.error('Gemini recommendation error:', err.message);
    res.json({ recommendation: 'Try replacing one car trip with public transit today.', aqi, aqiText });
  }
});

/**
 * @route POST /api/chat
 * @description EcoPulse AI assistant powered by Gemini 2.5 Flash.
 * Answers questions about the app, carbon tracking, AQI, and eco tips.
 *
 * @param {string} req.body.message - User's question
 * @returns {Object} { reply: string }
 */
app.post('/api/chat', async (req, res) => {
  const { message } = req.body;
  if (!message || !message.trim()) return res.status(400).json({ error: 'Message required' });

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
  } catch (err) {
    console.error('Gemini chat error:', err.message);
    res.status(500).json({ reply: "Sorry, having trouble right now. Try again in a moment 🌿" });
  }
});

// ── Start server (not during tests) ───────────────────────────────────────
if (require.main === module) {
  app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
}

module.exports = app;
