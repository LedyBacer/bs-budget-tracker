// src/components/features/category/CategoryList.tsx
import { useState, useEffect, useMemo } from 'react';
import { useBudgets } from '@/contexts/BudgetContext';
import { Category, Transaction } from '@/types';
import * as mockApi from '@/lib/mockData';
import { formatCurrency } from '@/lib/utils';
import { Progress } from '@/components/ui/progress'; // Используем Progress из shadcn

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
  // TODO: Обработка ошибок

  useEffect(() => {
    if (currentBudget) {
      setIsLoading(true);
      Promise.all([
        mockApi.getCategoriesByBudgetId(currentBudget.id),
        mockApi.getTransactionsByBudgetId(currentBudget.id), // Загружаем и транзакции
      ])
        .then(([cats, trans]) => {
          setCategories(cats);
          setTransactions(trans);
        })
        .catch(console.error) // TODO: Улучшить обработку
        .finally(() => setIsLoading(false));
    } else {
      setCategories([]);
      setTransactions([]);
    }
  }, [currentBudget]);

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

  if (!currentBudget) {
    // Не показываем ничего, если бюджет не выбран (т.к. BudgetDetails уже покажет сообщение)
    return null;
  }

  if (isLoading) {
    return <div className="text-muted-foreground p-4 text-center">Загрузка категорий...</div>;
  }

  return (
    <div className="mb-6">
      <div className="mb-2 flex items-center justify-between px-1">
        <h3 className="text-md font-semibold">Категории бюджета:</h3>
        {/* TODO: Кнопка "Добавить Категорию" */}
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

      {categoriesWithBalance.length === 0 ? (
        <div className="text-muted-foreground bg-card rounded-lg border p-4 text-center">
          В этом бюджете еще нет категорий.
        </div>
      ) : (
        <div className="space-y-3">
          {categoriesWithBalance.map((category) => (
            <div
              key={category.id}
              className="bg-card text-card-foreground rounded-lg border p-3 text-sm"
            >
              <div className="mb-1 flex items-center justify-between">
                <span className="font-medium">{category.name}</span>
                {/* TODO: Кнопка "Редактировать" */}
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
          ))}
        </div>
      )}
    </div>
  );
}
