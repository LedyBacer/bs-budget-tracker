// main.tsx
import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css'; // Ваш CSS (включая Tailwind)
import { ReduxProvider } from './lib/redux/provider';

import {
  init,
  themeParams,
  miniApp,
  backButton,
  mainButton,
  swipeBehavior,
  viewport
} from '@telegram-apps/sdk-react';

// Компонент для инициализации SDK Telegram
const TelegramSDKLoader: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  useEffect(() => {
    // Настройка размеров при изменении viewport
    if (themeParams.isMounted() && viewport.isMounted()) {
      const root = document.getElementById('root')!;
      root.style.height = `${viewport.height}px`;
      root.style.width = `${viewport.width}px`;
    }
  }, []);
  
  useEffect(() => {
    console.log('CSS variables bound:', themeParams.isCssVarsBound());
  }, []);
  
  return <>{children}</>;
};

// 1. Инициализация SDK (обязательно первой)
try {
  init();

  // 2. Синхронное монтирование критичных компонентов
  // ThemeParams нужен для цветов и MainButton
  if (themeParams.mountSync.isAvailable()) {
    themeParams.mountSync();
    console.log('ThemeParams mounted:', {
      isMounted: themeParams.isMounted(),
      state: themeParams.state(),
      backgroundColor: themeParams.backgroundColor(),
      textColor: themeParams.textColor(),
      buttonColor: themeParams.buttonColor(),
      buttonTextColor: themeParams.buttonTextColor(),
      secondaryBackgroundColor: themeParams.secondaryBackgroundColor(),
      hintColor: themeParams.hintColor(),
      linkColor: themeParams.linkColor(),
      destructiveTextColor: themeParams.destructiveTextColor(),
      accentTextColor: themeParams.accentTextColor(),
    });

    // Привязываем CSS переменные после монтирования
    if (themeParams.bindCssVars.isAvailable()) {
      themeParams.bindCssVars();
      console.log('CSS variables bound:', themeParams.isCssVarsBound());
    }
  } else {
    console.warn('ThemeParams mountSync is not available');
  }
  
  // MiniApp нужен для ready(), цветов фона/шапки
  miniApp.mountSync();
  // Привязка CSS переменных miniApp
  if (miniApp.bindCssVars && miniApp.bindCssVars.isAvailable()) {
    miniApp.bindCssVars();
  }
  
  // Viewport CSS переменные 
  if (viewport.bindCssVars && viewport.bindCssVars.isAvailable()) {
    viewport.bindCssVars();
  }
  
  // Кнопки, если используются глобально или с самого начала
  backButton.mount();
  mainButton.mount();
  
  // Отключаем вертикальный свайп
  if (swipeBehavior.mount.isAvailable()) {
    swipeBehavior.mount();
    if (swipeBehavior.disableVertical.isAvailable()) {
      swipeBehavior.disableVertical();
    }
  }

  // Опционально: Асинхронное монтирование других компонентов, если нужно сразу
  if (viewport.mount.isAvailable()) {
    viewport.mount().catch(console.error); // Запустить и обработать ошибку, если будет
  }

  // 4. Монтирование React приложения
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <ReduxProvider>
        <TelegramSDKLoader>
          <App />
        </TelegramSDKLoader>
      </ReduxProvider>
    </React.StrictMode>
  );
} catch (error) {
  console.error('Failed to initialize Telegram SDK:', error);
  // Отобразить сообщение об ошибке пользователю, если нужно
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.innerHTML = 'Error initializing Telegram Mini App. Please try again later.';
  }
}
