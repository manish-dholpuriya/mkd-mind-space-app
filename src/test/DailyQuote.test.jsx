import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DailyQuote from '../components/DailyQuote';

// Mock gemini utility
vi.mock('../utils/gemini', () => ({
  getDailyQuote: vi.fn().mockResolvedValue('Tests are passing perfectly!'),
}));

// Mock storage utility
vi.mock('../utils/storage', () => ({
  getEntries: vi.fn().mockReturnValue([{ exams: ['JEE', 'NEET'] }]),
}));

import { getDailyQuote } from '../utils/gemini';

describe('DailyQuote', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('renders default quote initially when fetch is loading', async () => {
    render(<DailyQuote />);
    // Initial render displays the loaded quote from the mock
    await waitFor(() => {
      expect(screen.getByText('Tests are passing perfectly!')).toBeInTheDocument();
    });
  });

  it('fetches new quote when refresh button is clicked', async () => {
    vi.mocked(getDailyQuote).mockResolvedValue('Second mocked quote text.');
    render(<DailyQuote />);
    
    const refreshBtn = screen.getByLabelText('Refresh daily quote');
    fireEvent.click(refreshBtn);

    await waitFor(() => {
      expect(screen.getByText('Second mocked quote text.')).toBeInTheDocument();
    });
    expect(getDailyQuote).toHaveBeenCalled();
  });
});
