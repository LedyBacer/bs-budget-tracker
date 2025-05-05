// src/components/features/transaction/TransactionList.tsx
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useBudgets } from '@/contexts/BudgetContext';
import { Transaction, Category, WebAppUser } from '@/types';
import * as mockApi from '@/lib/mockData';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
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
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);
  // TODO: Обработка ошибок

  // --- ЛОГ МОНТИРОВАНИЯ/РАЗМОНТИРОВАНИЯ ---
  useEffect(() => {
    console.log(`TransactionList MOUNTED for budget: ${currentBudget?.id}`);
    return () => {
      console.log(`TransactionList UNMOUNTED for budget: ${currentBudget?.id}`);
    };
  }, [currentBudget]); // Зависимость от currentBudget покажет пересоздание при его смене
  // --- КОНЕЦ ЛОГА ---

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
    console.log('TransactionList: Effect running, currentBudget:', currentBudget?.id);
    loadData();
  }, [currentBudget?.id, loadData]);

  // Открытие формы добавления
  const handleAddTransaction = () => {
    console.log('TransactionList: handleAddTransaction called'); // <-- ЛОГ 1
    setTransactionToEdit(null);
    setIsFormOpen(true); // <-- Установка состояния
    console.log('TransactionList: isFormOpen should be true now'); // <-- ЛОГ 2
  };

  // Открытие формы редактирования (передаем транзакцию)
  const handleEditTransaction = (transaction: Transaction) => {
    console.log('TransactionList: handleEditTransaction called for', transaction.id);
    setTransactionToEdit(transaction);
    setIsFormOpen(true);
  };

  // Колбэк после сохранения
  const handleTransactionSaved = () => {
    console.log('TransactionList: handleTransactionSaved called');
    loadData(); // loadData теперь перезагружает и транзакции, и категории
    // Явно перезагрузим категории для формы на всякий случай
    // (Это может быть избыточно, если loadData уже это делает надежно)
    if (currentBudget) {
      mockApi.getCategoriesByBudgetId(currentBudget.id).then((cats) => {
        // Как передать эти cats в TransactionForm? Никак напрямую.
        // Это подтверждает, что форма ДОЛЖНА сама грузить актуальные категории при открытии.
        console.log('Categories reloaded after save (for debug):', cats.length);
      });
    }
  };

  console.log(
    'TransactionList: Rendering. isFormOpen:',
    isFormOpen,
    'currentBudget:',
    currentBudget?.id
  ); // Лог 3

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
        {/* Проверяем обработчик кнопки */}
        <Button variant="ghost" size="sm" onClick={handleAddTransaction} disabled={isLoading}>
          <PlusCircle className="mr-1 h-4 w-4" />
          Добавить
        </Button>
      </div>

      {/* Список транзакций */}
      {isLoading && transactions.length === 0 ? (
        <div className="text-muted-foreground p-4 text-center">Загрузка транзакций...</div>
      ) : transactionsWithDetails.length === 0 ? (
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
                  className="h-6 w-6 opacity-50 hover:opacity-100"
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
        </div>
      )}

      {/* Диалоговое окно формы транзакции - теперь всегда доступно */}
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
  );
}
