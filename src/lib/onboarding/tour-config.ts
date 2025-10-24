import { driver, DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';

export type TourType = 'first-time' | 'bonificaciones' | 'supervision' | 'reclutamiento';

const TOURS: Record<TourType, DriveStep[]> = {
  'first-time': [
    {
      element: '#dashboard-header',
      popover: {
        title: '👋 Bienvenido a Soullatino Analytics',
        description: 'Esta es tu vista principal. Aquí verás métricas clave de tus creadores.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '#creators-list',
      popover: {
        title: '📋 Lista de Creadores',
        description: 'Aquí están todos tus creadores ordenados por rendimiento. Haz clic en uno para ver detalles.',
      },
    },
    {
      element: '#bonificaciones-tab',
      popover: {
        title: '💎 Bonificaciones',
        description: 'Revisa el progreso mensual de cada creador hacia sus metas de diamantes.',
      },
    },
    {
      element: '#ai-advice-btn',
      popover: {
        title: '✨ Consejos con IA',
        description: 'Genera recomendaciones personalizadas usando inteligencia artificial.',
      },
    },
  ],
  'bonificaciones': [
    {
      element: '#semaforo-grid',
      popover: {
        title: '🚦 Semáforo de Metas',
        description: '🟢 Verde = En buen ritmo | 🟡 Amarillo = Necesita apoyo | 🔴 Rojo = Urgente',
      },
    },
    {
      element: '#hitos-cards',
      popover: {
        title: '🎯 Hitos Días/Horas',
        description: 'Tres hitos a alcanzar: 12d/40h, 20d/60h, 22d/80h. Cada uno desbloquea bonos.',
      },
    },
  ],
  'supervision': [
    {
      element: '#live-panel',
      popover: {
        title: '🔴 Supervisión en Vivo',
        description: 'Monitorea en tiempo real quiénes están transmitiendo y su cumplimiento de normas.',
      },
    },
  ],
  'reclutamiento': [
    {
      element: '#prospectos-kanban',
      popover: {
        title: '🌟 Pipeline de Reclutamiento',
        description: 'Gestiona prospectos en formato Kanban: Nuevo → Contacto → Negociación → Firma.',
      },
    },
  ],
};

export function startTour(tourType: TourType) {
  const driverObj = driver({
    showProgress: true,
    steps: TOURS[tourType],
    nextBtnText: 'Siguiente →',
    prevBtnText: '← Anterior',
    doneBtnText: '✅ Entendido',
    onDestroyed: () => {
      // Marcar tour como completado
      localStorage.setItem(`tour-${tourType}-completed`, 'true');
    },
  });

  driverObj.drive();
}

export function shouldShowTour(tourType: TourType): boolean {
  return !localStorage.getItem(`tour-${tourType}-completed`);
}
