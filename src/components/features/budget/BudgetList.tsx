// src/components/features/budget/BudgetList.tsx
import { useState } from 'react';
import { hapticFeedback } from '@telegram-apps/sdk';
import { BudgetForm } from './BudgetForm';
import { BudgetListHeader } from './components/BudgetListHeader';
import { BudgetLoadingState, BudgetErrorState, EmptyBudgetState } from './components/BudgetStates';
import { ExpandableBudgetList } from './components/ExpandableBudgetList';
import { useBudgetsRedux } from '@/hooks/useBudgetsRedux';
import { mediumHaptic } from '@/lib/utils';

export function BudgetList() {
  const {
    allBudgets,
    currentBudget,
    selectBudget,
    isLoadingBudgets,
    errorLoadingBudgets,
    reloadBudgets,
  } = useBudgetsRedux();
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
    mediumHaptic();
    
    setIsListExpanded(!isListExpanded);
  };

  // Показываем состояние загрузки
  if (isLoadingBudgets) {
    return <BudgetLoadingState />;
  }

  // Показываем ошибку
  if (errorLoadingBudgets) {
    return <BudgetErrorState error={errorLoadingBudgets} />;
  }

  // Показываем пустое состояние
  if (allBudgets.length === 0) {
    return <EmptyBudgetState />;
  }

  return (
    <div className="mb-6">
      <BudgetListHeader
        isListExpanded={isListExpanded}
        currentBudget={currentBudget}
        isLoadingBudgets={isLoadingBudgets}
        onAddBudgetClick={handleAddBudgetClick}
        onTitleClick={handleTitleClick}
      />

      {/* Здесь я удалил дублирующие состояния, которые уже обрабатываются выше */}
      
      {allBudgets.length > 0 && !isLoadingBudgets && (
        <ExpandableBudgetList
          budgets={allBudgets}
          currentBudgetId={currentBudget?.id || null}
          isListExpanded={isListExpanded}
          onBudgetSelect={selectBudget}
        />
      )}

      <BudgetForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onBudgetSaved={handleBudgetSaved}
      />
    </div>
  );
}