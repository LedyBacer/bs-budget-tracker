// src/components/features/budget/BudgetList.tsx
import React, { useState } from 'react'; // Импортируем useState
import { useBudgets } from '@/contexts/BudgetContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PlusCircle } from 'lucide-react'; // Иконка для добавления
import { BudgetForm } from './BudgetForm'; // Импортируем форму

export function BudgetList() {
  const {
    allBudgets,
    currentBudget,
    selectBudget,
    isLoadingBudgets,
    errorLoadingBudgets,
    reloadBudgets,
  } = useBudgets();
  const [isFormOpen, setIsFormOpen] = useState(false); // Состояние для диалога формы

  // Колбэк после сохранения бюджета (просто перезагружаем список)
  const handleBudgetSaved = () => {
    console.log('Budget saved/added, reloading list...');
    reloadBudgets(); // Используем функцию перезагрузки из контекста
  };

  // Открытие формы
  const handleAddBudgetClick = () => {
    setIsFormOpen(true);
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
            <Button
              key={budget.id}
              variant={currentBudget?.id === budget.id ? 'secondary' : 'ghost'} // Выделяем активный
              onClick={() => selectBudget(budget.id)}
              className={cn(
                'h-auto w-full justify-start px-3 py-2 text-left', // Стили кнопки
                currentBudget?.id === budget.id && 'font-semibold'
              )}
            >
              {budget.name}
              {/* TODO: Добавить кнопки Редактировать/Удалить */}
            </Button>
          ))}
        </div>
      )}

      {/* Диалог формы добавления бюджета */}
      <BudgetForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onBudgetSaved={handleBudgetSaved}
      />
      {/* TODO: Кнопка "Добавить бюджет" будет здесь */}
    </div>
  );
}
