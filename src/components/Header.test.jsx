import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Header from './Header';

describe('Header Component - connection status', () => {
  const baseProps = {
    activeTab: 'maps',
    onTabChange: vi.fn(),
    onLogout: vi.fn(),
  };

  it('shows "Live" when both feeds are connected', () => {
    const connection = {
      vans: { connected: true, error: null },
      freezers: { connected: true, error: null, enabled: true },
    };

    render(<Header {...baseProps} connection={connection} />);

    expect(screen.getByText('Live')).toBeInTheDocument();
  });

  it('shows a lost-state label when the vans feed is disconnected', () => {
    const connection = {
      vans: { connected: false, error: 'Connection error' },
      freezers: { connected: true, error: null, enabled: true },
    };

    render(<Header {...baseProps} connection={connection} />);

    expect(screen.getByText('Vans feed lost')).toBeInTheDocument();
    expect(screen.queryByText('Live')).not.toBeInTheDocument();
  });

  it('ignores a disabled, disconnected freezer feed and still shows "Live"', () => {
    const connection = {
      vans: { connected: true, error: null },
      freezers: { connected: false, error: 'Connection error', enabled: false },
    };

    render(<Header {...baseProps} connection={connection} />);

    expect(screen.getByText('Live')).toBeInTheDocument();
  });
});
