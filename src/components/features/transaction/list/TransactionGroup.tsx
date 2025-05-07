// components/features/transaction/list/TransactionGroup.tsx
import { Transaction } from '@/types';
import { format, isToday, isYesterday, isThisYear } from 'date-fns';
import { ru } from 'date-fns/locale';
import { TransactionItem } from './TransactionItem';
import { TransactionWithCategoryName } from '../utils/types';
// import { useAppSelector } from '@/lib/redux/hooks'; // Больше не используем
// import { selectExpensesSumByDate } from '@/lib/redux/selectors/transactionSelectors'; // Больше не используем
import { formatCurrency } from '@/lib/utils';

interface TransactionGroupProps {
  dateKey: string; // YYYY-MM-DD
  transactions: TransactionWithCategoryName[];
  dailyTotalExpense: number; // Новое свойство
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
  expandedTransactionId: string | null;
  onToggleExpand: (id: string | null) => void;
}

export function TransactionGroup({
  dateKey,
  transactions,
  dailyTotalExpense, // Получаем сумму из пропсов
  onEdit,
  onDelete,
  expandedTransactionId,
  onToggleExpand,
}: TransactionGroupProps) {
  const date = new Date(dateKey); // dateKey должен быть в формате, который new Date может распарсить корректно (YYYY-MM-DD)

  const getGroupDateTitle = (d: Date): string => {
    // Важно: dateKey уже нормализован к YYYY-MM-DD (UTC).
    // new Date(dateKey) создаст дату в локальном часовом поясе, но со временем 00:00:00.
    // Для isToday, isYesterday это может быть проблемой, если локальный пояс сильно отличается от UTC.
    // Для простоты оставим так, но в реальном приложении с часовыми поясами это требует внимания.
    // Можно передавать объект Date сразу, если dateKey это позволяет.
    // Или использовать date-fns-tz для работы с часовыми поясами.
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const inputDate = new Date(d.getFullYear(), d.getMonth(), d.getDate()); // Нормализуем время для сравнения только дат

    if (
      inputDate.getTime() ===
      new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
    ) {
      return 'Сегодня';
    } else if (
      inputDate.getTime() ===
      new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate()).getTime()
    ) {
      return 'Вчера';
    } else if (d.getFullYear() === today.getFullYear()) {
      return format(d, 'd MMMM', { locale: ru });
    } else {
      return format(d, 'd MMMM yyyy', { locale: ru });
    }
  };

  return (
    <div className="space-y-2">
      <h3 className="flex items-center justify-between py-1 text-sm font-medium">
        <span>{getGroupDateTitle(date)}</span>
        {dailyTotalExpense > 0 && ( // Показываем сумму только если она больше 0
          <span className="text-muted-foreground text-xs">
            {`- ${formatCurrency(dailyTotalExpense)}`}
          </span>
        )}
      </h3>
      <div className="space-y-2">
        {transactions.map((transaction) => (
          <TransactionItem
            key={transaction.id}
            transaction={transaction}
            onEdit={onEdit}
            onDelete={onDelete}
            expandedTransactionId={expandedTransactionId}
            setExpandedTransactionId={onToggleExpand}
          />
        ))}
      </div>
    </div>
  );
}
