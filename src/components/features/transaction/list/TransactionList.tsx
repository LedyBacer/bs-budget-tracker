import { useState, forwardRef, useImperativeHandle, useEffect } from 'react';
import { Transaction } from '@/types';
import { FullTransactionForm } from '../forms/FullTransactionForm';
import { TransactionListSkeleton } from '@/components/ui/skeletons';
import { useInView } from 'react-intersection-observer';
import { TransactionFilters } from './TransactionFilters';
import { TransactionGroup } from './TransactionGroup';
import { AddTransactionButtonContainer } from './AddTransactionButtonContainer';
import { useTransactionFilters } from '../hooks/useTransactionFilters';
import { useTransactionGroups } from '../hooks/useTransactionGroups';
import { useTransactionListRedux } from '@/hooks/useTransactionListRedux';

export interface TransactionListRef {
  loadData: () => Promise<void>;
}

interface TransactionListProps {
  budgetId: string;
  onMajorDataChange?: () => void | Promise<void>;
}

export const TransactionList = forwardRef<TransactionListRef, TransactionListProps>(
  ({ budgetId, onMajorDataChange }, ref) => {
    // Используем Redux хук для транзакций
    const {
      transactions,
      categories,
      uniqueUsers,
      isLoading,
      hasMoreTransactions,
      loadMore,
      reloadData,
      deleteTransaction
    } = useTransactionListRedux(budgetId);
    
    // Состояния для управления UI
    const [expandedTransactionId, setExpandedTransactionId] = useState<string | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);
    
    // InView хук для бесконечной прокрутки
    const { ref: inViewRef, inView } = useInView();

    // Перемещаем логику загрузки в useEffect
    useEffect(() => {
      if (inView && hasMoreTransactions && !isLoading) {
        loadMore();
      }
    }, [inView, hasMoreTransactions, isLoading, loadMore]);

    // Применяем фильтры к транзакциям
    const { filters, updateFilters, filteredTransactions } = useTransactionFilters(transactions);
    
    // Группируем отфильтрованные транзакции по дате
    const { groupedTransactions, sortedGroupKeys } = useTransactionGroups(filteredTransactions);

    // Предоставляем функцию загрузки данных через ref
    useImperativeHandle(ref, () => ({
      loadData: async () => {
        await reloadData();
      },
    }));

    // Функции для управления транзакциями
    const handleAddTransaction = () => {
      setTransactionToEdit(null);
      setIsEditModalOpen(true);
    };

    const handleEditTransaction = (transaction: Transaction) => {
      setTransactionToEdit(transaction);
      setIsEditModalOpen(true);
    };

    const handleDeleteTransaction = async (transaction: Transaction) => {
      try {
        await deleteTransaction(transaction.id);
        // Сигнализируем о необходимости глобального обновления, если callback передан
        if (onMajorDataChange) {
          await onMajorDataChange();
        }
      } catch (error) {
        console.error('Failed to delete transaction:', error);
      }
    };

    const handleTransactionSaved = async () => {
      // Перезагружаем все данные после сохранения транзакции
      await reloadData();

      // Сигнализируем о необходимости глобального обновления, если callback передан
      if (onMajorDataChange) {
        await onMajorDataChange();
      }
    };

    // Отображаем скелетон загрузки, если данные ещё не загружены
    if (isLoading && transactions.length === 0) {
      return <TransactionListSkeleton />;
    }

    return (
      <div className="space-y-1">
        {/* Кнопка добавления */}
        <AddTransactionButtonContainer 
          onClick={handleAddTransaction} 
          title="Транзакции" // Добавляем заголовок
        />

        {/* Фильтры */}
        <TransactionFilters
          filters={filters}
          onFiltersChange={updateFilters}
          categories={categories}
          uniqueUsers={uniqueUsers}
        />

        {/* Список транзакций, сгруппированных по дате */}
        <div className="space-y-6">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Нет транзакций, соответствующих фильтрам
            </div>
          ) : (
            sortedGroupKeys.map((dateKey) => (
              <TransactionGroup
                key={dateKey}
                dateKey={dateKey}
                transactions={groupedTransactions[dateKey]}
                expandedTransactionId={expandedTransactionId}
                onToggleExpand={setExpandedTransactionId}
                onEdit={handleEditTransaction}
                onDelete={handleDeleteTransaction}
              />
            ))
          )}

          {/* Индикатор загрузки при прокрутке */}
          {hasMoreTransactions && (
            <div ref={inViewRef} className="flex justify-center py-4">
              {isLoading && transactions.length > 0 && (
                <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-primary" />
              )}
            </div>
          )}
        </div>

        {/* Форма добавления/редактирования транзакции */}
        <FullTransactionForm
          budgetId={budgetId}
          transactionToEdit={transactionToEdit}
          categories={categories}
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          onTransactionSaved={handleTransactionSaved}
        />
      </div>
    );
  }
); 