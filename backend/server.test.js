/**
 * @file server.test.js
 * @description Integration tests for the EcoPulse Express API.
 * Tests all routes for correct status codes, response shapes,
 * validation, and error handling — without making real external API calls.
 */

const request = require('supertest');

// ── Mock external dependencies before loading server ──
const mockGenerateContent = jest.fn().mockResolvedValue({
  text: 'Take the bus today to reduce your carbon footprint.',
});

jest.mock('@google/genai', () => ({
  GoogleGenAI: jest.fn().mockImplementation(() => ({
    models: { generateContent: mockGenerateContent },
  })),
}));

jest.mock('axios');
const axios = require('axios');

// Set required env vars before server initialises
process.env.GEMINI_API_KEY      = 'test-gemini-key';
process.env.OPENWEATHER_API_KEY = 'test-weather-key';

// Load app after mocks are in place
const app = require('./server');

// Reset mock state between tests
beforeEach(() => {
  mockGenerateContent.mockResolvedValue({
    text: 'Take the bus today to reduce your carbon footprint.',
  });
});

// ─────────────────────────────────────────────
// Health check
// ─────────────────────────────────────────────
describe('GET /health', () => {
  test('returns 200 with OK', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.text).toBe('OK');
  });
});

// ─────────────────────────────────────────────
// POST /api/calculate
// ─────────────────────────────────────────────
describe('POST /api/calculate', () => {
  test('returns correct co2e for car transport', async () => {
    const res = await request(app)
      .post('/api/calculate')
      .send({ transport: { mode: 'car', distanceKm: 10 } });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('co2e', 2.0);
  });

  test('returns correct co2e for combined inputs', async () => {
    const res = await request(app)
      .post('/api/calculate')
      .send({
        transport: { mode: 'bus', distanceKm: 15 },
        diet:      { type: 'omnivore', days: 1 },
        energy:    { kwh: 5 },
      });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('co2e', 8.5);
  });

  test('returns 0 co2e for empty body', async () => {
    const res = await request(app).post('/api/calculate').send({});
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('co2e', 0);
  });

  test('co2e is a number in response', async () => {
    const res = await request(app)
      .post('/api/calculate')
      .send({ transport: { mode: 'train', distanceKm: 20 } });
    expect(typeof res.body.co2e).toBe('number');
  });

  test('handles malformed body without crashing', async () => {
    const res = await request(app)
      .post('/api/calculate')
      .set('Content-Type', 'application/json')
      .send('{}');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('co2e', 0);
  });
});

// ─────────────────────────────────────────────
// GET /api/recommendation
// ─────────────────────────────────────────────
describe('GET /api/recommendation', () => {
  beforeEach(() => {
    axios.get.mockResolvedValue({
      data: { list: [{ main: { aqi: 2 } }] },
    });
  });

  test('returns recommendation, aqi, aqiText on valid input', async () => {
    const res = await request(app)
      .get('/api/recommendation')
      .query({ lat: '28.61', lon: '77.20', recentCo2e: '8', commuteMode: 'car' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('recommendation');
    expect(res.body).toHaveProperty('aqi');
    expect(res.body).toHaveProperty('aqiText');
    expect(typeof res.body.recommendation).toBe('string');
    expect(res.body.recommendation.length).toBeGreaterThan(0);
  });

  test('returns 400 when lat/lon are missing', async () => {
    const res = await request(app).get('/api/recommendation');
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('returns 400 when only lat is provided', async () => {
    const res = await request(app)
      .get('/api/recommendation')
      .query({ lat: '28.61' });
    expect(res.status).toBe(400);
  });

  test('falls back gracefully when AQI API fails', async () => {
    axios.get.mockRejectedValueOnce(new Error('Network error'));
    const res = await request(app)
      .get('/api/recommendation')
      .query({ lat: '28.61', lon: '77.20' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('aqi', 2); // fallback value
    expect(res.body).toHaveProperty('aqiText', 'Fair');
  });

  test('aqi value is between 1 and 5', async () => {
    const res = await request(app)
      .get('/api/recommendation')
      .query({ lat: '28.61', lon: '77.20' });
    expect(res.body.aqi).toBeGreaterThanOrEqual(1);
    expect(res.body.aqi).toBeLessThanOrEqual(5);
  });
});

// ─────────────────────────────────────────────
// POST /api/chat
// ─────────────────────────────────────────────
describe('POST /api/chat', () => {
  test('returns a reply for valid message', async () => {
    const res = await request(app)
      .post('/api/chat')
      .send({ message: 'How do I get started?' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('reply');
    expect(typeof res.body.reply).toBe('string');
    expect(res.body.reply.length).toBeGreaterThan(0);
  });

  test('returns 400 when message is missing', async () => {
    const res = await request(app).post('/api/chat').send({});
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('returns 400 when message is empty string', async () => {
    const res = await request(app).post('/api/chat').send({ message: '' });
    expect(res.status).toBe(400);
  });

  test('handles Gemini failure gracefully with 500', async () => {
    mockGenerateContent.mockRejectedValueOnce(new Error('Gemini unavailable'));
    const res = await request(app)
      .post('/api/chat')
      .send({ message: 'What is EcoPulse?' });
    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('reply');
  });
});

// ─────────────────────────────────────────────
// Error path coverage for recommendation
// ─────────────────────────────────────────────
describe('GET /api/recommendation — Gemini error path', () => {
  beforeEach(() => {
    axios.get.mockResolvedValue({
      data: { list: [{ main: { aqi: 1 } }] },
    });
  });

  test('returns fallback recommendation when Gemini fails', async () => {
    mockGenerateContent.mockRejectedValueOnce(new Error('Gemini timeout'));
    const res = await request(app)
      .get('/api/recommendation')
      .query({ lat: '28.61', lon: '77.20' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('recommendation');
    expect(res.body.recommendation.length).toBeGreaterThan(0);
    expect(res.body).toHaveProperty('aqi');
  });
});
