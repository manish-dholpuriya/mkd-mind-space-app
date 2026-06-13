/**
 * Analyze daily check-in entry using Gemini 1.5 Flash API
 * @param {Object} params
 * @param {string} params.mood - The emoji of the mood (e.g., '😫')
 * @param {string} params.moodLabel - The text label of the mood (e.g., 'Exhausted')
 * @param {number} params.stress - Stress level (1-10)
 * @param {string[]} params.exams - Selected exams (e.g., ['JEE', 'NEET'])
 * @returns {Promise<string>} AI analysis response
 */
export async function analyzeEntry({ mood, moodLabel, stress, exams, journal }) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_key_here') {
    throw new Error('Gemini API key is missing or not configured.');
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  
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

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Gemini API error status:', response.status, errText);
      throw new Error(`API response error: status ${response.status}`);
    }

    const data = await response.json();
    
    // Parse response
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error('Empty response received from Gemini API.');
    }

    return text.trim();
  } catch (error) {
    console.error('Gemini analysis failed:', error);
    throw error;
  }
}

/**
 * Multiturn chat session with Gemini 1.5 Flash API
 * @param {Array} messages - Array of { role: 'user'|'ai', text: string } objects
 * @returns {Promise<string>} AI text response
 */
export async function chatWithAI(messages) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_key_here') {
    throw new Error('Gemini API key is missing or not configured.');
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  // Map roles user/ai to user/model
  const contents = messages.map((m) => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: m.text }],
  }));

  // If this is the user's first turn (history length 1), prepend the system context
  if (contents.length === 1 && contents[0].role === 'user') {
    const systemContext = `You are MindSpace, a warm empathetic AI wellness companion for Indian students preparing for competitive exams (JEE, NEET, UPSC, CAT, GATE, CUET). Provide emotional support, coping strategies, mindfulness tips, and academic encouragement. Keep responses under 150 words. Be conversational, never preachy. If the student seems in serious distress, gently suggest speaking to a counselor or trusted adult.`;
    contents[0].parts[0].text = `${systemContext}\n\nStudent: ${contents[0].parts[0].text}`;
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ contents }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Gemini Chat API error status:', response.status, errText);
      throw new Error(`API response error: status ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error('Empty response received from Gemini API.');
    }

    return text.trim();
  } catch (error) {
    console.error('Gemini chat failed:', error);
    throw error;
  }
}

/**
 * Fetch a short motivational quote tailored to the student's exam context using Gemini 1.5 Flash
 * @param {string} examContext - The exam context, e.g. "JEE", "NEET", "UPSC"
 * @returns {Promise<string>} Short motivational quote
 */
export async function getDailyQuote(examContext) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_key_here') {
    throw new Error('Gemini API key is missing or not configured.');
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  const exam = examContext || 'a competitive exam';

  const prompt = `Generate one short, powerful motivational quote (max 20 words) specifically for an Indian student preparing for ${exam}. Make it feel personal and real, not generic. Return only the quote text, no author, no punctuation other than the quote itself.`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Gemini Quote API error status:', response.status, errText);
      throw new Error(`API response error: status ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error('Empty response received from Gemini API.');
    }

    return text.trim().replace(/^["']|["']$/g, ''); // strip outer quotes if AI includes them
  } catch (error) {
    console.error('Gemini quote fetch failed:', error);
    throw error;
  }
}


