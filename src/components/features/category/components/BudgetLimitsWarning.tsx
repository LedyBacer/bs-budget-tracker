import { formatCurrency } from '@/lib/utils';

interface BudgetLimitsWarningProps {
  totalLimits: number;
  budgetTotal: number;
  hasCategories: boolean;
}

export function BudgetLimitsWarning({ 
  totalLimits, 
  budgetTotal, 
  hasCategories 
}: BudgetLimitsWarningProps) {
  // Если лимиты превышают бюджет - показываем предупреждение
  if (totalLimits > budgetTotal) {
    return (
      <div className="text-destructive bg-destructive/10 mb-3 rounded-md p-2 text-xs">
        Внимание! Сумма лимитов по категориям ({formatCurrency(totalLimits)}) превышает общую
        сумму бюджета ({formatCurrency(budgetTotal)}).
      </div>
    );
  }
  
  // Если есть нераспределенные средства - показываем информацию
  if (totalLimits < budgetTotal && hasCategories) {
    return (
      <div className="text-muted-foreground bg-secondary mb-3 rounded-md p-2 text-xs">
        Нераспределенный остаток бюджета:{' '}
        {formatCurrency(budgetTotal - totalLimits)}
      </div>
    );
  }
  
  return null;
} 