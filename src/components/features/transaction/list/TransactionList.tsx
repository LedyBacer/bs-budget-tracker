// components/features/transaction/list/TransactionList.tsx
import { useState, forwardRef, useImperativeHandle, useEffect, useCallback, useMemo } from 'react'; // Добавлен useMemo
import { Transaction } from '@/types';
import { FullTransactionForm } from '../forms/FullTransactionForm';
import { TransactionListSkeleton, TransactionLoadingSkeleton } from '@/components/ui/skeletons';
import { useInView } from 'react-intersection-observer';
import { TransactionFilters, FiltersState } from './TransactionFilters';
import { TransactionGroup } from './TransactionGroup';
import { AddTransactionButtonContainer } from './AddTransactionButtonContainer';
import { useTransactionGroups } from '../hooks/useTransactionGroups';
import { useTransactionListRedux } from '@/hooks/useTransactionListRedux';
import { useGetTransactionsDateSummaryQuery } from '@/lib/redux/api';
import { DateTransactionSummary } from '@/types/api';
import { format, subDays } from 'date-fns'; // Для дат по умолчанию

export interface TransactionListRef {
  reloadData: (filters?: Partial<FiltersState>) => Promise<void>;
}

interface TransactionListProps {
  budgetId: string;
}

// Значение по умолчанию для диапазона дат, если в фильтрах не выбран 'custom'
const DEFAULT_SUMMARY_DAYS_RANGE = 90;

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
      isLoading,
      isLoadingMore,
      errorLoading,
      hasMoreTransactions,
      loadMore,
      reloadData: reloadTransactionsFromHook,
      deleteTransaction,
      // totalAccumulatedCount, // Не используется напрямую здесь для summary
      // totalFilteredCount, // Не используется напрямую здесь для summary
    } = useTransactionListRedux(budgetId, filters);

    const { groupedTransactions, sortedGroupKeys } = useTransactionGroups(
      accumulatedAndEnrichedTransactions
    );

    // Определяем диапазон дат для запроса сумм
    const summaryDateParams = useMemo(() => {
      let startDateStr: string;
      let endDateStr: string | undefined;

      if (filters.dateRange === 'custom' && filters.startDate) {
        startDateStr = filters.startDate;
        endDateStr = filters.endDate || filters.startDate; // Если endDate нет, используем startDate
      } else {
        // Для 'all', 'thisWeek', 'lastWeek' и т.д., или если custom не валиден,
        // берем последние N дней.
        // Или можно сделать более сложную логику на основе filters.dateRange,
        // но для сумм может быть проще запросить широкий диапазон.
        const today = new Date();
        endDateStr = format(today, 'yyyy-MM-dd');
        startDateStr = format(subDays(today, DEFAULT_SUMMARY_DAYS_RANGE - 1), 'yyyy-MM-dd');
      }
      return { startDate: startDateStr, endDate: endDateStr };
    }, [filters.dateRange, filters.startDate, filters.endDate]);

    const { data: dateSummaryResponse, isLoading: isLoadingSummary } =
      useGetTransactionsDateSummaryQuery(
        {
          budget_id: budgetId,
          start_date: summaryDateParams.startDate,
          end_date: summaryDateParams.endDate,
          transaction_type: 'expense', // Получаем только расходы для отображения в группах
        },
        { skip: !budgetId || !summaryDateParams.startDate } // Пропускаем, если нет budgetId или startDate
      );

    const dailySummaries = dateSummaryResponse?.summaries || {};

    const [expandedTransactionId, setExpandedTransactionId] = useState<string | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);

    const { ref: inViewRef, inView } = useInView({
      threshold: 0.1,
      rootMargin: '0px 0px 300px 0px',
    });

    useEffect(() => {
      if (inView && !isLoading && !isLoadingMore && hasMoreTransactions && budgetId) {
        loadMore();
      }
    }, [inView, isLoading, isLoadingMore, hasMoreTransactions, loadMore, budgetId]);

    const handleFiltersChange = useCallback(
      (newFilters: FiltersState) => {
        setFilters(newFilters);
        setExpandedTransactionId(null); // Сбрасываем раскрытую транзакцию при смене фильтров
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
          setExpandedTransactionId(null);
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
      if (reloadTransactionsFromHook) {
        await reloadTransactionsFromHook(filters); // Перезагружаем с текущими фильтрами
      }
    };

    // Определяем, сколько всего транзакций загружено для текущих фильтров
    const totalAccumulatedCount = accumulatedAndEnrichedTransactions.length;

    if (!budgetId) {
      return <div className="text-muted-foreground py-8 text-center">Выберите бюджет.</div>;
    }

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
          {!isLoading && totalAccumulatedCount === 0 && !errorLoading && (
            <div className="text-muted-foreground py-8 text-center">
              Нет транзакций, соответствующих фильтрам.
            </div>
          )}

          {/* Показывать скелетон загрузки сумм, если они еще грузятся и есть транзакции */}
          {isLoadingSummary && totalAccumulatedCount > 0 && (
            <div className="text-muted-foreground py-4 text-center text-sm">
              Загрузка сумм за день...
            </div>
          )}

          {sortedGroupKeys.map((dateKey) => (
            <TransactionGroup
              key={dateKey}
              dateKey={dateKey}
              transactions={groupedTransactions[dateKey]}
              dailyTotalExpense={(!isLoadingSummary && dailySummaries[dateKey]) || 0}
              expandedTransactionId={expandedTransactionId}
              onToggleExpand={setExpandedTransactionId}
              onEdit={handleEditTransaction}
              onDelete={handleDeleteTransaction}
            />
          ))}

          {hasMoreTransactions && (
            <div ref={inViewRef} className="flex flex-col items-center justify-center py-4">
              <TransactionLoadingSkeleton />
            </div>
          )}

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
