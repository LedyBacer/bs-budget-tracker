import { createSelector } from '@reduxjs/toolkit';
import { Transaction, TransactionType } from '@/types';
import { format, startOfDay } from 'date-fns';

// Селектор для получения всех транзакций
export const selectTransactions = (state: any) => {
  // Здесь можно получить транзакции из состояния RTK Query
  const transactions = Object.values(state.api.queries)
    .filter((query: any) => query?.data && Array.isArray(query.data))
    .flatMap((query: any) => query.data)
    .filter((item: any) => item && item.id && (item.type === 'expense' || item.type === 'income'));
  
  return transactions as Transaction[];
};

// Селектор для группировки транзакций по дате
export const selectTransactionsByDate = createSelector(
  [selectTransactions],
  (transactions) => {
    const grouped: Record<string, Transaction[]> = {};
    
    transactions.forEach((transaction) => {
      const date = new Date(transaction.createdAt);
      const dateKey = format(startOfDay(date), 'yyyy-MM-dd');
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      
      grouped[dateKey].push(transaction);
    });
    
    return grouped;
  }
);

// Селектор для расчета суммы расходов по дате
export const selectExpensesSumByDate = createSelector(
  [selectTransactionsByDate],
  (transactionsByDate) => {
    const result: Record<string, number> = {};
    
    Object.entries(transactionsByDate).forEach(([dateKey, transactions]) => {
      // Суммируем только расходы
      const sum = transactions
        .filter((t) => t.type === 'expense')
        .reduce((acc, t) => acc + t.amount, 0);
      
      result[dateKey] = sum;
    });
    
    return result;
  }
); 