import { useState } from 'react';
import { Transaction } from '@/types';
import { formatCurrency, formatDate, cn, mediumHaptic } from '@/lib/utils';
import { ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { ExpandableItem } from '@/components/ui/expandable-item';
import { TransactionWithCategoryName } from '../utils/types';
import { TransactionActions } from './TransactionActions';

interface TransactionItemProps {
  transaction: TransactionWithCategoryName;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
  expandedTransactionId: string | null;
  setExpandedTransactionId: (id: string | null) => void;
}

export function TransactionItem({
  transaction,
  onEdit,
  onDelete,
  expandedTransactionId,
  setExpandedTransactionId,
}: TransactionItemProps) {
  const handleToggleExpand = () => {
    mediumHaptic();
    if (expandedTransactionId === transaction.id) {
      setExpandedTransactionId(null);
    } else {
      setExpandedTransactionId(transaction.id);
    }
  };

  const isExpanded = expandedTransactionId === transaction.id;

  const handleEdit = () => {
    onEdit(transaction);
  };

  const handleDelete = () => {
    onDelete(transaction);
  };
  
  const formatDateTime = (date: Date) => {
    return `${formatDate(date)} ${date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <ExpandableItem
      isExpanded={isExpanded}
      onToggle={handleToggleExpand}
      actions={
        <TransactionActions
          transaction={transaction}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      }
    >
      <div className="bg-card text-card-foreground group relative rounded-lg border px-3 py-2.5 text-sm">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-2">
            {transaction.type === 'income' ? (
              <ArrowUpCircle className="h-5 w-5 text-emerald-500" />
            ) : (
              <ArrowDownCircle className="h-5 w-5 text-rose-500" />
            )}
            <div>
              <div className="flex items-baseline">
                <span className="font-medium truncate max-w-[150px]">
                  {transaction.name || transaction.categoryName}
                </span>
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {transaction.name
                  ? transaction.categoryName
                  : 'Без названия'}
              </div>
            </div>
          </div>
          <span
            className={cn(
              'text-base font-medium',
              transaction.type === 'income'
                ? 'text-emerald-500'
                : 'text-rose-500'
            )}
          >
            {transaction.type === 'income' ? '+' : '-'}
            {formatCurrency(transaction.amount)}
          </span>
        </div>

        <div
          className={cn(
            'grid grid-rows-[0fr] transition-all duration-300 ease-in-out',
            isExpanded && 'grid-rows-[1fr]'
          )}
        >
          <div className="overflow-hidden">
            <div className="flex flex-col gap-2 pt-2 border-t mt-2">
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Дата:</div>
                <div className="text-sm">
                  {formatDateTime(new Date(transaction.createdAt))}
                </div>
              </div>
              {transaction.comment && (
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Заметка:</div>
                  <div className="text-sm whitespace-pre-wrap rounded bg-card p-2 brightness-95 dark:brightness-90">
                    {transaction.comment}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ExpandableItem>
  );
} 