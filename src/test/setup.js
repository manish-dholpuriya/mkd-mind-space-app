import { vi, afterEach } from 'vitest';
import '@testing-library/jest-dom';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = String(value); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; },
    get length() { return Object.keys(store).length; },
    key: (i) => Object.keys(store)[i] || null,
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock window.dispatchEvent
window.dispatchEvent = vi.fn();

// Clean up between tests
afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});
