// src/App.tsx
import { useEffect, useState } from 'react';
import {
  useLaunchParams,
  useSignal,
  miniApp,
  backButton,
  mainButton,
  cloudStorage,
  popup, // Импортируем popup
  // viewport, // Импортируем, если нужен здесь
} from '@telegram-apps/sdk-react';
import { Button } from '@/components/ui/button'; // shadcn/ui
// import { ThemeProvider } from '@/components/theme-provider'; // Если используете shadcn theme provider

function App() {
  const launchParams = useLaunchParams();
  const [cloudValue, setCloudValue] = useState<string | null>(null);
  const [isLoadingStorage, setIsLoadingStorage] = useState(false);

  // Подписка на сигналы для отображения состояния
  const isBackButtonVisible = useSignal(backButton.isVisible);
  const mainButtonText = useSignal(mainButton.text);
  const mainButtonLoading = useSignal(mainButton.isLoaderVisible);
  const mainButtonVisible = useSignal(mainButton.isVisible);

  // Пример подписки на viewport (если нужно)
  // const viewportHeight = useSignal(viewport.height);
  // const isViewportStable = useSignal(viewport.isStable);
  // const isViewportMounted = useSignal(viewport.isMounted);

  // useEffect(() => {
  //   // Привязать CSS переменные viewport после его монтирования
  //   if (isViewportMounted && viewport.bindCssVars.isAvailable()) {
  //     viewport.bindCssVars();
  //   }
  // }, [isViewportMounted]);

  // 1. Сообщить Telegram, что приложение готово к отображению
  useEffect(() => {
    miniApp.ready(); // Вызвать как можно раньше
  }, []);

  // 2. Настройка Back Button
  useEffect(() => {
    const handleClick = () => {
      console.log('Back button clicked!');
      // Ваша логика для кнопки "назад" (например, навигация react-router)
      // history.back(); или router.back();
      popup.open({ message: 'Back action triggered!' }); // Пример реакции
    };

    backButton.show.ifAvailable();

    const cleanup = backButton.onClick.isAvailable() ? backButton.onClick(handleClick) : undefined;

    return () => {
      cleanup?.();
      // Не скрываем кнопку здесь, Telegram управляет ее видимостью
      // в зависимости от навигации или вызовов show/hide
    };
  }, []);

  // 3. Настройка Main Button
  useEffect(() => {
    const handleMainButtonClick = () => {
      console.log('Main button clicked!');
      // Действие по умолчанию - сохранить в облако
      handleSaveToCloud();

      // Пример открытия popup с подтверждением
      /*
      if (popup.open.isAvailable()) {
        popup.open({
          title: 'Confirmation',
          message: 'Save data to cloud?',
          buttons: [
            { id: 'ok', type: 'default', text: 'Yes, Save' },
            { id: 'cancel', type: 'destructive', text: 'Cancel' },
          ],
        }).then((buttonId) => {
          console.log('Popup closed, button clicked:', buttonId);
          if (buttonId === 'ok') {
            handleSaveToCloud();
          }
        });
      } else {
        // Если popup недоступен, просто выполняем действие
        handleSaveToCloud();
      }
      */
    };

    mainButton.setParams.ifAvailable({
      text: 'SAVE TIMESTAMP', // Текст кнопки
      isVisible: true, // Показываем кнопку
      isEnabled: true, // Кнопка активна
      isLoaderVisible: false, // Загрузчик выключен
    });

    const cleanup = mainButton.onClick.isAvailable()
      ? mainButton.onClick(handleMainButtonClick)
      : undefined;

    return () => {
      cleanup?.();
      // Можно скрыть кнопку при размонтировании App, если она не нужна глобально
      // mainButton.hide.ifAvailable();
    };
  }, []); // Пустой массив зависимостей - настроить один раз при монтировании App

  // 4. Функции для работы с CloudStorage (с использованием popup)
  const handleSaveToCloud = async () => {
    // Проверяем доступность методов перед использованием
    if (!cloudStorage.setItem.isAvailable() || !popup.open.isAvailable()) {
      console.warn('CloudStorage setItem or Popup open is not available');
      // Можно попробовать уведомить через console.log, если popup недоступен
      if (popup.open.isAvailable()) {
        popup.open({ title: 'Warning', message: 'Cloud Storage is not available.' });
      }
      return;
    }
    setIsLoadingStorage(true);
    mainButton.setParams.ifAvailable({ isLoaderVisible: true, isEnabled: false });
    try {
      // Пытаемся сохранить данные
      const success = await cloudStorage.setItem('myBudgetMVPKey', 'ts_' + Date.now());
      if (success) {
        popup.open({ message: 'Data saved to Cloud Storage!' }); // Уведомление об успехе
        await handleLoadFromCloud(); // Обновляем отображаемое значение
      } else {
        // Если setItem вернул false (хотя обычно он возвращает Promise<boolean>, но может быть платформо-зависимо)
        popup.open({ title: 'Error', message: 'Failed to save data (API returned false).' });
      }
    } catch (error: any) {
      // Ловим ошибки промиса
      console.error('Error saving to cloud storage:', error);
      popup.open({ title: 'Error', message: `Error saving: ${error?.message || String(error)}` });
    } finally {
      setIsLoadingStorage(false);
      mainButton.setParams.ifAvailable({ isLoaderVisible: false, isEnabled: true });
    }
  };

  const handleLoadFromCloud = async () => {
    if (!cloudStorage.getItem.isAvailable() || !popup.open.isAvailable()) {
      console.warn('CloudStorage getItem or Popup open is not available');
      return;
    }
    setIsLoadingStorage(true);
    try {
      const value = await cloudStorage.getItem('myBudgetMVPKey');
      setCloudValue(value || '(empty)'); // Отображаем '(empty)' если значение пустое
      // Можно добавить popup об успешной загрузке, если нужно
      // popup.open({ message: 'Loaded value from cloud.' });
    } catch (error: any) {
      console.error('Error loading from cloud storage:', error);
      popup.open({ title: 'Error', message: `Error loading: ${error?.message || String(error)}` });
    } finally {
      setIsLoadingStorage(false);
    }
  };

  // Загрузить значение из CloudStorage при первом монтировании компонента
  useEffect(() => {
    handleLoadFromCloud();
  }, []);

  return (
    // Оборачиваем в ThemeProvider от shadcn/ui, если он используется
    // <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
    <div className="container mx-auto flex min-h-[100vh] flex-col space-y-4 p-4">
      {' '}
      {/* Используем flex для растягивания */}
      <header>
        <h1 className="text-2xl font-bold">Budget MVP</h1>
      </header>
      <section className="flex-grow">
        {' '}
        {/* Этот блок будет растягиваться */}
        <div className="bg-card text-card-foreground mb-6 rounded-lg border p-4">
          <h2 className="mb-2 text-lg font-semibold">Launch Params:</h2>
          <pre className="bg-muted max-h-40 overflow-auto rounded p-2 text-xs">
            {JSON.stringify(launchParams, null, 2)}
          </pre>
        </div>
        <div className="bg-card text-card-foreground mb-6 rounded-lg border p-4">
          <h2 className="mb-2 text-lg font-semibold">SDK Controls Status:</h2>
          <p>Back Button Visible: {isBackButtonVisible ? '✅ Yes' : '❌ No'}</p>
          <p>Main Button Visible: {mainButtonVisible ? '✅ Yes' : '❌ No'}</p>
          <p>Main Button Text: "{mainButtonText}"</p>
          <p>Main Button Loading: {mainButtonLoading ? '⏳ Yes' : '✅ No'}</p>
          {/* <p>Viewport Height: {isViewportMounted ? `${viewportHeight}px` : 'Loading...'}</p> */}
          {/* <p>Viewport Stable: {isViewportMounted ? (isViewportStable ? '✅ Yes' : '❌ No') : 'Loading...'}</p> */}
        </div>
        <div className="bg-card text-card-foreground mb-6 rounded-lg border p-4">
          <h2 className="mb-2 text-lg font-semibold">Cloud Storage Example:</h2>
          <div className="mb-2 flex gap-2">
            <Button onClick={handleSaveToCloud} disabled={isLoadingStorage}>
              {isLoadingStorage ? 'Saving...' : 'Save Timestamp'}
            </Button>
            <Button onClick={handleLoadFromCloud} disabled={isLoadingStorage} variant="outline">
              {isLoadingStorage ? 'Loading...' : 'Reload Value'}
            </Button>
          </div>
          <p className="text-sm">
            Value from Cloud key "myBudgetMVPKey":
            <span className="bg-muted ml-1 rounded px-1 py-0.5 font-mono">
              {isLoadingStorage ? 'Loading...' : (cloudValue ?? 'null')}
            </span>
          </p>
        </div>
        {/* Здесь будет основная логика вашего MVP: списки бюджетов, категорий, транзакций */}
        <div className="bg-card text-card-foreground rounded-lg border p-4">
          <h2 className="mb-2 text-lg font-semibold">App Core Logic Placeholder</h2>
          <p className="text-muted-foreground">Budget details will be displayed here.</p>
          {/* Компоненты для отображения/добавления бюджетов/категорий/транзакций */}
        </div>
      </section>
      <footer className="text-muted-foreground mt-auto py-2 text-center text-xs">
        <Button
          onClick={() => miniApp.close()}
          variant="link"
          size="sm"
          className="text-destructive"
        >
          Close App
        </Button>
      </footer>
    </div>
    // {</ThemeProvider>}
  );
}

export default App;
