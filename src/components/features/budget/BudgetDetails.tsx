// src/components/features/budget/BudgetDetails.tsx
import { useBudgets } from '@/contexts/BudgetContext';
import { mediumHaptic } from '@/lib/utils';
import { useState } from 'react';
import { ExpandableItem } from '@/components/ui/expandable-item';
import { BudgetForm } from './BudgetForm';
import { Budget } from '@/types';
import { BudgetActions } from './components/BudgetActions';
import { BudgetSummary } from './components/BudgetSummary';
import { NoBudgetSelectedState } from './components/BudgetStates';

export function BudgetDetails() {
  const { currentBudget, deleteBudget: deleteBudgetFromContext, reloadBudgets } = useBudgets();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [budgetToDelete, setBudgetToDelete] = useState<Budget | null>(null);
  const [expandedBudgetId, setExpandedBudgetId] = useState<string | null>(null);

  console.log(
    '[BudgetDetails] Render. Current Budget:',
    currentBudget ? JSON.parse(JSON.stringify(currentBudget)) : null
  );

  const handleEditBudgetClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFormOpen(true);
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
    return <NoBudgetSelectedState />;
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
          <BudgetActions
            currentBudget={currentBudget}
            onEditClick={handleEditBudgetClick}
            onDeleteConfirm={handleConfirmDelete}
            budgetToDelete={budgetToDelete}
            setBudgetToDelete={setBudgetToDelete}
          />
        }
      >
        <div className="bg-card text-card-foreground group relative rounded-lg border p-4 text-sm h-full">
          <BudgetSummary 
            budget={currentBudget} 
            isExpanded={expandedBudgetId === currentBudget.id} 
          />
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
