import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import TopPerformersCards from './TopPerformersCards';

describe('TopPerformersCards', () => {
  const mockCreators = [
    {
      id: '1',
      nombre: 'Maria Lopez',
      diamantes: 500000,
      views: 1000000,
      hito_diamantes: 500000,
    },
    {
      id: '2',
      nombre: 'Juan Perez',
      diamantes: 350000,
      views: 800000,
      hito_diamantes: 300000,
    },
    {
      id: '3',
      nombre: 'Ana Garcia',
      diamantes: 250000,
      views: 600000,
      hito_diamantes: 100000,
    },
  ];

  it('renders empty state when no creators', () => {
    const { getByText } = render(<TopPerformersCards creators={[]} />);
    
    expect(getByText('No hay datos disponibles')).toBeTruthy();
  });

  it('displays top 3 creators with medals', () => {
    const { getByText, container } = render(<TopPerformersCards creators={mockCreators} />);
    
    expect(getByText('Maria Lopez')).toBeTruthy();
    expect(getByText('Juan Perez')).toBeTruthy();
    expect(getByText('Ana Garcia')).toBeTruthy();
    
    // Verify medals are present in the document
    const content = container.textContent || '';
    expect(content.includes('🥇') || content.includes('🥈') || content.includes('🥉')).toBe(true);
  });

  it('displays diamantes count correctly formatted', () => {
    const { getByText } = render(<TopPerformersCards creators={mockCreators} />);
    
    expect(getByText(/500,000/)).toBeTruthy();
    expect(getByText(/350,000/)).toBeTruthy();
    expect(getByText(/250,000/)).toBeTruthy();
  });

  it('displays views count correctly', () => {
    const { getByText } = render(<TopPerformersCards creators={mockCreators} />);
    
    expect(getByText(/1,000,000/)).toBeTruthy();
    expect(getByText(/800,000/)).toBeTruthy();
    expect(getByText(/600,000/)).toBeTruthy();
  });

  it('shows correct milestone badges', () => {
    const { getByText } = render(<TopPerformersCards creators={mockCreators} />);
    
    expect(getByText('🎯 300k+')).toBeTruthy();
    expect(getByText('📈 100k+')).toBeTruthy();
  });

  it('sorts creators by diamantes descending', () => {
    const unsortedCreators = [...mockCreators].reverse();
    const { container } = render(<TopPerformersCards creators={unsortedCreators} />);
    
    // First card should still show Maria Lopez (highest diamantes)
    const cards = container.querySelectorAll('h3');
    expect(cards[0]?.textContent).toContain('Maria Lopez');
  });

  it('displays initials in avatars', () => {
    const { getByText } = render(<TopPerformersCards creators={mockCreators} />);
    
    expect(getByText('MA')).toBeTruthy();
    expect(getByText('JU')).toBeTruthy();
    expect(getByText('AN')).toBeTruthy();
  });
});
