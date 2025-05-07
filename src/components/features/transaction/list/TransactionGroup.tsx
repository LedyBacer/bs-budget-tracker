import { Transaction } from '@/types';
import { format, isToday, isYesterday, isThisYear } from 'date-fns';
import { ru } from 'date-fns/locale';
import { TransactionItem } from './TransactionItem';
import { TransactionWithCategoryName } from '../utils/types';
import { useAppSelector } from '@/lib/redux/hooks';
import { selectExpensesSumByDate } from '@/lib/redux/selectors/transactionSelectors';
import { formatCurrency } from '@/lib/utils';

interface TransactionGroupProps {
  dateKey: string;
  transactions: TransactionWithCategoryName[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
  expandedTransactionId: string | null;
  onToggleExpand: (id: string | null) => void;
}

export function TransactionGroup({
  dateKey,
  transactions,
  onEdit,
  onDelete,
  expandedTransactionId,
  onToggleExpand,
}: TransactionGroupProps) {
  // Получаем суммы расходов по датам из Redux
  const expensesSumByDate = useAppSelector(selectExpensesSumByDate);
  
  // Сумма расходов для текущей даты
  const expensesSum = expensesSumByDate[dateKey] || 0;
  
  // Преобразуем ключ даты в объект Date
  const date = new Date(dateKey);
  
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
      <h3 className="text-sm font-medium py-1 flex justify-between items-center">
        <span>{getGroupDateTitle(date)}</span>
        <span className="text-xs text-muted-foreground">
          {expensesSum > 0 && `- ${formatCurrency(expensesSum)}`}
        </span>
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