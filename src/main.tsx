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
  // viewport, // Если нужен сразу viewport, но он монтируется асинхронно
} from '@telegram-apps/sdk-react';

// 1. Инициализация SDK (обязательно первой)
try {
  init();

  // 2. Синхронное монтирование критичных компонентов
  // ThemeParams нужен для цветов и MainButton
  themeParams.mountSync();
  // MiniApp нужен для ready(), цветов фона/шапки
  miniApp.mountSync();
  // Кнопки, если используются глобально или с самого начала
  backButton.mount();
  mainButton.mount();

  // Опционально: Асинхронное монтирование других компонентов, если нужно сразу
  // if (viewport.mount.isAvailable()) {
  //   viewport.mount().catch(console.error); // Запустить и обработать ошибку, если будет
  // }

  // 3. Привязка CSS переменных (после монтирования ThemeParams и MiniApp)
  // Важно для shadcn/ui тем и общего стиля
  if (themeParams.bindCssVars.isAvailable()) {
    themeParams.bindCssVars();
  }
  if (miniApp.bindCssVars.isAvailable()) {
    miniApp.bindCssVars();
  }
  // if (viewport.bindCssVars.isAvailable()) {
  //  // Вызывать после монтирования viewport, если CSS переменные для него нужны
  //  viewport.bindCssVars();
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
