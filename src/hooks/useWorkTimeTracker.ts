// Hook temporalmente deshabilitado - requiere tablas user_daily_activity y user_work_goals
export const useWorkTimeTracker = (userEmail?: string) => {
  return {
    isActive: false,
    todaySeconds: 0,
    todayFormatted: "0:00:00",
    todayGoalHours: 0,
    todayProgress: 0,
    formatTime: "0:00:00",
    progress: 0,
    accumulatedSeconds: 0,
    startTimer: () => {},
    stopTimer: () => {},
    refresh: () => {},
  };
};
