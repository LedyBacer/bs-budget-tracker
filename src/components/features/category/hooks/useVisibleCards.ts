import { useState, useEffect, useCallback, RefObject } from 'react';

export const VISIBLE_CARDS_COUNT = 3;

/**
 * Хук для определения количества видимых карточек в зависимости от размера экрана
 */
export function useVisibleCardsCount() {
  const [count, setCount] = useState(1);
  
  useEffect(() => {
    function updateCount() {
      if (window.innerWidth >= 1024) setCount(3);
      else if (window.innerWidth >= 640) setCount(2);
      else setCount(1);
    }
    updateCount();
    window.addEventListener('resize', updateCount);
    return () => window.removeEventListener('resize', updateCount);
  }, []);
  
  return count;
}

/**
 * Хук для управления пагинацией в карусели категорий
 */
export function usePagination(containerRef: RefObject<HTMLDivElement | null>, chunksLength: number) {
  const [currentPage, setCurrentPage] = useState(0);

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const scrollLeft = container.scrollLeft;
    
    // Находим первую колонку (chunk)
    const column = container.querySelector('div.flex.flex-col');
    if (!column) return;
    
    const colWidth = column.clientWidth;
    const gap = 16;
    
    // Текущая страница (округляем до ближайшей)
    const newPage = Math.round(scrollLeft / (colWidth + gap));
    if (newPage !== currentPage) {
      setCurrentPage(newPage);
    }
  }, [currentPage, containerRef]);

  // Функция для перехода к конкретной странице
  const goToPage = useCallback((index: number) => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const column = container.querySelector('div.flex.flex-col');
    if (!column) return;
    
    const colWidth = column.clientWidth;
    const gap = 16;
    
    container.scrollTo({
      left: index * (colWidth + gap),
      behavior: 'smooth'
    });
  }, [containerRef]);

  useEffect(() => {
    const container = containerRef.current;
    if (container && chunksLength > 1) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll, chunksLength, containerRef]);

  return { currentPage, goToPage };
} 