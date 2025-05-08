// src/types/budget.ts
export interface Budget {
  id: string; // Уникальный идентификатор бюджета (UUID)
  name: string; // Название бюджета
  total_amount: number; // Общая сумма бюджета
  created_at: string; // Дата создания (строка ISO)
  updated_at: string; // Дата обновления (строка ISO)
  owner_user_id?: number | null; // ID пользователя-владельца (Telegram User ID)
  owner_chat_id?: number | null; // ID чата-владельца
  total_expense: number; // Общая сумма расходов (рассчитывается на бэкенде)
  total_income: number; // Общая сумма доходов (рассчитывается на бэкенде)
  balance: number; // Текущий баланс (рассчитывается на бэкенде)
}
