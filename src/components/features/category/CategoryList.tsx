// src/components/features/category/CategoryList.tsx
import { useState, useEffect, useMemo, useCallback, useRef } from 'react'; // Добавили useCallback и useRef
import { useBudgets } from '@/contexts/BudgetContext';
import { Category, Transaction } from '@/types';
import * as mockApi from '@/lib/mockData';
import { formatCurrency, mediumHaptic } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { HapticButton } from '@/components/ui/haptic-button';
import { Pencil, PlusCircle } from 'lucide-react'; // Иконки
import { CategoryForm } from './CategoryForm'; // Импортируем форму
import { Trash2 } from 'lucide-react'; // Добавить иконку
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { ExpandableItem } from '@/components/ui/expandable-item';
import React from 'react';
import { CategoryListSkeleton } from '@/components/ui/skeletons';

interface CategoryWithBalance extends Category {
  progress: number; // Процент потраченного от лимита
  transactionCount: number; // Добавляем количество транзакций
}

// Хук для определения количества видимых карточек
function useVisibleCardsCount() {
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

// Вспомогательная функция для чанков
function chunkArray<T>(arr: T[], size: number): T[][] {
  const res: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    res.push(arr.slice(i, i + size));
  }
  return res;
}

export function CategoryList() {
  const { currentBudget } = useBudgets();
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false); // Состояние для диалога
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null); // Для редактирования
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const visibleCardsCount = 3; // теперь всегда 3 вертикально

  // Функция для переключения раскрытого элемента
  const handleToggleExpand = (categoryId: string) => {
    mediumHaptic();
    setExpandedCategoryId((prevId) => (prevId === categoryId ? null : categoryId));
  };

  const loadData = useCallback(async () => {
    if (!currentBudget) return;
    setIsLoading(true);
    try {
      const [cats, trans] = await Promise.all([
        mockApi.getCategoriesByBudgetId(currentBudget.id),
        mockApi.getTransactionsByBudgetId(currentBudget.id),
      ]);
      setCategories(cats);
      setTransactions(trans);
    } catch (error) {
      console.error('Failed to load categories/transactions:', error);
      // TODO: Уведомление об ошибке
    } finally {
      setIsLoading(false);
    }
  }, [currentBudget]); // Зависимость от currentBudget

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;
    console.log('Deleting category', categoryToDelete.id);
    try {
      await mockApi.deleteCategory(categoryToDelete.id);
      handleCategorySaved(); // Перезагружаем данные
    } catch (error: any) {
      console.error('Failed to delete category:', error);
      // TODO: Показать ошибку пользователю (например, через popup)
      alert(`Ошибка удаления: ${error.message}`);
    } finally {
      setCategoryToDelete(null); // Сбрасываем ID
    }
  };

  useEffect(() => {
    loadData();
  }, [loadData]); // Запускаем при монтировании и при изменении loadData (т.е. currentBudget)

  // Функция для открытия формы добавления
  const handleAddCategoryClick = () => {
    setCategoryToEdit(null); // Убедимся, что режим не редактирования
    setIsFormOpen(true);
  };

  // Функция для открытия формы редактирования
  const handleEditCategoryClick = (category: Category) => {
    setCategoryToEdit(category);
    setIsFormOpen(true);
  };

  // Колбэк после сохранения категории (перезагружаем данные)
  const handleCategorySaved = () => {
    loadData(); // Перезагружаем список категорий и транзакций
  };

  // Рассчитываем балансы и прогресс для каждой категории
  const categoriesWithBalance: CategoryWithBalance[] = useMemo(() => {
    return categories.map((category) => {
      const categoryTransactions = transactions.filter((t) => t.categoryId === category.id);
      // Прогресс считаем только от расходов относительно лимита
      const progress =
        category.limit > 0 ? Math.min(100, Math.max(0, (category.balance / category.limit) * 100)) : 0;

      return {
        ...category,
        progress,
        transactionCount: categoryTransactions.length, // Добавляем количество транзакций
      };
    }).sort((a, b) => b.transactionCount - a.transactionCount); // Сортируем по количеству транзакций
  }, [categories, transactions]);

  // Чанкируем категории для горизонтального скролла
  const categoryChunks = useMemo(() => chunkArray(categoriesWithBalance, visibleCardsCount), [categoriesWithBalance]);

  // Общая сумма лимитов по категориям
  const totalLimits = useMemo(() => {
    return categories.reduce((sum, cat) => sum + cat.limit, 0);
  }, [categories]);

  // Функция для определения текущей страницы при скролле
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
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
  }, [currentPage]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container && categoryChunks.length > 1) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll, categoryChunks.length]);

  if (!currentBudget) return null;

  if (isLoading && categories.length === 0) {
    return <CategoryListSkeleton />;
  }

  return (
    <div className="mb-6">
      <div className="mb-3 flex items-center justify-between px-1">
        <h3 className="text-md font-semibold">Категории бюджета:</h3>
        <HapticButton variant="ghost" size="sm" onClick={handleAddCategoryClick}>
          <PlusCircle className="mr-1 h-4 w-4" />
          Добавить
        </HapticButton>
      </div>

      {/* Предупреждение о сумме лимитов */}
      {currentBudget && totalLimits > currentBudget.totalAmount && (
        <div className="text-destructive bg-destructive/10 mb-3 rounded-md p-2 text-xs">
          Внимание! Сумма лимитов по категориям ({formatCurrency(totalLimits)}) превышает общую
          сумму бюджета ({formatCurrency(currentBudget.totalAmount)}).
        </div>
      )}
      {currentBudget && totalLimits < currentBudget.totalAmount && categories.length > 0 && (
        <div className="text-muted-foreground bg-secondary mb-3 rounded-md p-2 text-xs">
          Нераспределенный остаток бюджета:{' '}
          {formatCurrency(currentBudget.totalAmount - totalLimits)}
        </div>
      )}

      {categoriesWithBalance.length === 0 && !isLoading ? (
        <div className="text-muted-foreground bg-card rounded-lg border p-4 text-center">
          В этом бюджете еще нет категорий. Нажмите "Добавить".
        </div>
      ) : isLoading && categoriesWithBalance.length === 0 ? (
        <div className="text-muted-foreground p-4 text-center">Загрузка...</div>
      ) : (
        <div className="relative">
          {categoriesWithBalance.length <= 3 ? (
            <div className="flex flex-col gap-2 w-full">
              {categoriesWithBalance.map((category) => (
                <ExpandableItem
                  key={category.id}
                  isExpanded={expandedCategoryId === category.id}
                  onToggle={() => handleToggleExpand(category.id)}
                  actions={
                    <div className="flex w-full items-stretch gap-1">
                      <AlertDialog
                        open={!!categoryToDelete && categoryToDelete.id === category.id}
                        onOpenChange={(open) => !open && setCategoryToDelete(null)}
                      >
                        <AlertDialogTrigger asChild>
                          <HapticButton
                            variant="ghost"
                            size="sm"
                            className="flex-1 rounded-md border border-border text-destructive hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCategoryToDelete(category);
                            }}
                          >
                            <Trash2 className="mr-1 h-4 w-4" />
                            Удалить
                          </HapticButton>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Удалить категорию?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Это действие нельзя отменить. Все транзакции в этой категории будут удалены.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Отмена</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteCategory}>Удалить</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      <HapticButton
                        variant="ghost"
                        size="sm"
                        className="flex-1 rounded-md border border-border"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditCategoryClick(category);
                        }}
                      >
                        <Pencil className="mr-1 h-4 w-4" />
                        Изменить
                      </HapticButton>
                    </div>
                  }
                >
                  <div className="bg-card text-card-foreground group relative rounded-lg border p-3 text-sm h-full">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="font-medium">{category.name}</span>
                      <span className="text-muted-foreground text-xs">
                        Лимит: {formatCurrency(category.limit)}
                      </span>
                    </div>
                    <Progress value={category.progress} className="mb-1 h-2" />
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          Баланс:
                        </span>
                        <span className={`font-semibold ${category.balance < 0 ? 'text-destructive' : ''}`}>
                          {formatCurrency(category.balance)}
                        </span>
                      </div>
                      <div className={cn(
                        "grid grid-rows-[0fr] transition-all duration-300 ease-in-out",
                        expandedCategoryId === category.id && "grid-rows-[1fr]"
                      )}>
                        <div className="overflow-hidden">
                          <div className="flex flex-col gap-1 pt-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">
                                Расходы:
                              </span>
                              <span className="font-semibold text-destructive">
                                {formatCurrency(category.spent)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">
                                Доходы:
                              </span>
                              <span className="font-semibold text-green-600">
                                {formatCurrency(category.income)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </ExpandableItem>
              ))}
            </div>
          ) : (
            <>
              <div
                ref={scrollContainerRef}
                className="flex flex-nowrap space-x-4 overflow-x-auto pb-4 w-full snap-x snap-mandatory"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {categoryChunks.map((chunk, chunkIdx) => (
                  <div
                    key={chunkIdx}
                    className="min-w-[320px] max-w-[340px] flex-shrink-0 snap-start flex flex-col gap-2"
                  >
                    {chunk.map((category) => (
                      <ExpandableItem
                        key={category.id}
                        isExpanded={expandedCategoryId === category.id}
                        onToggle={() => handleToggleExpand(category.id)}
                        actions={
                          <div className="flex w-full items-stretch gap-1">
                            <AlertDialog
                              open={!!categoryToDelete && categoryToDelete.id === category.id}
                              onOpenChange={(open) => !open && setCategoryToDelete(null)}
                            >
                              <AlertDialogTrigger asChild>
                                <HapticButton
                                  variant="ghost"
                                  size="sm"
                                  className="flex-1 rounded-md border border-border text-destructive hover:text-destructive"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setCategoryToDelete(category);
                                  }}
                                >
                                  <Trash2 className="mr-1 h-4 w-4" />
                                  Удалить
                                </HapticButton>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Удалить категорию?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Это действие нельзя отменить. Все транзакции в этой категории будут удалены.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Отмена</AlertDialogCancel>
                                  <AlertDialogAction onClick={handleDeleteCategory}>Удалить</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                            <HapticButton
                              variant="ghost"
                              size="sm"
                              className="flex-1 rounded-md border border-border"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditCategoryClick(category);
                              }}
                            >
                              <Pencil className="mr-1 h-4 w-4" />
                              Изменить
                            </HapticButton>
                          </div>
                        }
                      >
                        <div className="bg-card text-card-foreground group relative rounded-lg border p-3 text-sm h-full">
                          <div className="mb-1 flex items-center justify-between">
                            <span className="font-medium">{category.name}</span>
                            <span className="text-muted-foreground text-xs">
                              Лимит: {formatCurrency(category.limit)}
                            </span>
                          </div>
                          <Progress value={category.progress} className="mb-1 h-2" />
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">
                                Баланс:
                              </span>
                              <span className={`font-semibold ${category.balance < 0 ? 'text-destructive' : ''}`}>
                                {formatCurrency(category.balance)}
                              </span>
                            </div>
                            <div className={cn(
                              "grid grid-rows-[0fr] transition-all duration-300 ease-in-out",
                              expandedCategoryId === category.id && "grid-rows-[1fr]"
                            )}>
                              <div className="overflow-hidden">
                                <div className="flex flex-col gap-1 pt-1">
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground">
                                      Расходы:
                                    </span>
                                    <span className="font-semibold text-destructive">
                                      {formatCurrency(category.spent)}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground">
                                      Доходы:
                                    </span>
                                    <span className="font-semibold text-green-600">
                                      {formatCurrency(category.income)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </ExpandableItem>
                    ))}
                  </div>
                ))}
              </div>
              <div className="flex justify-center gap-1 mt-2">
                {Array.from({ length: categoryChunks.length }).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      if (!scrollContainerRef.current) return;
                      const container = scrollContainerRef.current;
                      const column = container.querySelector('div.flex.flex-col');
                      if (!column) return;
                      const colWidth = column.clientWidth;
                      const gap = 16;
                      container.scrollTo({
                        left: index * (colWidth + gap),
                        behavior: 'smooth'
                      });
                    }}
                    className="h-2 w-2 rounded-full transition-colors duration-200"
                    style={{
                      backgroundColor: index === currentPage ? 'var(--primary)' : 'var(--border)'
                    }}
                    aria-label={`Перейти к странице ${index + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Диалоговое окно формы */}
      {currentBudget && (
        <CategoryForm
          budgetId={currentBudget.id}
          categoryToEdit={categoryToEdit}
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          onCategorySaved={handleCategorySaved}
        />
      )}
    </div>
  );
}
