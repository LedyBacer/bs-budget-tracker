// src/types/transaction.ts
// TransactionType остается как есть
export type TransactionType = 'expense' | 'income';

// Информация об авторе транзакции, соответствует TransactionAuthorInfo из OpenAPI
export interface TransactionAuthorInfo {
  id: number;
  first_name: string;
  last_name?: string | null;
  username?: string | null;
}

export interface Transaction {
  id: string; // Уникальный идентификатор транзакции (UUID)
  budget_id: string; // ID бюджета (UUID)
  category_id: string; // ID категории (UUID)
  type: TransactionType; // Тип: Списание ('expense') или Пополнение ('income')
  amount: number; // Сумма (всегда положительная)
  name?: string | null; // Опциональное название/описание
  comment?: string | null; // Опциональный комментарий
  transaction_date: string; // Дата и время транзакции (строка ISO) - основная дата
  author_user_id: number; // ID пользователя-автора (Telegram User ID)
  created_at_db: string; // Дата создания записи в БД (строка ISO)
  updated_at: string; // Дата последнего обновления записи в БД (строка ISO)
  author: TransactionAuthorInfo | null; // Информация об авторе (может быть null, если пользователь удален и т.п.)
  category_name?: string | null; // Название категории (может добавляться на бэкенде или клиенте)
}
