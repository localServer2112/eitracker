import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import VansListModal from './VansListModal';

describe('VansListModal', () => {
  const vans = {
    'VAN-001': {
      vehicle_plate_number: 'VAN-001',
      model: 'Ford Transit',
      status: 'online',
      type: 'van',
    },
    'VAN-002': {
      vehicle_plate_number: 'VAN-002',
      model: 'Mercedes Sprinter',
      status: 'offline',
      type: 'van',
    },
    'TRI-001': {
      vehicle_plate_number: 'TRI-001',
      model: 'Piaggio Ape',
      status: 'online',
      type: 'tricycle',
    },
  };

  it('shows the van and tricycle counts in the header', () => {
    render(
      <VansListModal
        vans={vans}
        token="fake-token"
        onSelectVan={vi.fn()}
        onSwitchToMap={vi.fn()}
      />
    );

    expect(screen.getByText('2 Vans · 1 Tricycles')).toBeInTheDocument();
  });

  it('filters the list to matching rows when typing a plate fragment', () => {
    render(
      <VansListModal
        vans={vans}
        token="fake-token"
        onSelectVan={vi.fn()}
        onSwitchToMap={vi.fn()}
      />
    );

    const searchInput = screen.getByPlaceholderText('Search...');
    fireEvent.change(searchInput, { target: { value: 'VAN-001' } });

    expect(screen.getByText('VAN-001')).toBeInTheDocument();
    expect(screen.queryByText('VAN-002')).not.toBeInTheDocument();
    expect(screen.queryByText('TRI-001')).not.toBeInTheDocument();
  });

  it('shows the empty-state message when no vehicles match the search', () => {
    render(
      <VansListModal
        vans={vans}
        token="fake-token"
        onSelectVan={vi.fn()}
        onSwitchToMap={vi.fn()}
      />
    );

    const searchInput = screen.getByPlaceholderText('Search...');
    fireEvent.change(searchInput, { target: { value: 'no-such-plate' } });

    expect(screen.getByText('No vehicles found')).toBeInTheDocument();
  });

  it('calls onSelectVan with the clicked van and onSwitchToMap once', () => {
    const onSelectVan = vi.fn();
    const onSwitchToMap = vi.fn();

    render(
      <VansListModal
        vans={vans}
        token="fake-token"
        onSelectVan={onSelectVan}
        onSwitchToMap={onSwitchToMap}
      />
    );

    fireEvent.click(screen.getByText('VAN-001'));

    expect(onSelectVan).toHaveBeenCalledTimes(1);
    expect(onSelectVan).toHaveBeenCalledWith(vans['VAN-001']);
    expect(onSwitchToMap).toHaveBeenCalledTimes(1);
  });
});
