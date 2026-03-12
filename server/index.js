require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

const client = new Anthropic.default({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

app.post('/api/summarize', async (req, res) => {
  try {
    const { images, subject } = req.body;

    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: 'Keine Bilder gesendet.' });
    }
    if (!subject) {
      return res.status(400).json({ error: 'Kein Fach angegeben.' });
    }

    const imageContent = images.map((img) => ({
      type: 'image',
      source: {
        type: 'base64',
        media_type: img.mediaType,
        data: img.data,
      },
    }));

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: [
            ...imageContent,
            {
              type: 'text',
              text: `Du bist ein hilfreicher Lernassistent für Schüler. Fasse den Inhalt dieser Schulnotizen zum Fach "${subject}" auf Deutsch zusammen. Strukturiere die Zusammenfassung klar und übersichtlich mit Überschriften und Aufzählungspunkten. Schreibe so, dass ein Schüler es gut verstehen und zum Lernen nutzen kann.`,
            },
          ],
        },
      ],
    });

    res.json({ summary: message.content[0].text });
  } catch (err) {
    console.error('Summarize error:', err.message);
    res.status(500).json({ error: err.message || 'Fehler beim Zusammenfassen.' });
  }
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
