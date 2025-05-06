import { formatError } from '../utils';

interface ErrorStateProps {
  error: unknown;
}

export function BudgetLoadingState() {
  return <div className="text-muted-foreground p-4 text-center">Загрузка бюджетов...</div>;
}

export function BudgetErrorState({ error }: ErrorStateProps) {
  return (
    <div className="text-destructive p-4 text-center">
      Ошибка загрузки бюджетов: {formatError(error)}
    </div>
  );
}

export function EmptyBudgetState() {
  return (
    <div className="text-muted-foreground bg-card rounded-lg border p-4 text-center">
      Бюджеты пока не созданы. Нажмите "Добавить".
    </div>
  );
}

export function NoBudgetSelectedState() {
  return (
    <div className="text-muted-foreground p-4 text-center">
      Выберите бюджет для просмотра деталей.
    </div>
  );
} 