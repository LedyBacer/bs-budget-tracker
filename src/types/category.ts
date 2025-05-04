export interface Category {
  id: string; // Уникальный идентификатор категории
  budgetId: string; // ID бюджета, к которому относится категория
  name: string; // Название категории (например, "Еда")
  limit: number; // Выделенная сумма (лимит) на эту категорию
}
