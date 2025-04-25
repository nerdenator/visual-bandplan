import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import * as functions from 'firebase-functions';
import { logger } from 'firebase-functions';

const app = express();
app.use(cors());

// Add request logging middleware
app.use((req, res, next) => {
  logger.info('Request received:', {
    method: req.method,
    originalUrl: req.originalUrl,
    path: req.path,
    baseUrl: req.baseUrl,
    url: req.url
  });
  next();
});

app.get('/', async (req, res) => {
  logger.info('Base route hit');
  res.json({ message: "API is running" });
});

app.get('/repeaters', async (req, res) => {
  logger.info('Repeaters endpoint hit', { city: req.query.city });
  const city = req.query.city;
  const url = `https://www.repeaterbook.com/api/export.php?format=json&city=${encodeURIComponent(city)}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'visual-bandplan(kj7yjm@icloud.com)'
      }
    });
    const data = await response.json();
    logger.info('Repeaterbook API response received', { status: response.status });
    res.json(data);
  } catch (error) {
    logger.error('Error fetching data:', error);
    res.status(500).json({ error: error.message });
  }
});

// Export the function using v1 syntax
export const api = functions.https.onRequest(app);