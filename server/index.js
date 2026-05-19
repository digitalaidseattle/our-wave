import express from 'express';
import bodyParser from 'body-parser';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 3002;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

if (!GOOGLE_API_KEY) {
  console.warn('Warning: GOOGLE_API_KEY not set — proxy will return 500 for AI calls.');
}

app.post('/api/ai', async (req, res) => {
  try {
    if (!GOOGLE_API_KEY) {
      return res.status(500).json({ error: 'Server misconfiguration: GOOGLE_API_KEY missing.' });
    }

    const payload = req.body || {};

    // NOTE: adjust endpoint/auth as needed for your Google GenAI provisioning.
    const endpoint = 'https://generativelanguage.googleapis.com/v1beta2/models/text-bison:generate';

    const r = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GOOGLE_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const json = await r.json();
    res.status(r.status).json(json);
  } catch (err) {
    console.error('AI proxy error:', err);
    res.status(500).json({ error: err?.message || 'Unknown error' });
  }
});

app.listen(PORT, () => {
  console.log(`AI proxy listening at http://localhost:${PORT}`);
});
