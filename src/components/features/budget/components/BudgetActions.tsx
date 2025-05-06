import React from 'react';
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
import { Budget } from '@/types';

interface BudgetActionsProps {
  currentBudget: Budget;
  onEditClick: (e: React.MouseEvent) => void;
  onDeleteConfirm: () => Promise<void>;
  budgetToDelete: Budget | null;
  setBudgetToDelete: (budget: Budget | null) => void;
}

export function BudgetActions({
  currentBudget,
  onEditClick,
  onDeleteConfirm,
  budgetToDelete,
  setBudgetToDelete,
}: BudgetActionsProps) {
  const handleDeleteTriggerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setBudgetToDelete(currentBudget);
  };

  return (
    <div className="flex w-full items-stretch gap-1">
      <AlertDialog
        open={!!budgetToDelete}
        onOpenChange={(open) => !open && setBudgetToDelete(null)}
      >
        <AlertDialogTrigger asChild>
          <HapticButton
            variant="ghost"
            size="sm"
            className="flex-1 rounded-md border border-border text-destructive hover:text-destructive"
            onClick={handleDeleteTriggerClick}
          >
            <Trash2 className="mr-1 h-4 w-4" />
            Удалить
          </HapticButton>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить бюджет?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить бюджет "{currentBudget.name}"? Все связанные с ним
              категории и транзакции также будут удалены. Это действие нельзя будет отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={(e) => { e.stopPropagation(); setBudgetToDelete(null); }}>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={async (e) => {
                e.stopPropagation();
                await onDeleteConfirm();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <HapticButton
        variant="ghost"
        size="sm"
        className="flex-1 rounded-md border border-border"
        onClick={onEditClick}
      >
        <Pencil className="mr-1 h-4 w-4" />
        Изменить
      </HapticButton>
    </div>
  );
} 