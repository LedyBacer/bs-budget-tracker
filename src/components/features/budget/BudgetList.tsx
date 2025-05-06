// src/components/features/budget/BudgetList.tsx
import React, { useState } from 'react';
import { useBudgets } from '@/contexts/BudgetContext';
import { cn } from '@/lib/utils';
import { PlusCircle, ChevronDown } from 'lucide-react';
import { BudgetForm } from './BudgetForm';
import { Budget } from '@/types';
import { HapticButton } from '@/components/ui/haptic-button';
import { hapticFeedback } from '@telegram-apps/sdk';

function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return 'Неизвестная ошибка';
}

export function BudgetList() {
  const {
    allBudgets,
    currentBudget,
    selectBudget,
    isLoadingBudgets,
    errorLoadingBudgets,
    reloadBudgets,
  } = useBudgets();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isListExpanded, setIsListExpanded] = useState(false);

  const handleBudgetSaved = () => {
    console.log('Budget saved/added, reloading list...');
    reloadBudgets();
  };

  const handleAddBudgetClick = () => {
    setIsFormOpen(true);
  };

  const handleTitleClick = () => {
    if (hapticFeedback.impactOccurred.isAvailable()) {
      hapticFeedback.impactOccurred('medium');
    }
    
    setIsListExpanded(!isListExpanded);
  };

  if (isLoadingBudgets) {
    return <div className="text-muted-foreground p-4 text-center">Загрузка бюджетов...</div>;
  }

  if (errorLoadingBudgets) {
    return (
      <div className="text-destructive p-4 text-center">
        Ошибка загрузки бюджетов: {formatError(errorLoadingBudgets)}
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
          onClick={handleTitleClick}
        >
          <h3 className="text-md font-semibold">
            {isListExpanded ? "Бюджеты:" : "Бюджет:"}
          </h3>
          {!isListExpanded && currentBudget && (
            <span className="text-md">{currentBudget.name}</span>
          )}
          <ChevronDown 
            className={cn(
              "h-4 w-4 transition-transform duration-200",
              isListExpanded ? "rotate-180" : "rotate-0"
            )}
          />
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

      {isLoadingBudgets && (
        <div className="text-muted-foreground p-4 text-center">Загрузка бюджетов...</div>
      )}
      {errorLoadingBudgets && !isLoadingBudgets && (
        <div className="text-destructive p-4 text-center">
          Ошибка загрузки бюджетов: {formatError(errorLoadingBudgets)}
        </div>
      )}
      {allBudgets.length === 0 && !isLoadingBudgets && !errorLoadingBudgets && (
        <div className="text-muted-foreground bg-card rounded-lg border p-4 text-center">
          Бюджеты пока не созданы. Нажмите "Добавить".
        </div>
      )}

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
            <HapticButton
              key={budget.id}
              variant={currentBudget?.id === budget.id ? 'secondary' : 'ghost'}
              onClick={() => {
                selectBudget(budget.id);
              }}
              className={cn(
                'h-auto w-full justify-start py-2 px-3 text-left',
                currentBudget?.id === budget.id && 'font-semibold'
              )}
            >
              {budget.name}
            </HapticButton>
          ))}
        </div>
      )}

      <BudgetForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onBudgetSaved={handleBudgetSaved}
      />
    </div>
  );
}