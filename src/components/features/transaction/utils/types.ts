import { Transaction } from '@/types';

// Интерфейс для транзакции с присоединенным именем категории
export interface TransactionWithCategoryName extends Transaction {
  categoryName?: string;
}

// Тип для группированных транзакций по дате
export interface GroupedTransactions {
  [dateString: string]: TransactionWithCategoryName[];
} 