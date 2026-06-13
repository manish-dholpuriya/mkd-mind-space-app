import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import BreathingTimer from '../components/BreathingTimer';

describe('BreathingTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(<BreathingTimer isOpen={false} onClose={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders correctly when isOpen is true', () => {
    render(<BreathingTimer isOpen={true} onClose={vi.fn()} />);
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(screen.getByText('Mindful Breathing')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Start/i })).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const handleClose = vi.fn();
    render(<BreathingTimer isOpen={true} onClose={handleClose} />);
    act(() => {
      vi.advanceTimersByTime(100);
    });
    const closeBtn = screen.getByLabelText('Close breathing timer');
    
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('starts running when start button is clicked and advances phases', () => {
    render(<BreathingTimer isOpen={true} onClose={vi.fn()} />);
    act(() => {
      vi.advanceTimersByTime(100);
    });
    const startBtn = screen.getByRole('button', { name: /Start/i });

    fireEvent.click(startBtn);

    // Initial phase: Inhale (4s)
    expect(screen.getByText('Inhale')).toBeInTheDocument();
    expect(screen.getByText('4s')).toBeInTheDocument();

    // Advance 1 second
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByText('3s')).toBeInTheDocument();

    // Advance to 4 seconds to trigger phase change to Hold (4s)
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(screen.getByText('Hold')).toBeInTheDocument();
    expect(screen.getByText('4s')).toBeInTheDocument();

    // Advance 4 seconds to trigger phase change to Exhale (6s)
    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(screen.getByText('Exhale')).toBeInTheDocument();
    expect(screen.getByText('6s')).toBeInTheDocument();

    // Advance 6 seconds to trigger phase change back to Inhale and increment cycle count
    act(() => {
      vi.advanceTimersByTime(6000);
    });
    expect(screen.getByText('Inhale')).toBeInTheDocument();
    expect(screen.getByText('Cycle 2')).toBeInTheDocument();
  });

  it('pauses and resets when Stop is clicked', () => {
    render(<BreathingTimer isOpen={true} onClose={vi.fn()} />);
    act(() => {
      vi.advanceTimersByTime(100);
    });
    const startBtn = screen.getByRole('button', { name: /Start/i });

    // Start
    fireEvent.click(startBtn);
    expect(screen.getByRole('button', { name: /Stop/i })).toBeInTheDocument();
    expect(screen.getByText('Cycle 1')).toBeInTheDocument();

    // Stop
    const stopBtn = screen.getByRole('button', { name: /Stop/i });
    fireEvent.click(stopBtn);
    expect(screen.getByRole('button', { name: /Start/i })).toBeInTheDocument();
    expect(screen.queryByText('Cycle 1')).not.toBeInTheDocument();
  });

  it('triggers onClose on Escape keydown', () => {
    const handleClose = vi.fn();
    render(<BreathingTimer isOpen={true} onClose={handleClose} />);
    act(() => {
      vi.advanceTimersByTime(100);
    });
    
    const dialog = screen.getByRole('dialog');
    fireEvent.keyDown(dialog, { key: 'Escape', code: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
