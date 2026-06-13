import { describe, it, expect, beforeEach } from 'vitest';
import { saveEntry, getEntries, saveTip, getTips } from '../utils/storage';

describe('storage.js', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('getEntries', () => {
    it('returns empty array when no entries exist', () => {
      expect(getEntries()).toEqual([]);
    });

    it('returns parsed entries from localStorage', () => {
      const entries = [
        { id: '1', mood: '😄', stress: 3, createdAt: '2026-06-13T00:00:00Z' },
      ];
      localStorage.setItem('mindspace_entries', JSON.stringify(entries));
      expect(getEntries()).toEqual(entries);
    });

    it('returns empty array if localStorage data is corrupted', () => {
      localStorage.setItem('mindspace_entries', 'invalid json{{{');
      expect(getEntries()).toEqual([]);
    });
  });

  describe('saveEntry', () => {
    it('saves an entry with auto-generated id and createdAt', () => {
      saveEntry({ mood: '😄', stress: 3, journal: 'Test entry' });
      const entries = getEntries();
      expect(entries).toHaveLength(1);
      expect(entries[0].mood).toBe('😄');
      expect(entries[0].stress).toBe(3);
      expect(entries[0].journal).toBe('Test entry');
      expect(entries[0].id).toBeDefined();
      expect(entries[0].createdAt).toBeDefined();
    });

    it('appends to existing entries', () => {
      saveEntry({ mood: '😫', stress: 8 });
      saveEntry({ mood: '🙂', stress: 2 });
      const entries = getEntries();
      expect(entries).toHaveLength(2);
      expect(entries[0].mood).toBe('😫');
      expect(entries[1].mood).toBe('🙂');
    });

    it('dispatches storage update event', () => {
      saveEntry({ mood: '😄', stress: 1 });
      expect(window.dispatchEvent).toHaveBeenCalled();
    });
  });

  describe('getTips', () => {
    it('returns empty array when no tips exist', () => {
      expect(getTips()).toEqual([]);
    });

    it('returns parsed tips from localStorage', () => {
      const tips = [{ id: '1', aiResponse: 'Test tip', createdAt: '2026-06-13T00:00:00Z' }];
      localStorage.setItem('mindspace_tips', JSON.stringify(tips));
      expect(getTips()).toEqual(tips);
    });

    it('returns empty array if localStorage data is corrupted', () => {
      localStorage.setItem('mindspace_tips', '!corrupt!');
      expect(getTips()).toEqual([]);
    });
  });

  describe('saveTip', () => {
    it('saves a tip with auto-generated id and createdAt', () => {
      saveTip({ aiResponse: 'You are doing great!' });
      const tips = getTips();
      expect(tips).toHaveLength(1);
      expect(tips[0].aiResponse).toBe('You are doing great!');
      expect(tips[0].id).toBeDefined();
      expect(tips[0].createdAt).toBeDefined();
    });

    it('appends to existing tips', () => {
      saveTip({ aiResponse: 'Tip 1' });
      saveTip({ aiResponse: 'Tip 2' });
      expect(getTips()).toHaveLength(2);
    });
  });
});
