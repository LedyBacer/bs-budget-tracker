// src/components/features/budget/BudgetList.tsx
import React, { useState } from 'react';
import { useBudgets } from '@/contexts/BudgetContext';
// import { Button } from '@/components/ui/button';
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
import { ExpandableItem } from '@/components/ui/expandable-item';
import { HapticButton } from '@/components/ui/haptic-button';

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
  const [budgetToEdit, setBudgetToEdit] = useState<Budget | null>(null);
  const [budgetToDelete, setBudgetToDelete] = useState<Budget | null>(null);
  const [expandedBudgetId, setExpandedBudgetId] = useState<string | null>(null);
  const [isListExpanded, setIsListExpanded] = useState(false);

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

  // Функция для переключения раскрытого элемента
  const handleToggleExpand = (budgetId: string) => {
    setExpandedBudgetId((prevId) => (prevId === budgetId ? null : budgetId));
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
        <div 
          className="flex items-center gap-2 cursor-pointer" 
          onClick={() => setIsListExpanded(!isListExpanded)}
        >
          <h3 className="text-md font-semibold">
            {isListExpanded ? "Бюджеты:" : "Бюджет:"}
          </h3>
          {!isListExpanded && currentBudget && (
            <span className="text-md">{currentBudget.name}</span>
          )}
        </div>
        <HapticButton 
          variant="ghost"
          size="sm"
          onClick={handleAddBudgetClick}
          disabled={isLoadingBudgets}
        >
          <PlusCircle className="mr-1 h-4 w-4" />
          Добавить
        </HapticButton>
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
        <div 
          className={cn(
            "flex flex-col space-y-1 transition-all duration-300 ease-in-out",
            isListExpanded 
              ? "opacity-100 max-h-[1000px] overflow-visible" 
              : "opacity-0 max-h-0 overflow-hidden"
          )}
        >
          {allBudgets.map((budget) => (
            <React.Fragment key={budget.id}>
              <ExpandableItem
                isExpanded={expandedBudgetId === budget.id}
                onToggle={() => handleToggleExpand(budget.id)}
                actions={
                  <div className="flex w-full items-stretch gap-1">
                    <AlertDialog
                      open={budgetToDelete?.id === budget.id}
                      onOpenChange={(open) => !open && setBudgetToDelete(null)}
                    >
                      <AlertDialogTrigger asChild>
                        <HapticButton
                          variant="ghost"
                          size="sm"
                          className="flex-1 rounded-md border border-border text-destructive hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTriggerClick(budget, e);
                          }}
                          aria-label="Удалить бюджет"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Удалить
                        </HapticButton>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Удалить бюджет?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Вы уверены, что хотите удалить бюджет "{budget.name}"? Все связанные с ним
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
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditBudgetClick(budget, e);
                      }}
                      aria-label="Редактировать бюджет"
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Редактировать
                    </HapticButton>
                  </div>
                }
              >
                <HapticButton
                  variant={currentBudget?.id === budget.id ? 'secondary' : 'ghost'}
                  onClick={() => {
                    selectBudget(budget.id);
                  }}
                  className={cn(
                    'h-auto w-full justify-start py-2 pr-16 pl-3 text-left',
                    currentBudget?.id === budget.id && 'font-semibold'
                  )}
                >
                  {budget.name}
                </HapticButton>
              </ExpandableItem>
            </React.Fragment>
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
    </div>
  );
}
