import { describe, it, expect, beforeEach, vi } from 'vitest';
import { saveEntry } from '../utils/storage';

// Helper to create entries on specific dates
function createEntryOnDate(dateStr, mood = '😄', stress = 5) {
  const entries = JSON.parse(localStorage.getItem('mindspace_entries') || '[]');
  entries.push({
    id: Date.now().toString() + Math.random(),
    mood,
    stress,
    createdAt: new Date(dateStr).toISOString(),
  });
  localStorage.setItem('mindspace_entries', JSON.stringify(entries));
}

// We test the streak calculation logic from useStreak
// Since it's the same logic, we import it from the hook
// But useStreak uses React hooks so we test the pure calculation instead

// Extract the calculation logic for testing
function calculateStreak(entries) {
  if (!entries || entries.length === 0) return 0;

  const getLocalDateString = (date) => {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const dates = entries.map(e => getLocalDateString(e.createdAt));
  const uniqueDates = [...new Set(dates)].sort((a, b) => new Date(b) - new Date(a));

  const today = new Date();
  const todayStr = getLocalDateString(today);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = getLocalDateString(yesterday);

  if (uniqueDates[0] !== todayStr && uniqueDates[0] !== yesterdayStr) return 0;

  let currentStreak = 0;
  let checkDate = new Date();
  if (uniqueDates[0] === yesterdayStr) checkDate = yesterday;

  while (true) {
    const dateStr = getLocalDateString(checkDate);
    if (uniqueDates.includes(dateStr)) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else break;
  }
  return currentStreak;
}

describe('Streak Calculation', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns 0 for no entries', () => {
    expect(calculateStreak([])).toBe(0);
  });

  it('returns 0 for null entries', () => {
    expect(calculateStreak(null)).toBe(0);
  });

  it('returns 1 for a single entry today', () => {
    const today = new Date().toISOString();
    expect(calculateStreak([{ createdAt: today }])).toBe(1);
  });

  it('returns 1 for a single entry yesterday', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(calculateStreak([{ createdAt: yesterday.toISOString() }])).toBe(1);
  });

  it('returns 0 for an entry 2 days ago with no today/yesterday', () => {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    expect(calculateStreak([{ createdAt: twoDaysAgo.toISOString() }])).toBe(0);
  });

  it('returns correct streak for consecutive days', () => {
    const today = new Date();
    const entries = [];
    for (let i = 0; i < 5; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      entries.push({ createdAt: d.toISOString() });
    }
    expect(calculateStreak(entries)).toBe(5);
  });

  it('stops counting at a gap', () => {
    const today = new Date();
    const entries = [
      { createdAt: today.toISOString() },
      { createdAt: new Date(today.getTime() - 86400000).toISOString() }, // yesterday
      // gap: day before yesterday missing
      { createdAt: new Date(today.getTime() - 86400000 * 3).toISOString() }, // 3 days ago
    ];
    expect(calculateStreak(entries)).toBe(2);
  });

  it('handles multiple entries on the same day', () => {
    const today = new Date();
    const entries = [
      { createdAt: today.toISOString() },
      { createdAt: today.toISOString() },
      { createdAt: today.toISOString() },
    ];
    expect(calculateStreak(entries)).toBe(1);
  });
});
