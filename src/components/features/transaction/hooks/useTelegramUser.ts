import { useMemo } from 'react';
import { useLaunchParams } from '@telegram-apps/sdk-react';
import { WebAppUser } from '@/types';

export const useTelegramUser = () => {
  const launchParams = useLaunchParams();
  
  const currentUser = useMemo(() => {
    if (launchParams.tgWebAppData && typeof launchParams.tgWebAppData === 'object') {
      return (launchParams.tgWebAppData as { user?: WebAppUser }).user;
    }
    return undefined;
  }, [launchParams.tgWebAppData]);

  return {
    currentUser,
    isAuthenticated: !!currentUser,
  };
}; 