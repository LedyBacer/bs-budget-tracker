import { Button } from '@/components/ui/button';
import { DialogClose, DialogFooter } from '@/components/ui/dialog';
import { Budget } from '@/types';

interface BudgetFormFooterProps {
  isSubmitting: boolean;
  budgetToEdit: Budget | null | undefined;
}

export function BudgetFormFooter({ isSubmitting, budgetToEdit }: BudgetFormFooterProps) {
  return (
    <DialogFooter>
      <DialogClose asChild>
        <Button type="button" variant="outline" disabled={isSubmitting}>
          Отмена
        </Button>
      </DialogClose>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting
          ? budgetToEdit
            ? 'Сохранение...'
            : 'Создание...'
          : budgetToEdit
            ? 'Сохранить изменения'
            : 'Создать бюджет'}
      </Button>
    </DialogFooter>
  );
} 