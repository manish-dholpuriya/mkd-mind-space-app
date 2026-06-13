import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ExamCountdown from '../components/ExamCountdown';

describe('ExamCountdown', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders correctly with default values', () => {
    render(<ExamCountdown />);
    expect(screen.getByText('Exam Countdown')).toBeInTheDocument();
    expect(screen.getByText('Targeting JEE Main 2027 (Jan)')).toBeInTheDocument();
  });

  it('allows changing exam through select and saves to localStorage', () => {
    render(<ExamCountdown />);
    const select = screen.getByLabelText('Select exam for countdown');

    fireEvent.change(select, { target: { value: 'NEET' } });

    expect(screen.getByText('Targeting NEET UG 2027')).toBeInTheDocument();
    expect(localStorage.getItem('mindspace_pinned_exam')).toBe('NEET');
  });

  it('calculates and shows remaining days', () => {
    // Mock the date
    const mockToday = new Date('2026-06-13');
    vi.useFakeTimers();
    vi.setSystemTime(mockToday);

    render(<ExamCountdown />);
    
    // JEE 2027 is 2027-01-24. 
    // From June 13, 2026 to Jan 24, 2027 is exactly:
    // June (17 days), July (31), Aug (31), Sept (30), Oct (31), Nov (30), Dec (31), Jan (24) -> 225 days.
    expect(screen.getByText('225')).toBeInTheDocument();
    expect(screen.getByText('days left')).toBeInTheDocument();

    vi.useRealTimers();
  });
});
