import { Pencil, Trash2 } from 'lucide-react';
import { HapticButton } from '@/components/ui/haptic-button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { mediumHaptic } from '@/lib/utils';
import { Transaction } from '@/types';

interface TransactionActionsProps {
  transaction: Transaction;
  onEdit: (transaction: Transaction) => void;
  onDelete: () => void;
}

export function TransactionActions({
  transaction,
  onEdit,
  onDelete,
}: TransactionActionsProps) {
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    mediumHaptic();
    onEdit(transaction);
  };

  const handleDeleteConfirm = () => {
    mediumHaptic();
    onDelete();
  };

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    mediumHaptic();
  };

  return (
    <div className="flex w-full items-stretch gap-1">
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <HapticButton
            variant="ghost"
            size="sm"
            className="flex-1 rounded-md border border-border text-destructive hover:text-destructive py-4.5"
            aria-label="Удалить"
            onClick={handleTriggerClick}
          >
            <Trash2 className="mr-1 h-4 w-4" />
            Удалить
          </HapticButton>
        </AlertDialogTrigger>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить транзакцию?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие невозможно отменить. Транзакция будет безвозвратно
              удалена из бюджета.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteConfirm}
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <HapticButton
        variant="ghost"
        size="sm"
        className="flex-1 rounded-md border border-border py-4.5"
        onClick={handleEdit}
        aria-label="Редактировать"
      >
        <Pencil className="mr-1 h-4 w-4" />
        Изменить
      </HapticButton>
    </div>
  );
} 