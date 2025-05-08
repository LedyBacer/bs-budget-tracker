import { useState, useCallback, useMemo } from 'react';
import { Transaction } from '@/types';
import { FiltersState } from '../list/TransactionFilters';
import { TransactionWithCategoryName } from '../utils/types';
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subWeeks,
  subMonths,
  isWithinInterval,
} from 'date-fns';

// Начальные значения фильтров
export const defaultFilters: FiltersState = {
  dateRange: 'all',
  startDate: '',
  endDate: '',
  userId: '',
  type: 'all',
  categoryId: '',
};

export function useTransactionFilters(transactions: TransactionWithCategoryName[]) {
  const [filters, setFilters] = useState<FiltersState>(defaultFilters);

  // Обновление фильтров
  const updateFilters = useCallback((newFilters: FiltersState) => {
    setFilters(newFilters);
  }, []);

  // Применение фильтров к транзакциям
  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      // Фильтр по типу
      if (filters.type !== 'all' && transaction.type !== filters.type) {
        return false;
      }

      // Фильтр по категории
      if (filters.categoryId && transaction.category_id !== filters.categoryId) {
        return false;
      }

      // Фильтр по пользователю
      if (filters.userId && transaction.author && transaction.author.id.toString() !== filters.userId) {
        return false;
      }

      // Фильтр по дате
      const transactionDate = new Date(transaction.transaction_date);
      const now = new Date();

      // По диапазону дат
      switch (filters.dateRange) {
        case 'thisWeek': {
          const start = startOfWeek(now, { weekStartsOn: 1 });
          const end = endOfWeek(now, { weekStartsOn: 1 });
          return isWithinInterval(transactionDate, { start, end });
        }
        case 'lastWeek': {
          const lastWeek = subWeeks(now, 1);
          const start = startOfWeek(lastWeek, { weekStartsOn: 1 });
          const end = endOfWeek(lastWeek, { weekStartsOn: 1 });
          return isWithinInterval(transactionDate, { start, end });
        }
        case 'thisMonth': {
          const start = startOfMonth(now);
          const end = endOfMonth(now);
          return isWithinInterval(transactionDate, { start, end });
        }
        case 'lastMonth': {
          const lastMonth = subMonths(now, 1);
          const start = startOfMonth(lastMonth);
          const end = endOfMonth(lastMonth);
          return isWithinInterval(transactionDate, { start, end });
        }
        case 'custom': {
          if (filters.startDate && filters.endDate) {
            const start = startOfDay(new Date(filters.startDate));
            const end = endOfDay(new Date(filters.endDate));
            return isWithinInterval(transactionDate, { start, end });
          }
          return true;
        }
        default:
          return true;
      }
    });
  }, [transactions, filters]);

  return {
    filters,
    updateFilters,
    filteredTransactions,
  };
} 