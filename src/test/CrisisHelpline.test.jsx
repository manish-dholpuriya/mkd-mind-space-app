import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CrisisHelpline from '../components/CrisisHelpline';

describe('CrisisHelpline', () => {
  it('renders collapsed state by default', () => {
    render(<CrisisHelpline />);
    expect(screen.getByText('Need immediate support?')).toBeInTheDocument();
    expect(screen.getByText(/student mental health helplines/i)).toBeInTheDocument();
    expect(screen.queryByText('Tele-MANAS (Govt. of India)')).not.toBeInTheDocument();
  });

  it('expands details when clicked', () => {
    render(<CrisisHelpline />);
    const button = screen.getByRole('button', { name: /Need immediate support/i });
    
    fireEvent.click(button);

    expect(screen.getByText('Tele-MANAS (Govt. of India)')).toBeInTheDocument();
    expect(screen.getByText('Vandrevala Foundation')).toBeInTheDocument();
    expect(screen.getByText('iCall (TISS)')).toBeInTheDocument();
  });

  it('collapses details when clicked again', () => {
    render(<CrisisHelpline />);
    const button = screen.getByRole('button', { name: /Need immediate support/i });
    
    // expand
    fireEvent.click(button);
    expect(screen.getByText('Tele-MANAS (Govt. of India)')).toBeInTheDocument();

    // collapse
    fireEvent.click(button);
    expect(screen.queryByText('Tele-MANAS (Govt. of India)')).not.toBeInTheDocument();
  });
});
