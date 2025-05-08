import { useState, useCallback } from 'react';
import { HapticButton } from '@/components/ui/haptic-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronDown, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Category, WebAppUser } from '@/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

export interface FiltersState {
  dateRange: 'all' | 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth' | 'custom';
  startDate: string;
  endDate: string;
  userId: string;
  type: 'all' | 'expense' | 'income';
  categoryId: string;
}

interface TransactionFiltersProps {
  filters: FiltersState;
  onFiltersChange: (filters: FiltersState) => void;
  categories: Category[];
  uniqueUsers: WebAppUser[];
}

export function TransactionFilters({
  filters,
  onFiltersChange,
  categories,
  uniqueUsers,
}: TransactionFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleDateRangeChange = (value: FiltersState['dateRange']) => {
    const now = new Date();
    let startDate = '';
    let endDate = '';

    // Вычисляем даты для предустановленных периодов
    if (value !== 'all' && value !== 'custom') {
      switch (value) {
        case 'thisWeek': {
          const start = new Date(now);
          start.setDate(now.getDate() - now.getDay() + 1);
          const end = new Date(start);
          end.setDate(start.getDate() + 6);
          startDate = start.toISOString().split('T')[0];
          endDate = end.toISOString().split('T')[0];
          break;
        }
        case 'lastWeek': {
          const start = new Date(now);
          start.setDate(now.getDate() - now.getDay() - 6);
          const end = new Date(start);
          end.setDate(start.getDate() + 6);
          startDate = start.toISOString().split('T')[0];
          endDate = end.toISOString().split('T')[0];
          break;
        }
        case 'thisMonth': {
          const start = new Date(now.getFullYear(), now.getMonth(), 1);
          const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          startDate = start.toISOString().split('T')[0];
          endDate = end.toISOString().split('T')[0];
          break;
        }
        case 'lastMonth': {
          const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const end = new Date(now.getFullYear(), now.getMonth(), 0);
          startDate = start.toISOString().split('T')[0];
          endDate = end.toISOString().split('T')[0];
          break;
        }
      }
    }

    onFiltersChange({
      ...filters,
      dateRange: value,
      startDate,
      endDate,
    });
  };

  const handleTypeChange = (value: FiltersState['type']) => {
    onFiltersChange({
      ...filters,
      type: value,
    });
  };

  const handleCategoryChange = (value: string) => {
    onFiltersChange({
      ...filters,
      categoryId: value === "all" ? "" : value,
    });
  };

  const handleUserChange = (value: string) => {
    onFiltersChange({
      ...filters,
      userId: value === "all" ? "" : value,
    });
  };

  const handleCustomDateChange = (startDate: string, endDate: string) => {
    onFiltersChange({
      ...filters,
      startDate,
      endDate,
    });
  };

  const getCurrentPeriodLabel = useCallback(() => {
    const now = new Date();

    switch (filters.dateRange) {
      case 'thisWeek': {
        const start = new Date(now);
        start.setDate(now.getDate() - now.getDay() + 1);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        return `${format(start, 'd MMM', { locale: ru })} - ${format(end, 'd MMM', { locale: ru })}`;
      }
      case 'lastWeek': {
        const start = new Date(now);
        start.setDate(now.getDate() - now.getDay() - 6);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        return `${format(start, 'd MMM', { locale: ru })} - ${format(end, 'd MMM', { locale: ru })}`;
      }
      case 'thisMonth': {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return `${format(start, 'd MMM', { locale: ru })} - ${format(end, 'd MMM', { locale: ru })}`;
      }
      case 'lastMonth': {
        const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const end = new Date(now.getFullYear(), now.getMonth(), 0);
        return `${format(start, 'd MMM', { locale: ru })} - ${format(end, 'd MMM', { locale: ru })}`;
      }
      case 'custom':
        if (!filters.startDate || !filters.endDate) return 'Произвольный период';
        const start = new Date(filters.startDate);
        const end = new Date(filters.endDate);
        return `${format(start, 'd MMM', { locale: ru })} - ${format(end, 'd MMM', { locale: ru })}`;
      default:
        return 'Все время';
    }
  }, [filters.dateRange, filters.startDate, filters.endDate]);

  return (
    <div className="mb-4">
      <HapticButton
        variant="outline"
        className="w-full justify-between"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center">
          <Filter className="mr-2 h-4 w-4" />
          <span>Фильтры</span>
          {filters.dateRange !== 'all' && (
            <span className="ml-2 text-sm text-muted-foreground">
              {getCurrentPeriodLabel()}
            </span>
          )}
        </div>
        <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
      </HapticButton>

      {isOpen && (
        <div className="mt-2 space-y-4 rounded-lg border bg-card p-4">
          {/* Период */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Период</label>
            <Select
              value={filters.dateRange}
              onValueChange={handleDateRangeChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Выберите период" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все время</SelectItem>
                <SelectItem value="thisWeek">За эту неделю</SelectItem>
                <SelectItem value="lastWeek">За прошлую неделю</SelectItem>
                <SelectItem value="thisMonth">За этот месяц</SelectItem>
                <SelectItem value="lastMonth">За прошлый месяц</SelectItem>
                <SelectItem value="custom">Произвольный период</SelectItem>
              </SelectContent>
            </Select>

            {filters.dateRange === 'custom' && (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="startDate" className="text-xs">От</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => handleCustomDateChange(e.target.value, filters.endDate)}
                    max={filters.endDate || undefined}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="endDate" className="text-xs">До</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => handleCustomDateChange(filters.startDate, e.target.value)}
                    min={filters.startDate || undefined}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Тип транзакции */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Тип транзакции</label>
            <Select
              value={filters.type}
              onValueChange={handleTypeChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Выберите тип" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все</SelectItem>
                <SelectItem value="expense">Расходы</SelectItem>
                <SelectItem value="income">Доходы</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Категория */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Категория</label>
            <Select
              value={filters.categoryId || "all"}
              onValueChange={handleCategoryChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Выберите категорию" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все категории</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Пользователь */}
          {/* uniqueUsers.length > 1  */}
          {
            <div className="space-y-2">
              <label className="text-sm font-medium">Пользователь</label>
              <Select
                value={filters.userId || "all"}
                onValueChange={handleUserChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Выберите пользователя" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все пользователи</SelectItem>
                  {uniqueUsers.map((user) => (
                    <SelectItem key={user.id} value={String(user.id)}>
                      {user.first_name} {user.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          }
        </div>
      )}
    </div>
  );
} 