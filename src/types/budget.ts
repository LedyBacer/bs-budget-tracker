export interface Budget {
  id: string; // Уникальный идентификатор бюджета
  name: string; // Название бюджета (например, "Январь 2024")
  totalAmount: number; // Общая сумма бюджета
  createdAt: Date | string; // Дата создания (может быть объектом Date или строкой ISO)
  totalExpense: number; // Общая сумма расходов
  totalIncome: number; // Общая сумма доходов
  balance: number; // Текущий баланс (доходы - расходы)
  // chat_id?: number | string; // Опционально: Идентификатор чата, к которому привязан бюджет (для бэкенда)
}
