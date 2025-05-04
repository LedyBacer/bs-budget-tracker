// src/components/features/transaction/TransactionList.tsx
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useBudgets } from '@/contexts/BudgetContext';
import { Transaction, Category } from '@/types';
import * as mockApi from '@/lib/mockData';
import { formatCurrency, formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { ArrowDownCircle, ArrowUpCircle, Edit, PlusCircle } from 'lucide-react'; // Иконки для типов и редактирования
import { Button } from '@/components/ui/button';
import { TransactionForm } from './TransactionForm';

// Опционально: Интерфейс для транзакции с присоединенным именем категории
interface TransactionWithCategoryName extends Transaction {
  categoryName?: string;
}

export function TransactionList() {
  const { currentBudget } = useBudgets();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false); // Состояние диалога формы
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null); // Для редактирования
  // TODO: Обработка ошибок

  // useCallback для загрузки данных
  const loadData = useCallback(async () => {
    if (!currentBudget) return;
    setIsLoading(true);
    try {
      const [trans, cats] = await Promise.all([
        mockApi.getTransactionsByBudgetId(currentBudget.id),
        mockApi.getCategoriesByBudgetId(currentBudget.id),
      ]);
      setTransactions(trans);
      setCategories(cats);
    } catch (error) {
      console.error('Failed to load transactions/categories:', error);
      // TODO: Показать ошибку
    } finally {
      setIsLoading(false);
    }
  }, [currentBudget]);

  useEffect(() => {
    loadData();
  }, [loadData]); // Зависимость от loadData (-> currentBudget)

  // Открытие формы добавления
  const handleAddTransaction = () => {
    setTransactionToEdit(null);
    setIsFormOpen(true);
  };

  // Открытие формы редактирования (передаем транзакцию)
  const handleEditTransaction = (transaction: Transaction) => {
    setTransactionToEdit(transaction);
    setIsFormOpen(true);
  };

  // Колбэк после сохранения - перезагружаем данные
  const handleTransactionSaved = () => {
    loadData(); // loadData теперь перезагружает и транзакции, и категории
    // TODO: Идеально было бы обновить состояние BudgetDetails тоже.
    // Можно попробовать обновить BudgetContext, если вынести
    // загрузку транзакций для расчета баланса туда.
    // Пока оставим так, CategoryList обновится. BudgetDetails - нет.
  };

  // Добавляем имена категорий к транзакциям для удобного отображения
  const transactionsWithDetails: TransactionWithCategoryName[] = useMemo(() => {
    const categoryMap = new Map(categories.map((cat) => [cat.id, cat.name]));
    return transactions.map((t) => ({
      ...t,
      categoryName: categoryMap.get(t.categoryId) || 'Без категории', // Имя категории или заглушка
    }));
  }, [transactions, categories]);

  if (!currentBudget) {
    // Ничего не показываем, если бюджет не выбран
    return null;
  }

  if (isLoading) {
    return <div className="text-muted-foreground p-4 text-center">Загрузка транзакций...</div>;
  }

  return (
    <div className="mb-6">
      <div className="mb-3 flex items-center justify-between px-1">
        <h3 className="text-md font-semibold">Последние транзакции:</h3>
        <Button variant="ghost" size="sm" onClick={handleAddTransaction}>
          <PlusCircle className="mr-1 h-4 w-4" />
          Добавить
        </Button>
      </div>

      {transactionsWithDetails.length === 0 ? (
        <div className="text-muted-foreground bg-card rounded-lg border p-4 text-center">
          Транзакций по этому бюджету еще нет.
        </div>
      ) : (
        <div className="space-y-2">
          {/* Отображаем, например, последние 5 транзакций */}
          {transactionsWithDetails.slice(0, 5).map((transaction) => (
            <div
              key={transaction.id}
              className="bg-card text-card-foreground group flex items-center justify-between rounded-lg border p-3 text-sm"
            >
              <div className="flex items-center space-x-3">
                {transaction.type === 'expense' ? (
                  <ArrowDownCircle className="h-5 w-5 flex-shrink-0 text-red-500" />
                ) : (
                  <ArrowUpCircle className="h-5 w-5 flex-shrink-0 text-green-500" />
                )}
                <div>
                  <div className="font-medium">
                    {transaction.name ||
                      transaction.categoryName ||
                      (transaction.type === 'expense' ? 'Расход' : 'Пополнение')}
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {transaction.categoryName} • {transaction.author.first_name} •{' '}
                    {formatDate(transaction.createdAt, { month: 'short', day: 'numeric' })}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span
                  className={cn(
                    'font-semibold',
                    transaction.type === 'expense' ? 'text-red-600' : 'text-green-600'
                  )}
                >
                  {transaction.type === 'expense' ? '-' : '+'}
                  {formatCurrency(transaction.amount)}
                </span>
                {/* Кнопка редактирования */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={() => handleEditTransaction(transaction)}
                  aria-label="Редактировать транзакцию"
                >
                  <Edit className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
          {/* Показываем кнопку "Показать все", если транзакций больше 5 */}
          {transactions.length > 5 && (
            <div className="mt-3 text-center">
              <Button variant="link" size="sm">
                Показать все транзакции ({transactions.length})
              </Button>
              {/* TODO: Реализовать переход на отдельную страницу/разворачивание списка */}
            </div>
          )}
          {/* Диалоговое окно формы транзакции */}
          {currentBudget && (
            <TransactionForm
              budgetId={currentBudget.id}
              transactionToEdit={transactionToEdit}
              open={isFormOpen}
              onOpenChange={setIsFormOpen}
              onTransactionSaved={handleTransactionSaved}
            />
          )}
        </div>
      )}
    </div>
  );
}
