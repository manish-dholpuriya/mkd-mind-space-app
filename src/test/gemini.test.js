import { describe, it, expect, vi, beforeEach } from 'vitest';

// We need to test the callGemini retry logic.
// Since callGemini is not exported, we test through analyzeEntry/chatWithAI/getDailyQuote.

// Mock import.meta.env
vi.stubEnv('VITE_GEMINI_API_KEY', 'test-api-key-123');

// We'll mock global fetch
const mockFetchSuccess = (text) =>
  vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({
      candidates: [{ content: { parts: [{ text }] } }],
    }),
  });

const mockFetchFailure = (status) =>
  vi.fn().mockResolvedValue({
    ok: false,
    status,
    json: () => Promise.resolve({ error: 'Gemini API error (400). Please try again.' }),
    text: () => Promise.resolve(`Error ${status}`),
  });

describe('gemini.js', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubEnv('VITE_GEMINI_API_KEY', 'test-api-key-123');
  });

  describe('analyzeEntry', () => {
    it('returns AI text on successful response', async () => {
      global.fetch = mockFetchSuccess('You are doing great! Keep going.');
      
      const { analyzeEntry } = await import('../utils/gemini');
      const result = await analyzeEntry({
        mood: '😄',
        moodLabel: 'Focused',
        stress: 3,
        exams: ['JEE'],
        journal: 'Had a good study day.',
      });

      expect(result).toBe('You are doing great! Keep going.');
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('includes exam context in the API request', async () => {
      global.fetch = mockFetchSuccess('Response text');
      
      const { analyzeEntry } = await import('../utils/gemini');
      await analyzeEntry({
        mood: '😟',
        moodLabel: 'Anxious',
        stress: 7,
        exams: ['NEET', 'CUET'],
        journal: 'Feeling overwhelmed.',
      });

      const callBody = JSON.parse(global.fetch.mock.calls[0][1].body);
      const promptText = callBody.contents[0].parts[0].text;
      expect(promptText).toContain('NEET, CUET');
    });
  });

  describe('chatWithAI', () => {
    it('returns AI response for chat messages', async () => {
      global.fetch = mockFetchSuccess('I understand how you feel.');
      
      const { chatWithAI } = await import('../utils/gemini');
      const result = await chatWithAI([
        { role: 'user', text: 'I am stressed about my exam.' },
      ]);

      expect(result).toBe('I understand how you feel.');
    });

    it('maps ai role to model role', async () => {
      global.fetch = mockFetchSuccess('Response');
      
      const { chatWithAI } = await import('../utils/gemini');
      await chatWithAI([
        { role: 'user', text: 'Hello' },
        { role: 'ai', text: 'Hi there' },
        { role: 'user', text: 'How are you?' },
      ]);

      const callBody = JSON.parse(global.fetch.mock.calls[0][1].body);
      expect(callBody.contents[1].role).toBe('model');
    });
  });

  describe('getDailyQuote', () => {
    it('returns cleaned quote text', async () => {
      global.fetch = mockFetchSuccess('"Your effort today shapes your tomorrow."');
      
      const { getDailyQuote } = await import('../utils/gemini');
      const result = await getDailyQuote('JEE');

      expect(result).toBe('Your effort today shapes your tomorrow.');
    });
  });

  describe('error handling', () => {
    it('throws user-friendly error on non-ok response', async () => {
      global.fetch = mockFetchFailure(400);
      
      const { analyzeEntry } = await import('../utils/gemini');
      await expect(
        analyzeEntry({ mood: '😫', moodLabel: 'Exhausted', stress: 9, exams: [], journal: 'test' })
      ).rejects.toThrow('Gemini API error');
    });

    it('throws on empty response', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ candidates: [{ content: { parts: [{ text: '' }] } }] }),
      });
      
      const { analyzeEntry } = await import('../utils/gemini');
      await expect(
        analyzeEntry({ mood: '😫', moodLabel: 'Exhausted', stress: 9, exams: [], journal: 'test' })
      ).rejects.toThrow('empty response');
    });

    it('throws on missing API key', async () => {
      vi.stubEnv('VITE_GEMINI_API_KEY', '');
      
      // Force re-import to pick up new env
      vi.resetModules();
      const { analyzeEntry } = await import('../utils/gemini');
      await expect(
        analyzeEntry({ mood: '😫', moodLabel: 'Exhausted', stress: 9, exams: [], journal: 'test' })
      ).rejects.toThrow('API key is missing');
    });
  });
});
