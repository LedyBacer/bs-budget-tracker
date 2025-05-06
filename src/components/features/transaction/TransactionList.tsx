// src/components/features/transaction/TransactionList.tsx
import { useState, useEffect, useMemo, useCallback, forwardRef, useImperativeHandle, useRef } from 'react';
import { useBudgets } from '@/contexts/BudgetContext';
import { Transaction, Category, WebAppUser } from '@/types';
import * as mockApi from '@/lib/mockData';
import { formatCurrency, formatDate, cn, mediumHaptic } from '@/lib/utils';
import { ArrowDownCircle, ArrowUpCircle, Edit, PlusCircle, Trash2 } from 'lucide-react'; // Иконки для типов и редактирования, добавляем иконку Trash2
import { HapticButton } from '@/components/ui/haptic-button';
import { TransactionForm } from './TransactionForm';
import { ExpandableItem } from '@/components/ui/expandable-item';
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
import { TransactionListSkeleton } from '@/components/ui/skeletons';
import { useInView } from 'react-intersection-observer';
import { format, isToday, isYesterday, isThisYear, differenceInDays } from 'date-fns';
import { ru } from 'date-fns/locale';

// Опционально: Интерфейс для транзакции с присоединенным именем категории
interface TransactionWithCategoryName extends Transaction {
  categoryName?: string;
}

export interface TransactionListRef {
  loadData: () => Promise<void>;
}

export const TransactionList = forwardRef<TransactionListRef>((_, ref) => {
  const { currentBudget } = useBudgets();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);
  const [expandedTransactionId, setExpandedTransactionId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const { ref: loadMoreRef, inView } = useInView();
  const ITEMS_PER_PAGE = 10;
  const isInitialLoad = useRef(true);

  // --- ЛОГ МОНТИРОВАНИЯ/РАЗМОНТИРОВАНИЯ ---
  useEffect(() => {
    console.log(`TransactionList MOUNTED for budget: ${currentBudget?.id}`);
    return () => {
      console.log(`TransactionList UNMOUNTED for budget: ${currentBudget?.id}`);
    };
  }, [currentBudget]); // Зависимость от currentBudget покажет пересоздание при его смене
  // --- КОНЕЦ ЛОГА ---

  // Функция для форматирования даты заголовка группы
  const getGroupDateTitle = (date: Date): string => {
    if (isToday(date)) return 'Сегодня';
    if (isYesterday(date)) return 'Вчера';
    if (differenceInDays(new Date(), date) === 2) return 'Позавчера';
    if (isThisYear(date)) {
      return format(date, 'd MMMM', { locale: ru });
    }
    return format(date, 'd MMMM yyyy', { locale: ru });
  };

  // Группировка транзакций по датам
  const groupedTransactions = useMemo(() => {
    console.log('Grouping transactions:', transactions.length);
    const groups: { [key: string]: TransactionWithCategoryName[] } = {};
    
    transactions.forEach(transaction => {
      const date = new Date(transaction.createdAt);
      const groupKey = format(date, 'yyyy-MM-dd');
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push({
        ...transaction,
        categoryName: categories.find(c => c.id === transaction.categoryId)?.name || 'Без категории',
      });
    });

    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [transactions, categories]);

  // useCallback для загрузки данных
  const loadData = useCallback(async (reset = false) => {
    console.log('loadData called with reset:', reset, 'currentBudget:', currentBudget?.id);
    
    if (!currentBudget) {
      console.log('No current budget, returning');
      return;
    }
    
    if (reset) {
      console.log('Resetting state');
      setPage(1);
      setTransactions([]);
      setHasMore(true);
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }

    if (isLoading && !reset) {
      console.log('Already loading, returning');
      return;
    }

    if (!reset && !hasMore) {
      console.log('No more data to load, returning');
      return;
    }

    console.log('Starting data load, page:', reset ? 1 : page);
    
    try {
      const [trans, cats] = await Promise.all([
        mockApi.getTransactionsByBudgetId(currentBudget.id, {
          page: reset ? 1 : page,
          limit: ITEMS_PER_PAGE
        }),
        mockApi.getCategoriesByBudgetId(currentBudget.id),
      ]);

      console.log('Data loaded:', {
        transactionsCount: trans.length,
        categoriesCount: cats.length,
        hasMore: trans.length === ITEMS_PER_PAGE
      });

      if (reset) {
        setTransactions(trans);
      } else {
        setTransactions(prev => [...prev, ...trans]);
      }
      
      setCategories(cats);
      setHasMore(trans.length === ITEMS_PER_PAGE);
      
      if (!reset) {
        setPage(prev => prev + 1);
      }
    } catch (error) {
      console.error('Failed to load transactions/categories:', error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
      isInitialLoad.current = false;
    }
  }, [currentBudget, page, isLoading, hasMore]);

  // Экспортируем loadData через ref
  useImperativeHandle(ref, () => ({
    loadData: () => {
      console.log('loadData called via ref');
      return loadData(true);
    },
  }), [loadData]);

  // Эффект для загрузки следующей страницы при скролле
  useEffect(() => {
    if (!isInitialLoad.current && inView && hasMore && !isLoading) {
      console.log('Loading next page');
      loadData();
    }
  }, [inView, hasMore, isLoading, loadData]);

  // Эффект для начальной загрузки
  useEffect(() => {
    if (currentBudget && isInitialLoad.current) {
      console.log('Initial load');
      loadData(true);
    }
  }, [currentBudget, loadData]);

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
    loadData(true); // Сбрасываем список и загружаем заново
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

  // Функция для переключения раскрытого элемента
  const handleToggleExpand = (transactionId: string) => {
    mediumHaptic();
    setExpandedTransactionId((prevId) => (prevId === transactionId ? null : transactionId));
  };

  // Функция для удаления транзакции
  const handleDeleteTransaction = async (transaction: Transaction, event: React.MouseEvent) => {
    event.stopPropagation();
    setTransactionToDelete(transaction);
  };

  // Финальное удаление после подтверждения в AlertDialog
  const handleConfirmDelete = async () => {
    if (!transactionToDelete) return;
    setIsDeleting(true);
    try {
      await mockApi.deleteTransaction(transactionToDelete.id);
      await loadData();
    } catch (error) {
      console.error('Failed to delete transaction:', error);
      // TODO: Показать ошибку пользователю
    } finally {
      setIsDeleting(false);
      setTransactionToDelete(null);
    }
  };

  if (!currentBudget) {
    // Ничего не показываем, если бюджет не выбран
    return null;
  }

  return (
    <div className="mb-6" data-transaction-list>
      <div className="mb-3 flex items-center justify-between px-1">
        <h3 className="text-md font-semibold">Транзакции:</h3>
        <HapticButton variant="ghost" size="sm" onClick={handleAddTransaction} disabled={isLoading}>
          <PlusCircle className="mr-1 h-4 w-4" />
          Добавить
        </HapticButton>
      </div>

      <div className="space-y-4">
        {isLoading && transactions.length === 0 ? (
          <TransactionListSkeleton />
        ) : transactions.length === 0 ? (
          <div className="text-muted-foreground bg-card rounded-lg border p-4 text-center">
            Транзакций по этому бюджету еще нет.
          </div>
        ) : (
          <>
            {groupedTransactions.map(([dateKey, transactions]) => (
              <div key={dateKey} className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground px-1">
                  {getGroupDateTitle(new Date(dateKey))}
                </h4>
                {transactions.map((transaction) => (
                  <ExpandableItem
                    key={transaction.id}
                    isExpanded={expandedTransactionId === transaction.id}
                    onToggle={() => handleToggleExpand(transaction.id)}
                    actions={
                      <div className="flex w-full items-stretch gap-2">
                        <AlertDialog
                          open={transactionToDelete?.id === transaction.id}
                          onOpenChange={(open) => !open && setTransactionToDelete(null)}
                        >
                          <AlertDialogTrigger asChild>
                            <HapticButton
                              variant="ghost"
                              size="sm"
                              className="flex-1 rounded-md border border-border text-destructive hover:text-destructive"
                              onClick={(e) => handleDeleteTransaction(transaction, e)}
                              aria-label="Удалить транзакцию"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Удалить
                            </HapticButton>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Удалить транзакцию?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Вы уверены, что хотите удалить эту транзакцию? Это действие нельзя будет отменить.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel onClick={(e) => { e.stopPropagation(); setTransactionToDelete(null); }}>Отмена</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  await handleConfirmDelete();
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
                            handleEditTransaction(transaction);
                          }}
                          aria-label="Редактировать транзакцию"
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Редактировать
                        </HapticButton>
                      </div>
                    }
                  >
                    <div className="bg-card text-card-foreground group flex items-center justify-between rounded-lg border p-3 text-sm">
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
                      </div>
                    </div>
                  </ExpandableItem>
                ))}
              </div>
            ))}
            
            {/* Индикатор загрузки и триггер для подгрузки */}
            {hasMore && (
              <div ref={loadMoreRef} className="space-y-2">
                {isLoadingMore && (
                  <>
                    <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                    <div className="space-y-2">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="bg-card rounded-lg border p-3">
                          <div className="flex items-center space-x-3">
                            <div className="h-5 w-5 bg-muted rounded-full animate-pulse" />
                            <div className="space-y-2 flex-1">
                              <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                              <div className="h-3 w-24 bg-muted rounded animate-pulse" />
                            </div>
                            <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
            {!hasMore && transactions.length > 0 && (
              <div className="text-muted-foreground text-sm text-center py-2">
                Больше транзакций нет
              </div>
            )}
          </>
        )}
      </div>

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
  );
});
