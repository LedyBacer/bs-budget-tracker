// src/components/features/budget/BudgetList.tsx
import React, { useState } from 'react';
import { useBudgets } from '@/contexts/BudgetContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PlusCircle, Pencil, Trash2 } from 'lucide-react'; // Добавили иконки
import { BudgetForm } from './BudgetForm';
// Импортируем AlertDialog для подтверждения удаления
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
import { Budget } from '@/types'; // Импортируем тип Budget

export function BudgetList() {
  const {
    allBudgets,
    currentBudget,
    selectBudget,
    isLoadingBudgets,
    errorLoadingBudgets,
    reloadBudgets,
    deleteBudget: deleteBudgetFromContext,
  } = useBudgets();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [budgetToEdit, setBudgetToEdit] = useState<Budget | null>(null); // Состояние для редактируемого бюджета
  const [budgetToDelete, setBudgetToDelete] = useState<Budget | null>(null); // Состояние для удаляемого бюджета

  // Колбэк после сохранения бюджета (просто перезагружаем список)
  const handleBudgetSaved = () => {
    console.log('Budget saved/added, reloading list...');
    reloadBudgets(); // Используем функцию перезагрузки из контекста
  };

  // Открытие формы добавления
  const handleAddBudgetClick = () => {
    setBudgetToEdit(null); // Сбрасываем редактируемый бюджет
    setIsFormOpen(true);
  };

  // Открытие формы редактирования
  const handleEditBudgetClick = (budget: Budget, event: React.MouseEvent) => {
    event.stopPropagation(); // Остановить всплытие, чтобы не выбрался бюджет
    setBudgetToEdit(budget);
    setIsFormOpen(true);
  };

  // Обработчик клика по кнопке "Удалить" (открывает AlertDialog)
  const handleDeleteTriggerClick = (budget: Budget, event: React.MouseEvent) => {
    event.stopPropagation(); // Остановить всплытие
    setBudgetToDelete(budget);
  };

  // Финальное удаление после подтверждения в AlertDialog
  const handleConfirmDelete = async () => {
    if (!budgetToDelete) return;
    console.log('Deleting budget confirmed:', budgetToDelete.id);
    try {
      await deleteBudgetFromContext(budgetToDelete.id); // Используем функцию из контекста
      // reloadBudgets() и selectBudget(null) вызываются внутри deleteBudgetFromContext
    } catch (error) {
      // Ошибка уже обработана в контексте через popup, здесь можно ничего не делать
      console.error('Delete confirmation handle failed (error likely shown via popup):', error);
    } finally {
      setBudgetToDelete(null);
    }
  };

  if (isLoadingBudgets) {
    // TODO: Можно добавить компонент скелета загрузки
    return <div className="text-muted-foreground p-4 text-center">Загрузка бюджетов...</div>;
  }

  if (errorLoadingBudgets) {
    return (
      <div className="text-destructive p-4 text-center">
        Ошибка загрузки бюджетов: {errorLoadingBudgets.message}
      </div>
    );
  }

  if (allBudgets.length === 0) {
    return <div className="text-muted-foreground p-4 text-center">Бюджеты пока не созданы.</div>;
  }

  return (
    <div className="mb-6">
      <div className="mb-2 flex items-center justify-between px-1">
        <h3 className="text-md font-semibold">Бюджеты:</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleAddBudgetClick}
          disabled={isLoadingBudgets}
        >
          <PlusCircle className="mr-1 h-4 w-4" />
          Добавить
        </Button>
      </div>

      {/* Индикаторы загрузки/ошибки/пустого списка */}
      {isLoadingBudgets && (
        <div className="text-muted-foreground p-4 text-center">Загрузка бюджетов...</div>
      )}
      {errorLoadingBudgets && !isLoadingBudgets && (
        <div className="text-destructive p-4 text-center">
          Ошибка загрузки бюджетов: {errorLoadingBudgets.message}
        </div>
      )}
      {allBudgets.length === 0 && !isLoadingBudgets && !errorLoadingBudgets && (
        <div className="text-muted-foreground bg-card rounded-lg border p-4 text-center">
          Бюджеты пока не созданы. Нажмите "Добавить".
        </div>
      )}

      {/* Список бюджетов */}
      {allBudgets.length > 0 && !isLoadingBudgets && (
        <div className="flex flex-col space-y-1">
          {allBudgets.map((budget) => (
            <div key={budget.id} className="group relative flex">
              {/* Обертка для позиционирования кнопок */}
              <Button
                variant={currentBudget?.id === budget.id ? 'secondary' : 'ghost'}
                onClick={() => selectBudget(budget.id)}
                className={cn(
                  'h-auto w-full justify-start py-2 pr-16 pl-3 text-left', // Добавили отступ справа для кнопок
                  currentBudget?.id === budget.id && 'font-semibold'
                )}
              >
                {budget.name}
              </Button>
              {/* Кнопки редактирования и удаления */}
              <div className="absolute top-0 right-1 bottom-0 flex items-center opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={(e) => handleEditBudgetClick(budget, e)}
                  aria-label="Редактировать бюджет"
                >
                  <Pencil className="h-4 w-4" />
                </Button>

                {/* Обертка для AlertDialog Trigger */}
                <AlertDialog
                  open={budgetToDelete?.id === budget.id}
                  onOpenChange={(open) => !open && setBudgetToDelete(null)}
                >
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive h-7 w-7"
                      onClick={(e) => handleDeleteTriggerClick(budget, e)}
                      aria-label="Удалить бюджет"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  {/* Диалог подтверждения удаления вынесен ниже */}
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Диалог формы добавления/редактирования бюджета (передаем budgetToEdit) */}
      <BudgetForm
        budgetToEdit={budgetToEdit} // Передаем бюджет для редактирования
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onBudgetSaved={handleBudgetSaved}
      />

      {/* Диалог подтверждения удаления (один на все кнопки) */}
      {budgetToDelete && (
        <AlertDialog
          open={!!budgetToDelete}
          onOpenChange={(open) => !open && setBudgetToDelete(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Удалить бюджет?</AlertDialogTitle>
              <AlertDialogDescription>
                Вы уверены, что хотите удалить бюджет "{budgetToDelete.name}"? Все связанные с ним
                категории и транзакции также будут удалены. Это действие нельзя будет отменить.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setBudgetToDelete(null)}>Отмена</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Удалить
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
