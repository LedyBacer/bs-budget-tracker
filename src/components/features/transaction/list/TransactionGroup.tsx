import { Transaction } from '@/types';
import { format, isToday, isYesterday, isThisYear } from 'date-fns';
import { ru } from 'date-fns/locale';
import { TransactionItem } from './TransactionItem';
import { TransactionWithCategoryName } from '../utils/types';

interface TransactionGroupProps {
  date: Date;
  transactions: TransactionWithCategoryName[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
  expandedTransactionId: string | null;
  setExpandedTransactionId: (id: string | null) => void;
}

export function TransactionGroup({
  date,
  transactions,
  onEdit,
  onDelete,
  expandedTransactionId,
  setExpandedTransactionId,
}: TransactionGroupProps) {
  // Функция для получения заголовка группы по дате
  const getGroupDateTitle = (date: Date): string => {
    if (isToday(date)) {
      return 'Сегодня';
    } else if (isYesterday(date)) {
      return 'Вчера';
    } else if (isThisYear(date)) {
      return format(date, 'd MMMM', { locale: ru });
    } else {
      return format(date, 'd MMMM yyyy', { locale: ru });
    }
  };

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium py-1">{getGroupDateTitle(date)}</h3>
      <div className="space-y-2">
        {transactions.map((transaction) => (
          <TransactionItem
            key={transaction.id}
            transaction={transaction}
            onEdit={onEdit}
            onDelete={onDelete}
            expandedTransactionId={expandedTransactionId}
            setExpandedTransactionId={setExpandedTransactionId}
          />
        ))}
      </div>
    </div>
  );
} 