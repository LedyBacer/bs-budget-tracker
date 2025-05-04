// src/components/features/budget/BudgetDetails.tsx
import { useState, useEffect, useMemo } from 'react';
import { useBudgets } from '@/contexts/BudgetContext';
import { Transaction } from '@/types';
import * as mockApi from '@/lib/mockData';
import { formatCurrency } from '@/lib/utils';

export function BudgetDetails() {
  const { currentBudget } = useBudgets();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  // TODO: Обработка ошибок загрузки транзакций

  useEffect(() => {
    // Загружаем транзакции при смене выбранного бюджета
    if (currentBudget) {
      setIsLoadingTransactions(true);
      mockApi
        .getTransactionsByBudgetId(currentBudget.id)
        .then(setTransactions)
        .catch(console.error) // TODO: Улучшить обработку ошибок
        .finally(() => setIsLoadingTransactions(false));
    } else {
      setTransactions([]); // Сбрасываем транзакции, если бюджет не выбран
    }
  }, [currentBudget]); // Зависимость от currentBudget

  // Расчет остатка бюджета с использованием useMemo для оптимизации
  const budgetBalance = useMemo(() => {
    if (!currentBudget) return 0;

    const totalExpenses = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalIncome = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    return currentBudget.totalAmount - totalExpenses + totalIncome;
  }, [currentBudget, transactions]); // Зависит от бюджета и его транзакций

  if (!currentBudget) {
    return (
      <div className="text-muted-foreground p-4 text-center">
        Выберите бюджет для просмотра деталей.
      </div>
    );
  }

  return (
    <div className="bg-card text-card-foreground mb-6 rounded-lg border p-4">
      <h3 className="mb-3 text-lg font-semibold">Детали бюджета: "{currentBudget.name}"</h3>
      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Общая сумма:</span>
          <span className="font-medium">{formatCurrency(currentBudget.totalAmount)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Текущий остаток:</span>
          {isLoadingTransactions ? (
            <span className="text-muted-foreground text-xs">Расчет...</span>
          ) : (
            <span className="text-lg font-bold">{formatCurrency(budgetBalance)}</span>
          )}
        </div>
      </div>
    </div>
  );
}
