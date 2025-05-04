// src/components/features/budget/BudgetList.tsx
import { useBudgets } from '@/contexts/BudgetContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils'; // Утилита для классов

export function BudgetList() {
  const { allBudgets, currentBudget, selectBudget, isLoadingBudgets, errorLoadingBudgets } =
    useBudgets();

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
      <h3 className="text-md mb-2 px-1 font-semibold">Выберите бюджет:</h3>
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
          </Button>
        ))}
      </div>
      {/* TODO: Кнопка "Добавить бюджет" будет здесь */}
    </div>
  );
}
