import { useEffect } from 'react';
import { saveStats } from '../utils/saveUtils';
import { updateTpWithRecovery } from '../utils/tpRecoveryUtils';

export const useTpRecovery = (setStats) => {
  useEffect(() => {
    setStats((currentStats) => {
      const recovery = updateTpWithRecovery(currentStats);
      if (!recovery) {
        return currentStats;
      }

      const newStats = { ...currentStats, ...recovery };
      saveStats(newStats);
      return newStats;
    });

    const interval = setInterval(() => {
      setStats((currentStats) => {
        const recovery = updateTpWithRecovery(currentStats);
        if (!recovery) {
          return currentStats;
        }

        const newStats = { ...currentStats, ...recovery };
        saveStats(newStats);
        return newStats;
      });
    }, 60 * 1000);

    return () => clearInterval(interval);
  }, [setStats]);
};
