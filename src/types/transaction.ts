import { WebAppUser } from './telegram';

export type TransactionType = 'expense' | 'income'; // Тип транзакции

export interface Transaction {
  id: string; // Уникальный идентификатор транзакции
  budgetId: string; // ID бюджета
  categoryId: string; // ID категории
  type: TransactionType; // Тип: Списание ('expense') или Пополнение ('income')
  amount: number; // Сумма (всегда положительная)
  name?: string; // Опциональное название/описание
  comment?: string; // Опциональный комментарий
  createdAt: Date; // Дата и время транзакции
  author: Pick<WebAppUser, 'id' | 'first_name' | 'last_name' | 'username'>; // Информация об авторе
  // updatedAt?: Date; // Опционально: для редактирования
  // lastEditor?: Pick<WebAppUser, 'id' | 'first_name'>; // Опционально: для редактирования
}
