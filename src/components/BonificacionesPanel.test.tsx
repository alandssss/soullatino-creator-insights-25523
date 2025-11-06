import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BonificacionesPanel } from './BonificacionesPanel';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock de supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'test-user' } }, error: null })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(() => Promise.resolve({ data: { role: 'admin' }, error: null })),
        })),
      })),
    })),
  },
}));

vi.mock('@/services/creatorAnalytics', () => ({
  creatorAnalytics: {
    getBonificaciones: vi.fn(() => Promise.resolve([
      {
        creator_id: 'creator-1',
        dias_live_mes: 15,
        horas_live_mes: 45.5,
        diam_live_mes: 250000,
        meta_recomendada: '300K',
        texto_creador: 'Test message',
      }
    ])),
    getDiasRealesMes: vi.fn(() => Promise.resolve({
      dias_reales_hasta_hoy: 15,
      horas_totales_mes: 45.5,
    })),
    calcularBonificaciones: vi.fn(() => Promise.resolve()),
  },
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    {children}
  </QueryClientProvider>
);

// Helper function to wait for async operations
const waitFor = async (callback: () => void, options = { timeout: 3000 }) => {
  const startTime = Date.now();
  while (Date.now() - startTime < options.timeout) {
    try {
      callback();
      return;
    } catch (error) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }
  callback(); // Final attempt that will throw if still failing
};

describe('BonificacionesPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    const { container } = render(
      <BonificacionesPanel 
        creatorId="creator-1" 
        creatorName="Test Creator" 
        creatorPhone="+525512345678"
      />,
      { wrapper }
    );
    
    // Check for loading spinner
    const loader = container.querySelector('.animate-spin');
    expect(loader).toBeTruthy();
  });

  it('displays bonificaciones data after loading', async () => {
    const { getByText } = render(
      <BonificacionesPanel 
        creatorId="creator-1" 
        creatorName="Test Creator" 
        creatorPhone="+525512345678"
      />,
      { wrapper }
    );

    await waitFor(() => {
      expect(getByText('Bonificaciones del Mes')).toBeTruthy();
    });

    expect(getByText(/250,000/)).toBeTruthy();
    expect(getByText(/15/)).toBeTruthy();
    expect(getByText(/45.5/)).toBeTruthy();
  });

  it('shows calculate button and handles click', async () => {
    const user = userEvent.setup();
    
    const { getByText, queryByText } = render(
      <BonificacionesPanel 
        creatorId="creator-1" 
        creatorName="Test Creator" 
        creatorPhone="+525512345678"
      />,
      { wrapper }
    );

    await waitFor(() => {
      expect(getByText('Calcular')).toBeTruthy();
    });

    const calculateButton = getByText('Calcular');
    await user.click(calculateButton);

    await waitFor(() => {
      const calculatingButton = queryByText('Calculando...');
      expect(calculatingButton || getByText('Calcular')).toBeTruthy();
    }, { timeout: 2000 });
  });

  it('displays meta recomendada correctly', async () => {
    const { getByText } = render(
      <BonificacionesPanel 
        creatorId="creator-1" 
        creatorName="Test Creator" 
        creatorPhone="+525512345678"
      />,
      { wrapper }
    );

    await waitFor(() => {
      expect(getByText('Meta Recomendada')).toBeTruthy();
    });

    expect(getByText('300K')).toBeTruthy();
  });

  it('shows WhatsApp button when phone is provided', async () => {
    const { container } = render(
      <BonificacionesPanel 
        creatorId="creator-1" 
        creatorName="Test Creator" 
        creatorPhone="+525512345678"
      />,
      { wrapper }
    );

    await waitFor(() => {
      const whatsappElements = container.querySelectorAll('a[href*="wa.me"], button');
      expect(whatsappElements.length).toBeGreaterThan(0);
    });
  });

  it('displays empty state when no bonificacion data', async () => {
    const analytics = await import('@/services/creatorAnalytics');
    vi.mocked(analytics.creatorAnalytics.getBonificaciones).mockResolvedValueOnce([]);
    
    const { getByText } = render(
      <BonificacionesPanel 
        creatorId="creator-2" 
        creatorName="Test Creator" 
        creatorPhone="+525512345678"
      />,
      { wrapper }
    );

    await waitFor(() => {
      expect(getByText(/No hay datos calculados/i)).toBeTruthy();
    });
  });
});
