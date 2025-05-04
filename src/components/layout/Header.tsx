import { useLaunchParams } from '@telegram-apps/sdk-react';
import { WebAppUser } from '@/types'; // Импортируем наш тип

export function Header() {
  const launchParams = useLaunchParams();
  // Типизируем пользователя, если он есть
  // @ts-expect-error
  const user =
    launchParams.tgWebAppData &&
    typeof launchParams.tgWebAppData === 'object' &&
    'user' in launchParams.tgWebAppData
      ? (launchParams.tgWebAppData.user as WebAppUser | undefined)
      : undefined;

  return (
    <header className="bg-background sticky top-0 z-10 border-b p-4">
      <div className="container mx-auto flex items-center justify-between">
        <h1 className="text-xl font-bold">Shared Budget</h1>
        {user && <div className="text-muted-foreground text-sm">Привет, {user.first_name}!</div>}
      </div>
    </header>
  );
}
