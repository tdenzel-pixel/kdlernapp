import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
}
