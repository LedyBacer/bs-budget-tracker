// src/components/theme-provider.tsx
import { createContext, useContext, useEffect, useState } from 'react';
import { themeParams, useSignal } from '@telegram-apps/sdk-react';

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: string;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: string;
  setTheme: (theme: string) => void;
};

const initialState: ThemeProviderState = {
  theme: 'system',
  setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'vite-ui-theme',
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState(() => localStorage.getItem(storageKey) || defaultTheme);
  // Отслеживаем изменения состояния темы Telegram
  const themeState = useSignal(themeParams.state);

  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';

      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }

    // Применяем цвета из Telegram темы
    const applyTelegramColors = () => {
      try {
        // Проверяем, что ThemeParams смонтирован
        if (!themeParams.isMounted()) {
          console.warn('ThemeParams is not mounted yet');
          return;
        }

        // Получаем отдельные цвета
        const backgroundColor = themeParams.backgroundColor();
        const textColor = themeParams.textColor();
        const buttonColor = themeParams.buttonColor();
        const buttonTextColor = themeParams.buttonTextColor();
        const secondaryBackgroundColor = themeParams.secondaryBackgroundColor();
        const hintColor = themeParams.hintColor();
        const linkColor = themeParams.linkColor();
        const destructiveTextColor = themeParams.destructiveTextColor();
        const accentTextColor = themeParams.accentTextColor();

        // Логируем все доступные цвета
        console.log('Telegram Theme Colors:', {
          backgroundColor,
          textColor,
          buttonColor,
          buttonTextColor,
          secondaryBackgroundColor,
          hintColor,
          linkColor,
          destructiveTextColor,
          accentTextColor,
        });

        // Функция для применения цвета
        const applyColor = (color: string | undefined, cssVar: string) => {
          if (color) {
            console.log(`Applying ${cssVar}: ${color}`);
            root.style.setProperty(cssVar, color);
          }
        };

        // Основные цвета
        applyColor(backgroundColor, '--background');
        applyColor(secondaryBackgroundColor, '--card');
        applyColor(secondaryBackgroundColor, '--popover');
        applyColor(secondaryBackgroundColor, '--muted');
        applyColor(backgroundColor, '--border');
        
        // Определяем, темная ли тема
        const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
        
        // Затемняем поля ввода
        const inputBackground = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
        root.style.setProperty('--input', inputBackground);
        if (textColor) {
          root.style.setProperty('--input-foreground', textColor);
        }
        
        // Затемняем выпадающие списки и меню
        root.style.setProperty('--select-background', inputBackground);
        if (textColor) {
          root.style.setProperty('--select-foreground', textColor);
        }
        
        // Затемняем чекбоксы и радио-кнопки
        root.style.setProperty('--checkbox-background', inputBackground);
        if (textColor) {
          root.style.setProperty('--checkbox-foreground', textColor);
        }
        
        applyColor(textColor, '--foreground');
        applyColor(textColor, '--card-foreground');
        
        applyColor(buttonColor, '--primary');
        applyColor(buttonColor, '--ring');
        
        applyColor(buttonTextColor, '--primary-foreground');
        
        applyColor(secondaryBackgroundColor, '--secondary');
        
        applyColor(hintColor, '--muted-foreground');
        
        applyColor(linkColor, '--link');
        
        applyColor(destructiveTextColor, '--destructive');
        
        applyColor(accentTextColor, '--accent');

        // Применяем дополнительные цвета для темной/светлой темы
        if (isDark) {
          // Дополнительные цвета для темной темы
          root.style.setProperty('--destructive-foreground', '#ffffff');
          root.style.setProperty('--accent-foreground', '#ffffff');
          root.style.setProperty('--popover-foreground', '#ffffff');
          
          // Тени и бордеры для темной темы
          root.style.setProperty('--border', 'rgba(255, 255, 255, 0.1)');
          root.style.setProperty('--shadow-sm', '0 1px 2px 0 rgba(0, 0, 0, 0.3)');
          root.style.setProperty('--shadow', '0 1px 3px 0 rgba(0, 0, 0, 0.4), 0 1px 2px -1px rgba(0, 0, 0, 0.4)');
          root.style.setProperty('--shadow-md', '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -2px rgba(0, 0, 0, 0.4)');
          root.style.setProperty('--shadow-lg', '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -4px rgba(0, 0, 0, 0.4)');
        } else {
          // Дополнительные цвета для светлой темы
          root.style.setProperty('--destructive-foreground', '#ffffff');
          root.style.setProperty('--accent-foreground', '#ffffff');
          root.style.setProperty('--popover-foreground', '#000000');
          
          // Тени и бордеры для светлой темы
          root.style.setProperty('--border', 'rgba(0, 0, 0, 0.1)');
          root.style.setProperty('--shadow-sm', '0 1px 2px 0 rgba(0, 0, 0, 0.05)');
          root.style.setProperty('--shadow', '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)');
          root.style.setProperty('--shadow-md', '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)');
          root.style.setProperty('--shadow-lg', '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)');
        }

        root.style.setProperty('--radius', '0.5rem');

        // Логируем все установленные CSS переменные
        console.log('Applied CSS Variables:', {
          background: getComputedStyle(root).getPropertyValue('--background'),
          foreground: getComputedStyle(root).getPropertyValue('--foreground'),
          primary: getComputedStyle(root).getPropertyValue('--primary'),
          'primary-foreground': getComputedStyle(root).getPropertyValue('--primary-foreground'),
          secondary: getComputedStyle(root).getPropertyValue('--secondary'),
          muted: getComputedStyle(root).getPropertyValue('--muted'),
          accent: getComputedStyle(root).getPropertyValue('--accent'),
          destructive: getComputedStyle(root).getPropertyValue('--destructive'),
        });
      } catch (error) {
        console.warn('Failed to apply Telegram theme colors:', error);
      }
    };

    // Применяем цвета сразу
    applyTelegramColors();
  }, [theme, themeState]); // Добавляем themeState в зависимости

  const value = {
    theme,
    setTheme: (theme: string) => {
      localStorage.setItem(storageKey, theme);
      setTheme(theme);
    },
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined) throw new Error('useTheme must be used within a ThemeProvider');

  return context;
};
