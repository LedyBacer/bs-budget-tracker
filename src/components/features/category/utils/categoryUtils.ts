import { Category, Transaction } from '@/types';

export interface CategoryWithBalance extends Category {
  progress: number; // Процент потраченного от лимита
  transactionCount: number; // Количество транзакций
}

/**
 * Функция для расчета баланса и прогресса категорий
 */
export function calculateCategoryBalances(
  categories: Category[],
  transactions: Transaction[]
): CategoryWithBalance[] {
  return categories.map((category) => {
    const categoryTransactions = transactions.filter((t) => t.category_id === category.id);
    // Прогресс считаем только от расходов относительно лимита
    const progress =
      category.limit_amount > 0 ? Math.min(100, Math.max(0, (category.balance / category.limit_amount) * 100)) : 0;

    return {
      ...category,
      progress,
      transactionCount: categoryTransactions.length,
    };
  }).sort((a, b) => b.transactionCount - a.transactionCount); // Сортируем по количеству транзакций
}

/**
 * Функция для разделения массива на части (чанки)
 */
export function chunkArray<T>(arr: T[], size: number): T[][] {
  const res: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    res.push(arr.slice(i, i + size));
  }
  return res;
}

/**
 * Функция для расчета общей суммы лимитов
 */
export function calculateTotalLimits(categories: Category[]): number {
  return categories.reduce((sum, cat) => sum + cat.limit_amount, 0);
} 