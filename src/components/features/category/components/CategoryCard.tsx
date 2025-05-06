import { formatCurrency, cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { CategoryWithBalance } from '../utils/categoryUtils';

interface CategoryCardProps {
  category: CategoryWithBalance;
  isExpanded: boolean;
}

export function CategoryCard({ category, isExpanded }: CategoryCardProps) {
  return (
    <div className="bg-card text-card-foreground group relative rounded-lg border p-3 text-sm h-full">
      <div className="mb-1 flex items-center justify-between">
        <span className="font-medium">{category.name}</span>
        <span className="text-muted-foreground text-xs">
          Лимит: {formatCurrency(category.limit)}
        </span>
      </div>
      <Progress value={category.progress} className="mb-1 h-2" />
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            Баланс:
          </span>
          <span className={`font-semibold ${category.balance < 0 ? 'text-destructive' : ''}`}>
            {formatCurrency(category.balance)}
          </span>
        </div>
        <div className={cn(
          "grid grid-rows-[0fr] transition-all duration-300 ease-in-out",
          isExpanded && "grid-rows-[1fr]"
        )}>
          <div className="overflow-hidden">
            <div className="flex flex-col gap-1 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  Расходы:
                </span>
                <span className="font-semibold text-destructive">
                  {formatCurrency(category.spent)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  Доходы:
                </span>
                <span className="font-semibold text-green-600">
                  {formatCurrency(category.income)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 