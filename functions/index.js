import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import { onRequest } from 'firebase-functions/v2/https';

const app = express();

// Configure CORS - more permissive for testing
const corsOptions = {
  origin: true, // Allow all origins for testing
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  allowedHeaders: ['Content-Type', 'Authorization', 'User-Agent'],
  credentials: true
};

app.use(cors(corsOptions));

app.get('/repeaters', async (req, res) => {
  try {
    const { city } = req.query;
    if (!city) {
      return res.status(400).json({ error: 'City parameter is required' });
    }

    const url = `https://www.repeaterbook.com/api/export.php?format=json&city=${encodeURIComponent(city)}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'visual-bandplan(kj7yjm@icloud.com)'
      }
    });

    if (!response.ok) {
      throw new Error(`RepeaterBook API responded with ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

export const api = onRequest({
  cors: true,
  maxInstances: 10
}, app);