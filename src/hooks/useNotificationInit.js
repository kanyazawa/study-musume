import { useEffect } from 'react';
import { initNotificationSystem } from '../utils/notificationUtils';

export const useNotificationInit = () => {
  useEffect(() => {
    initNotificationSystem();
  }, []);
};
