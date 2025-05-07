import React from 'react';
import { hapticFeedback } from '@telegram-apps/sdk';
import { Button } from '@/components/ui/button'; // Импортируем оригинальную кнопку

// Определяем тип для стиля вибрации
type ImpactStyle = 'light' | 'medium' | 'heavy' | 'rigid' | 'soft';

// Расширяем пропсы ButtonProps, добавляя опциональный prop для стиля вибрации
// Используем React.ComponentProps для получения типа пропсов Button
interface HapticButtonProps extends React.ComponentProps<typeof Button> {
  impactStyle?: ImpactStyle;
}

export const HapticButton: React.FC<HapticButtonProps> = ({
  onClick,
  impactStyle = 'medium', // Стиль по умолчанию 'medium'
  children,
  ...props // Остальные пропсы передаем в оригинальную кнопку
}) => {
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    // Безопасно проверяем доступность hapticFeedback и его метода isAvailable
    try {
      if (hapticFeedback && hapticFeedback.impactOccurred && hapticFeedback.impactOccurred.isAvailable && hapticFeedback.impactOccurred.isAvailable()) {
        hapticFeedback.impactOccurred(impactStyle);
      }
    } catch (error) {
      console.error('Ошибка при использовании hapticFeedback:', error);
    }

    // Вызываем оригинальный обработчик onClick, если он был передан
    if (onClick) {
      onClick(event);
    }
  };

  return (
    <Button onClick={handleClick} {...props}>
      {children}
    </Button>
  );
};

// Можно добавить экспорт по умолчанию, если используется только этот компонент в файле
// export default HapticButton;