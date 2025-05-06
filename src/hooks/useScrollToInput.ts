import { useEffect, useRef } from 'react';

interface UseScrollToInputProps {
  isOpen: boolean;
}

export function useScrollToInput({ isOpen }: UseScrollToInputProps) {
  const spacerRef = useRef<HTMLDivElement | null>(null);
  const hasHadFocusRef = useRef(false);

  useEffect(() => {
    // Сбрасываем флаг при открытии модального окна
    if (isOpen) {
      hasHadFocusRef.current = false;
    }

    // Создаем или удаляем спейсер в зависимости от состояния isOpen
    if (isOpen && !spacerRef.current) {
      const spacer = document.createElement('div');
      spacer.style.height = '100vh';
      spacer.style.width = '1px';
      spacer.style.position = 'absolute';
      spacer.style.bottom = '-100vh';
      spacer.style.left = '0';
      document.body.appendChild(spacer);
      spacerRef.current = spacer;
    } else if (!isOpen && spacerRef.current) {
      document.body.removeChild(spacerRef.current);
      spacerRef.current = null;
    }

    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        // Даем небольшую задержку для появления клавиатуры
        setTimeout(() => {
          // Проверяем, находится ли элемент в видимой области
          const rect = target.getBoundingClientRect();
          const isInViewport = (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= window.innerHeight &&
            rect.right <= window.innerWidth
          );

          // Если элемент не в видимой области или это первый фокус
          if (!isInViewport || !hasHadFocusRef.current) {
            target.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }

          // Отмечаем, что фокус уже был
          hasHadFocusRef.current = true;
        }, 100);
      }
    };

    // Используем focusin вместо focus для более раннего срабатывания
    document.addEventListener('focusin', handleFocus, true);

    return () => {
      document.removeEventListener('focusin', handleFocus, true);
      // Удаляем спейсер при размонтировании
      if (spacerRef.current) {
        document.body.removeChild(spacerRef.current);
        spacerRef.current = null;
      }
    };
  }, [isOpen]); // Добавляем isOpen в зависимости
} 