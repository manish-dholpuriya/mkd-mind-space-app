const MAX_RETRIES = 2;
const BASE_DELAY_MS = 1000;
const TIMEOUT_MS = 15000;

/**
 * Determine the API endpoint based on environment.
 * In production (Vercel): calls /api/gemini (server-side proxy, key stays hidden)
 * In development: calls Google directly with client-side key
 */
function getEndpoint() {
  if (import.meta.env.PROD) {
    return '/api/gemini';
  }
  return 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent';
}

function getHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  // Only attach API key in dev mode (production uses server-side proxy)
  if (!import.meta.env.PROD) {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_key_here') {
      throw new Error('Gemini API key is missing. Please add your key to the .env file.');
    }
    headers['X-goog-api-key'] = apiKey;
  }
  return headers;
}

/**
 * Core Gemini API caller with retry, backoff, and timeout.
 * @param {Object} body - The request body ({ contents: [...] })
 * @returns {Promise<string>} The generated text response.
 */
async function callGemini(body) {
  // Input sanitization — trim all text parts
  if (body.contents) {
    for (const content of body.contents) {
      if (content.parts) {
        for (const part of content.parts) {
          if (typeof part.text === 'string') {
            part.text = part.text.trim().slice(0, 5000);
          }
        }
      }
    }
  }

  const endpoint = getEndpoint();
  const headers = getHeaders();
  let lastError = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if ([429, 500, 503].includes(response.status) && attempt < MAX_RETRIES) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt);
        console.warn(`API returned ${response.status}, retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})...`);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        let errMsg = typeof errData.error === 'string' ? errData.error : (errData.error?.message || `API error (${response.status}). Please try again.`);
        if (response.status === 429) {
          errMsg = 'Rate limit exceeded (429). The AI service is currently busy. Please wait a few seconds before trying again.';
        }
        throw new Error(errMsg);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new Error('Received an empty response from the AI. Please try again.');
      }

      return text.trim();
    } catch (error) {
      clearTimeout(timeoutId);
      lastError = error;

      if (error.name === 'AbortError') {
        throw new Error('The request timed out. Please check your connection and try again.', { cause: error });
      }

      if (error instanceof TypeError && attempt < MAX_RETRIES) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt);
        console.warn(`Network error, retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})...`);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }

      throw error;
    }
  }

  throw lastError || new Error('Failed after multiple retries. Please try again later.');
}

/**
 * Analyze a daily check-in entry using Gemini AI.
 */
export async function analyzeEntry({ mood, moodLabel, stress, exams, journal }) {
  const examsText = exams.length > 0 ? exams.join(', ') : 'competitive exams';

  const prompt = `You are an empathetic AI wellness companion for Indian students preparing for competitive exams (${examsText}).

Mood: ${moodLabel} (${mood})
Stress level: ${stress}/10
Journal entry: "${journal}"

Respond in 3 flowing parts (no bold headers):
1. Empathetic reflection (2-3 sentences): Acknowledge what they're going through using specific details from their journal. Be warm, not clinical.
2. Hidden pattern insight (1-2 sentences): Name one stress trigger or emotional pattern in their writing they may not have noticed.
3. Personalized support (3-4 actionable items): Tailored coping strategies, mindfulness tips, or study advice specific to their exam and situation.

Keep it under 300 words. Be conversational and genuinely caring.`;

  return callGemini({
    contents: [{ parts: [{ text: prompt }] }],
  });
}

/**
 * Multi-turn chat session with Gemini AI.
 */
export async function chatWithAI(messages) {
  const contents = messages.map((m) => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: m.text }],
  }));

  if (contents.length === 1 && contents[0].role === 'user') {
    const systemContext = `You are MindSpace, a warm empathetic AI wellness companion for Indian students preparing for competitive exams (JEE, NEET, UPSC, CAT, GATE, CUET). Provide emotional support, coping strategies, mindfulness tips, and academic encouragement. Keep responses under 150 words. Be conversational, never preachy. If the student seems in serious distress, gently suggest speaking to a counselor or trusted adult.`;
    contents[0].parts[0].text = `${systemContext}\n\nStudent: ${contents[0].parts[0].text}`;
  }

  return callGemini({ contents });
}

/**
 * Fetch a daily motivational quote.
 */
export async function getDailyQuote(examContext) {
  const exam = examContext || 'a competitive exam';

  const prompt = `Generate one short, powerful motivational quote (max 20 words) specifically for an Indian student preparing for ${exam}. Make it feel personal and real, not generic. Return only the quote text, no author, no punctuation other than the quote itself.`;

  const text = await callGemini({
    contents: [{ parts: [{ text: prompt }] }],
  });

  return text.replace(/^["']|["']$/g, '');
}
