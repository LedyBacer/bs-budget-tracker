export interface Budget {
  id: string; // Уникальный идентификатор бюджета
  name: string; // Название бюджета (например, "Январь 2024")
  totalAmount: number; // Общая сумма бюджета
  createdAt: Date; // Дата создания
  // chat_id?: number | string; // Опционально: Идентификатор чата, к которому привязан бюджет (для бэкенда)
}
