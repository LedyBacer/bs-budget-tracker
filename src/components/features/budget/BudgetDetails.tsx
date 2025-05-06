// src/components/features/budget/BudgetDetails.tsx
import { useBudgets } from '@/contexts/BudgetContext';
import { formatCurrency, mediumHaptic } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeletons';
import { useState } from 'react';
import { cn } from '@/lib/utils';
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
import { BudgetForm } from './BudgetForm';
import { Budget } from '@/types';
import { ExpandableItem } from '@/components/ui/expandable-item';

export function BudgetDetails() {
  const { currentBudget, deleteBudget: deleteBudgetFromContext, reloadBudgets } = useBudgets();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [budgetToDelete, setBudgetToDelete] = useState<Budget | null>(null);
  const [expandedBudgetId, setExpandedBudgetId] = useState<string | null>(null);

  const handleEditBudgetClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFormOpen(true);
  };

  const handleDeleteTriggerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setBudgetToDelete(currentBudget);
  };

  const handleConfirmDelete = async () => {
    if (!budgetToDelete) return;
    try {
      await deleteBudgetFromContext(budgetToDelete.id);
    } catch (error) {
      console.error('Delete confirmation handle failed:', error);
    } finally {
      setBudgetToDelete(null);
    }
  };

  const handleBudgetSaved = () => {
    reloadBudgets();
  };

  if (!currentBudget) {
    return (
      <div className="text-muted-foreground p-4 text-center">
        Выберите бюджет для просмотра деталей.
      </div>
    );
  }

  return (
    <div className="mb-6">
      <ExpandableItem
        isExpanded={expandedBudgetId === currentBudget.id}
        onToggle={() => {
          mediumHaptic();
          setExpandedBudgetId(prevId => prevId === currentBudget.id ? null : currentBudget.id);
        }}
        actions={
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
                      await handleConfirmDelete();
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
              onClick={handleEditBudgetClick}
            >
              <Pencil className="mr-1 h-4 w-4" />
              Изменить
            </HapticButton>
          </div>
        }
      >
        <div className="bg-card text-card-foreground group relative rounded-lg border p-4 text-sm h-full">
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Детали бюджета: "{currentBudget.name}"</h3>
            </div>

            <div className="flex justify-between">
              <span className="text-muted-foreground">Общая сумма:</span>
              <span className="font-medium">{formatCurrency(currentBudget.totalAmount)}</span>
            </div>
            
            <div className={cn(
              "grid grid-rows-[0fr] transition-all duration-300 ease-in-out",
              expandedBudgetId === currentBudget.id && "grid-rows-[1fr]"
            )}>
              <div className="overflow-hidden">
                <div className="space-y-2 ">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Расходы:</span>
                    <span className="font-medium text-red-600">{formatCurrency(currentBudget.totalExpense)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Доходы:</span>
                    <span className="font-medium text-green-600">{formatCurrency(currentBudget.totalIncome)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <span className="text-muted-foreground">Текущий баланс:</span>
              <span className={`text-lg font-bold ${currentBudget.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(currentBudget.balance)}
              </span>
            </div>
          </div>
        </div>
      </ExpandableItem>

      <BudgetForm
        budgetToEdit={currentBudget}
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onBudgetSaved={handleBudgetSaved}
      />
    </div>
  );
}
