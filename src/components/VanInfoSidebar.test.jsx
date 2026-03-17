import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import VanInfoSidebar from './VanInfoSidebar';

// Mock the child components that we don't need to test (ScrollArea, etc usually render children fine)
// We mock getAddressFromCoordinates to prevent live OSM API calls during component tests
vi.mock('../utils/geocoder', () => ({
  getAddressFromCoordinates: vi.fn().mockResolvedValue('123 Mock Street')
}));

describe('VanInfoSidebar Component', () => {
  const baseVanProps = {
    vehicle_plate_number: 'LSD-123-YK',
    model: 'Ford Transit',
    status: 'online',
    last_seen: new Date().toISOString(), // "just now"
    battery_percentage: 85,
    network_status: 'strong',
    netSignal: 80,
    sht_temp: 22.5,
    temp_2: 23.0,
    ambient_temp: 28.0,
    humidity: 60,
    cooling_unit_battery: 90,
    logger_battery: 85,
    solar_panel_current: 5.5,
    energy_charged: 120.5,
    vehicle_speed: 40,
    total_distance: 45230, // 45230 meters
    latitude: 3.1415,
    longitude: 7.8910,
  };

  it('renders the core van identifiers correctly', () => {
    render(<VanInfoSidebar van={baseVanProps} onClose={vi.fn()} onViewOnMap={vi.fn()} />);
    
    expect(screen.getByText('LSD-123-YK')).toBeInTheDocument();
    expect(screen.getByText('Ford Transit')).toBeInTheDocument();
  });

  it('formats total_distance from meters to kilometers with 2 decimal places', () => {
    // 45230 meters should display as 45.23 km
    render(<VanInfoSidebar van={baseVanProps} onClose={vi.fn()} onViewOnMap={vi.fn()} />);
    
    // We search the text explicitly expecting the mathematically transformed value
    expect(screen.getByText('45.23')).toBeInTheDocument();
    expect(screen.getByText('Total distance moved')).toBeInTheDocument();
  });

  it('calculates the timeSince string correctly for outdated seen times', () => {
    const twoMinutesAgo = new Date(Date.now() - 120000).toISOString();
    
    const staleVan = { ...baseVanProps, last_seen: twoMinutesAgo };
    render(<VanInfoSidebar van={staleVan} onClose={vi.fn()} onViewOnMap={vi.fn()} />);
    
    // 120,000 milliseconds is precisely 2 minutes
    expect(screen.getByText('2 min ago')).toBeInTheDocument();
  });

  it('renders the battery percentage correctly depending on condition', () => {
    const criticalVan = { ...baseVanProps, battery_percentage: 15 };
    const { container } = render(<VanInfoSidebar van={criticalVan} onClose={vi.fn()} onViewOnMap={vi.fn()} />);
    
    expect(screen.getByText('15%')).toBeInTheDocument();
    
    // Since battery is 15% (<20), our cn() utility should have applied 'text-red-500' to the icon wrapper
    // The querySelector strictly checks the component DOM to ensure visual warning logic executed
    const batteryIcon = container.querySelector('.text-red-500');
    expect(batteryIcon).toBeInTheDocument();
  });
});
