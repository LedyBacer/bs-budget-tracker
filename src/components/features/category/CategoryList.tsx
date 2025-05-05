// src/components/features/category/CategoryList.tsx
import { useState, useEffect, useMemo, useCallback } from 'react'; // Добавили useCallback
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

interface CategoryWithBalance extends Category {
  spent: number;
  balance: number;
  progress: number; // Процент потраченного от лимита
}

export function CategoryList() {
  const { currentBudget } = useBudgets();
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false); // Состояние для диалога
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null); // Для редактирования
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null); // Добавили

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
      const spent = categoryTransactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      const income = categoryTransactions // Учитываем и пополнения ВНУТРИ категории
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

      const balance = category.limit - spent + income;
      // Прогресс считаем только от расходов относительно лимита
      const progress =
        category.limit > 0 ? Math.min(100, Math.max(0, (spent / category.limit) * 100)) : 0;

      return {
        ...category,
        spent,
        balance,
        progress,
      };
    });
  }, [categories, transactions]);

  // Общая сумма лимитов по категориям
  const totalLimits = useMemo(() => {
    return categories.reduce((sum, cat) => sum + cat.limit, 0);
  }, [categories]);

  // Функция для переключения раскрытого элемента
  const handleToggleExpand = (categoryId: string) => {
    mediumHaptic();
    setExpandedCategoryId((prevId) => (prevId === categoryId ? null : categoryId));
  };

  if (!currentBudget) return null;

  if (isLoading && categories.length === 0) {
    // Показываем загрузку только если список пуст
    return <div className="text-muted-foreground p-4 text-center">Загрузка категорий...</div>;
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
        <div className="space-y-2">
          {categoriesWithBalance.map((category) => (
            <React.Fragment key={category.id}>
              <ExpandableItem
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
                          aria-label="Удалить категорию"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Удалить
                        </HapticButton>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Удалить категорию?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Вы уверены, что хотите удалить категорию "{category.name}"? Это
                            действие нельзя будет отменить. Категорию можно удалить, только если по ней
                            нет транзакций.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel onClick={(e) => { e.stopPropagation(); setCategoryToDelete(null); }}>
                            Отмена
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={async (e) => {
                              e.stopPropagation();
                              await handleDeleteCategory();
                            }}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Удалить
                          </AlertDialogAction>
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
                      aria-label="Редактировать категорию"
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Редактировать
                    </HapticButton>
                  </div>
                }
              >
                <div
                  className="bg-card text-card-foreground group relative rounded-lg border p-3 text-sm"
                >
                  <div className="mb-1 flex items-center justify-between pr-8">
                    <span className="font-medium">{category.name}</span>
                    <span className="text-muted-foreground text-xs">
                      Лимит: {formatCurrency(category.limit)}
                    </span>
                  </div>
                  <Progress value={category.progress} className="mb-1 h-2" />
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      Расход: {formatCurrency(category.spent)}
                    </span>
                    <span className={`font-semibold ${category.balance < 0 ? 'text-destructive' : ''}`}>
                      Остаток: {formatCurrency(category.balance)}
                    </span>
                  </div>
                </div>
              </ExpandableItem>
            </React.Fragment>
          ))}
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
