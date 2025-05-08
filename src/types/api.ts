// src/types/api.ts

// ========== BUDGETS ==========
export interface BudgetCreate {
  name: string;
  total_amount: number;
}

export interface BudgetUpdate {
  name?: string | null;
  total_amount?: number | null;
}

// ========== CATEGORIES ==========
export interface CategoryCreate {
  name: string;
  limit_amount: number;
}

export interface CategoryUpdate {
  name?: string | null;
  limit_amount?: number | null;
}

// ========== TRANSACTIONS ==========
// Тип TransactionType используется и локально, и в API, убедимся, что он совпадает
// или используем разные типы, если они действительно отличаются.
// OpenAPI определяет TransactionType как enum: [ "expense", "income" ]
export type TransactionType = 'expense' | 'income';

export interface TransactionCreate {
  type: TransactionType;
  amount: number;
  name?: string | null;
  comment?: string | null;
  transaction_date?: string; // формат date-time, строка ISO
  category_id: string;
}

export interface TransactionUpdate {
  type?: TransactionType | null;
  amount?: number | null;
  name?: string | null;
  comment?: string | null;
  category_id?: string | null;
  transaction_date?: string | null; // формат date-time, строка ISO
}

import { Transaction } from './transaction';

export interface TransactionListResponse {
  transactions: Transaction[];
  total_count: number;
}

// Новый тип для ответа от эндпоинта date-summary
export interface DateTransactionSummary {
  summaries: Record<string, number>; // Ключ - дата "YYYY-MM-DD", значение - сумма
}

// Можно также добавить сюда HTTPValidationError и ValidationError, если нужно их типизировать
// export interface ValidationError {
//   loc: (string | number)[];
//   msg: string;
//   type: string;
// }
// export interface HTTPValidationError {
//   detail?: ValidationError[];
// }
