// Vercel Serverless Function — proxies Gemini API calls
// Keeps the API key server-side only (never sent to the browser)

const API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent';
const MAX_BODY_SIZE = 10000; // 10KB max request body

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  // Server-side API key (NOT prefixed with VITE_)
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('GEMINI_API_KEY environment variable is not set on the server.');
    return res.status(500).json({ error: 'Server configuration error. API key is missing.' });
  }

  // Input validation
  const body = req.body;
  if (!body || !body.contents || !Array.isArray(body.contents)) {
    return res.status(400).json({ error: 'Invalid request body. "contents" array is required.' });
  }

  // Validate contents structure
  for (const content of body.contents) {
    if (!content.parts || !Array.isArray(content.parts)) {
      return res.status(400).json({ error: 'Invalid content structure. Each content must have a "parts" array.' });
    }
    for (const part of content.parts) {
      if (typeof part.text !== 'string') {
        return res.status(400).json({ error: 'Invalid part. Each part must have a "text" string.' });
      }
      // Limit text length to prevent abuse
      if (part.text.length > 5000) {
        return res.status(400).json({ error: 'Text content exceeds maximum length of 5000 characters.' });
      }
    }
  }

  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': apiKey,
      },
      body: JSON.stringify({ contents: body.contents }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Gemini API error:', response.status, JSON.stringify(data));
      return res.status(response.status).json({
        error: `AI service error (${response.status}). Please try again.`,
      });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Proxy error:', error.message);
    return res.status(502).json({ error: 'Failed to reach AI service. Please try again.' });
  }
}
