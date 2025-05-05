// main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css'; // Ваш CSS (включая Tailwind)

import {
  init,
  themeParams,
  miniApp,
  backButton,
  mainButton,
  swipeBehavior,
  // viewport, // Если нужен сразу viewport, но он монтируется асинхронно
} from '@telegram-apps/sdk-react';

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
  // if (viewport.mount.isAvailable()) {
  //   viewport.mount().catch(console.error); // Запустить и обработать ошибку, если будет
  // }

  // 4. Монтирование React приложения
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
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
