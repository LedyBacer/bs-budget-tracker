// components/features/transaction/list/TransactionList.tsx
import { useState, forwardRef, useImperativeHandle, useEffect, useCallback } from 'react';
import { Transaction } from '@/types';
import { FullTransactionForm } from '../forms/FullTransactionForm';
import { TransactionListSkeleton, TransactionLoadingSkeleton } from '@/components/ui/skeletons';
import { useInView } from 'react-intersection-observer'; // Убедитесь, что версия поддерживает 'skip' или удалите его
import { TransactionFilters, FiltersState } from './TransactionFilters';
import { TransactionGroup } from './TransactionGroup';
import { AddTransactionButtonContainer } from './AddTransactionButtonContainer';
import { useTransactionGroups } from '../hooks/useTransactionGroups';
import { useTransactionListRedux } from '@/hooks/useTransactionListRedux';
import { useGetDailyExpenseSummariesQuery } from '@/lib/redux/api';

export interface TransactionListRef {
  reloadData: (filters?: Partial<FiltersState>) => Promise<void>;
}

interface TransactionListProps {
  budgetId: string;
}

export const TransactionList = forwardRef<TransactionListRef, TransactionListProps>(
  ({ budgetId }, ref) => {
    const [filters, setFilters] = useState<FiltersState>({
      dateRange: 'all',
      startDate: '',
      endDate: '',
      userId: '',
      type: 'all',
      categoryId: '',
    });

    const {
      transactions: accumulatedAndEnrichedTransactions,
      categories,
      uniqueUsers,
      isLoading, // это isActuallyLoadingInitial
      isLoadingMore, // это isActuallyLoadingMore
      errorLoading,
      hasMoreTransactions,
      loadMore,
      reloadData: reloadTransactionsFromHook,
      deleteTransaction,
      totalAccumulatedCount,
      totalFilteredCount,
    } = useTransactionListRedux(budgetId, filters);

    const { groupedTransactions, sortedGroupKeys } = useTransactionGroups(
      accumulatedAndEnrichedTransactions
    );

    const getSummaryDateRange = useCallback(() => {
      if (filters.dateRange === 'custom' && filters.startDate && filters.endDate) {
        return { startDate: filters.startDate, endDate: filters.endDate };
      }
      if (filters.dateRange === 'all') {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 90);
        return {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
        };
      }
      return undefined;
    }, [filters]);

    const summaryDateRange = getSummaryDateRange();

    const { data: dailySummaries } = useGetDailyExpenseSummariesQuery(
      { budgetId, dateRange: summaryDateRange! },
      { skip: !budgetId || !summaryDateRange }
    );

    const [expandedTransactionId, setExpandedTransactionId] = useState<string | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);

    const { ref: inViewRef, inView } = useInView({
      threshold: 0.1,
      rootMargin: '0px 0px 300px 0px',
      // Если ваша версия react-intersection-observer < 9, опции 'skip' нет.
      // В этом случае, условие !isLoadingMore в useEffect ниже будет ключевым.
      // skip: isLoadingMore, // Попробуйте закомментировать, если вызывает ошибку
    });

    useEffect(() => {
      //   console.log(
      //       `[TransactionList useInView] InView: ${inView}, isLoading: ${isLoading}, isLoadingMore: ${isLoadingMore}, hasMore: ${hasMoreTransactions}, totalAcc: ${totalAccumulatedCount}, totalFiltered: ${totalFilteredCount}`
      //   );
      if (inView && !isLoading && !isLoadingMore && hasMoreTransactions && budgetId) {
        // console.log('[TransactionList useInView] Calling loadMore()');
        loadMore();
      }
    }, [
      inView,
      isLoading,
      isLoadingMore,
      hasMoreTransactions,
      loadMore,
      budgetId,
      totalAccumulatedCount,
      totalFilteredCount,
    ]);

    const handleFiltersChange = useCallback(
      (newFilters: FiltersState) => {
        setFilters(newFilters);
        reloadTransactionsFromHook(newFilters);
      },
      [reloadTransactionsFromHook]
    );

    useImperativeHandle(
      ref,
      () => ({
        reloadData: async (newFilters?: Partial<FiltersState>) => {
          const updatedFilters = { ...filters, ...newFilters };
          setFilters(updatedFilters);
          await reloadTransactionsFromHook(updatedFilters);
        },
      }),
      [filters, reloadTransactionsFromHook]
    );

    const handleAddTransaction = () => {
      setTransactionToEdit(null);
      setIsEditModalOpen(true);
    };

    const handleEditTransaction = (transaction: Transaction) => {
      setTransactionToEdit(transaction);
      setIsEditModalOpen(true);
    };

    const handleDeleteTransaction = async (transaction: Transaction) => {
      await deleteTransaction(transaction.id);
      setExpandedTransactionId(null);
    };

    const handleTransactionSaved = async () => {
      // console.log("Transaction saved. Reloading transaction list to page 1 with current filters:", filters);
      if (reloadTransactionsFromHook) {
        // Перезагружаем список с текущими локальными фильтрами,
        // что приведет к сбросу на первую страницу.
        await reloadTransactionsFromHook(filters);
      }
      // Связанные данные бюджета и категорий должны обновиться
      // через инвалидацию тегов RTK Query.
    };

    if (!budgetId) {
      return <div className="text-muted-foreground py-8 text-center">Выберите бюджет.</div>;
    }

    // Показываем главный скелетон только если идет начальная загрузка И НЕТ накопленных данных
    if (isLoading && totalAccumulatedCount === 0 && !errorLoading) {
      return <TransactionListSkeleton />;
    }

    return (
      <div className="space-y-1">
        <AddTransactionButtonContainer onClick={handleAddTransaction} title="Транзакции" />
        <TransactionFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          categories={categories}
          uniqueUsers={uniqueUsers}
        />

        {errorLoading && (
          <div className="text-destructive p-4 text-center">
            Ошибка загрузки транзакций: {errorLoading.message}
          </div>
        )}

        <div className="space-y-6">
          {/* Сообщение "Нет транзакций" */}
          {!isLoading && totalAccumulatedCount === 0 && !errorLoading && (
            <div className="text-muted-foreground py-8 text-center">
              Нет транзакций, соответствующих фильтрам.
            </div>
          )}

          {sortedGroupKeys.map((dateKey) => (
            <TransactionGroup
              key={dateKey}
              dateKey={dateKey}
              transactions={groupedTransactions[dateKey]}
              dailyTotalExpense={dailySummaries?.[dateKey] || 0}
              expandedTransactionId={expandedTransactionId}
              onToggleExpand={setExpandedTransactionId}
              onEdit={handleEditTransaction}
              onDelete={handleDeleteTransaction}
            />
          ))}

          {/* Sentinel и скелетон догрузки */}
          {/* Показываем sentinel только если ЕСТЬ ЕЩЁ ЧТО ГРУЗИТЬ */}
          {hasMoreTransactions && (
            <div ref={inViewRef} className="flex flex-col items-center justify-center py-4">
              {/* isLoadingMore && <TransactionLoadingSkeleton /> */}
              <TransactionLoadingSkeleton />
            </div>
          )}

          {/* Сообщение "Транзакций больше нет" */}
          {!hasMoreTransactions && totalAccumulatedCount > 0 && !isLoading && !isLoadingMore && (
            <div className="text-muted-foreground py-4 text-center text-sm">
              Транзакций больше нет
            </div>
          )}
        </div>

        {budgetId && (
          <FullTransactionForm
            budgetId={budgetId}
            transactionToEdit={transactionToEdit}
            categories={categories}
            open={isEditModalOpen}
            onOpenChange={setIsEditModalOpen}
            onTransactionSaved={handleTransactionSaved}
          />
        )}
      </div>
    );
  }
);
