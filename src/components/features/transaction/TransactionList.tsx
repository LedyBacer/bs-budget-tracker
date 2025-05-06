// src/components/features/transaction/TransactionList.tsx
import { useState, useEffect, useMemo, useCallback, forwardRef, useImperativeHandle, useRef } from 'react';
import { useBudgets } from '@/contexts/BudgetContext';
import { Transaction, Category, WebAppUser } from '@/types';
import * as mockApi from '@/lib/mockData';
import { formatCurrency, formatDate, cn, mediumHaptic } from '@/lib/utils';
import { ArrowDownCircle, ArrowUpCircle, Edit, PlusCircle, Trash2, Filter, ChevronDown, Calendar } from 'lucide-react'; // Иконки для типов и редактирования, добавляем иконку Trash2 и Filter
import { HapticButton } from '@/components/ui/haptic-button';
import { TransactionForm } from './TransactionForm';
import { ExpandableItem } from '@/components/ui/expandable-item';
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
import { TransactionListSkeleton } from '@/components/ui/skeletons';
import { useInView } from 'react-intersection-observer';
import { format, isToday, isYesterday, isThisYear, differenceInDays, startOfWeek, endOfWeek, subWeeks, startOfMonth, endOfMonth, subMonths, isWithinInterval } from 'date-fns';
import { ru } from 'date-fns/locale';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Опционально: Интерфейс для транзакции с присоединенным именем категории
interface TransactionWithCategoryName extends Transaction {
  categoryName?: string;
}

interface TransactionListRef {
  loadData: () => Promise<void>;
}

interface Filters {
  dateRange: 'all' | 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth' | 'custom';
  startDate: string;
  endDate: string;
  userId: string;
  type: 'all' | 'expense' | 'income';
  categoryId: string;
}

// Компонент фильтров
const TransactionFilters = ({ 
  filters, 
  onFiltersChange, 
  categories, 
  uniqueUsers 
}: { 
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  categories: Category[];
  uniqueUsers: WebAppUser[];
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleDateRangeChange = (value: Filters['dateRange']) => {
    onFiltersChange({
      ...filters,
      dateRange: value,
      ...(value !== 'custom' && { startDate: '', endDate: '' })
    });
  };

  const handleTypeChange = (value: Filters['type']) => {
    onFiltersChange({
      ...filters,
      type: value
    });
  };

  const handleCategoryChange = (value: string) => {
    onFiltersChange({
      ...filters,
      categoryId: value
    });
  };

  const handleUserChange = (value: string) => {
    onFiltersChange({
      ...filters,
      userId: value
    });
  };

  const handleCustomDateChange = (startDate: string, endDate: string) => {
    onFiltersChange({
      ...filters,
      startDate,
      endDate
    });
  };

  const getCurrentPeriodLabel = useCallback(() => {
    const now = new Date();
    switch (filters.dateRange) {
      case 'thisWeek': {
        const start = startOfWeek(now, { weekStartsOn: 1 });
        const end = endOfWeek(now, { weekStartsOn: 1 });
        return `${format(start, 'd MMM', { locale: ru })} - ${format(end, 'd MMM', { locale: ru })}`;
      }
      case 'lastWeek': {
        const lastWeek = subWeeks(now, 1);
        const start = startOfWeek(lastWeek, { weekStartsOn: 1 });
        const end = endOfWeek(lastWeek, { weekStartsOn: 1 });
        return `${format(start, 'd MMM', { locale: ru })} - ${format(end, 'd MMM', { locale: ru })}`;
      }
      case 'thisMonth': {
        const start = startOfMonth(now);
        const end = endOfMonth(now);
        return `${format(start, 'd MMM', { locale: ru })} - ${format(end, 'd MMM', { locale: ru })}`;
      }
      case 'lastMonth': {
        const lastMonth = subMonths(now, 1);
        const start = startOfMonth(lastMonth);
        const end = endOfMonth(lastMonth);
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
                <SelectItem value="all">Все типы</SelectItem>
                <SelectItem value="expense">Расходы</SelectItem>
                <SelectItem value="income">Доходы</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Категория</label>
            <Select
              value={filters.categoryId}
              onValueChange={handleCategoryChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Выберите категорию" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все категории</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Пользователь</label>
            <Select
              value={filters.userId}
              onValueChange={handleUserChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Выберите пользователя" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все пользователи</SelectItem>
                {uniqueUsers.map(user => (
                  <SelectItem key={user.id} value={user.id.toString()}>
                    {user.first_name} {user.last_name || ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  );
};

// Компонент транзакции
const TransactionItem = ({ 
  transaction, 
  onEdit, 
  onDelete,
  transactionToDelete,
  setTransactionToDelete,
  handleConfirmDelete,
  expandedTransactionId,
  setExpandedTransactionId
}: { 
  transaction: TransactionWithCategoryName;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
  transactionToDelete: Transaction | null;
  setTransactionToDelete: (transaction: Transaction | null) => void;
  handleConfirmDelete: () => Promise<void>;
  expandedTransactionId: string | null;
  setExpandedTransactionId: (id: string | null) => void;
}) => {
  const handleToggleExpand = () => {
    mediumHaptic();
    setExpandedTransactionId(expandedTransactionId === transaction.id ? null : transaction.id);
  };

  return (
    <ExpandableItem
      isExpanded={expandedTransactionId === transaction.id}
      onToggle={handleToggleExpand}
      actions={
        <div className="flex w-full items-stretch gap-2">
          <AlertDialog
            open={!!transactionToDelete && transactionToDelete.id === transaction.id}
            onOpenChange={(open) => !open && setTransactionToDelete(null)}
          >
            <AlertDialogTrigger asChild>
              <HapticButton
                variant="ghost"
                size="sm"
                className="flex-1 rounded-md border border-border text-destructive hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  setTransactionToDelete(transaction);
                }}
                aria-label="Удалить транзакцию"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Удалить
              </HapticButton>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Удалить транзакцию?</AlertDialogTitle>
                <AlertDialogDescription>
                  Вы уверены, что хотите удалить эту транзакцию? Это действие нельзя будет отменить.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={(e) => { e.stopPropagation(); setTransactionToDelete(null); }}>
                  Отмена
                </AlertDialogCancel>
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
              onEdit(transaction);
            }}
            aria-label="Редактировать транзакцию"
          >
            <Edit className="mr-2 h-4 w-4" />
            Редактировать
          </HapticButton>
        </div>
      }
    >
      <div className="bg-card text-card-foreground group flex items-center justify-between rounded-lg border p-3 text-sm">
        <div className="flex items-center space-x-3">
          {transaction.type === 'expense' ? (
            <ArrowDownCircle className="h-5 w-5 flex-shrink-0 text-red-500" />
          ) : (
            <ArrowUpCircle className="h-5 w-5 flex-shrink-0 text-green-500" />
          )}
          <div>
            <div className="font-medium">
              {transaction.name ||
                transaction.categoryName ||
                (transaction.type === 'expense' ? 'Расход' : 'Пополнение')}
            </div>
            <div className="text-muted-foreground text-xs">
              {transaction.categoryName} • {transaction.author.first_name} •{' '}
              {formatDate(transaction.createdAt, { month: 'short', day: 'numeric' })}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span
            className={cn(
              'font-semibold',
              transaction.type === 'expense' ? 'text-red-600' : 'text-green-600'
            )}
          >
            {transaction.type === 'expense' ? '-' : '+'}
            {formatCurrency(transaction.amount)}
          </span>
        </div>
      </div>
    </ExpandableItem>
  );
};

// Основной компонент
export const TransactionList = forwardRef<TransactionListRef>((_, ref) => {
  const { currentBudget } = useBudgets();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const { ref: loadMoreRef, inView } = useInView();
  const ITEMS_PER_PAGE = 10;
  const isInitialLoad = useRef(true);
  const [expandedTransactionId, setExpandedTransactionId] = useState<string | null>(null);

  const [filters, setFilters] = useState<Filters>({
    dateRange: 'all',
    startDate: '',
    endDate: '',
    userId: 'all',
    type: 'all',
    categoryId: 'all',
  });

  // Функция для форматирования даты заголовка группы
  const getGroupDateTitle = (date: Date): string => {
    if (isToday(date)) return 'Сегодня';
    if (isYesterday(date)) return 'Вчера';
    if (differenceInDays(new Date(), date) === 2) return 'Позавчера';
    if (isThisYear(date)) {
      return format(date, 'd MMMM', { locale: ru });
    }
    return format(date, 'd MMMM yyyy', { locale: ru });
  };

  // Группировка транзакций по датам
  const groupedTransactions = useMemo(() => {
    const groups: { [key: string]: TransactionWithCategoryName[] } = {};
    
    transactions.forEach(transaction => {
      const date = new Date(transaction.createdAt);
      const groupKey = format(date, 'yyyy-MM-dd');
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push({
        ...transaction,
        categoryName: categories.find(c => c.id === transaction.categoryId)?.name || 'Без категории',
      });
    });

    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [transactions, categories]);

  // Обработчик изменения фильтров
  const handleFiltersChange = useCallback(async (newFilters: Filters) => {
    setFilters(newFilters);
    setPage(1);
    setTransactions([]);
    setHasMore(true);
    setIsLoading(true);
    
    try {
      const [trans, cats] = await Promise.all([
        mockApi.getTransactionsByBudgetId(currentBudget!.id, {
          page: 1,
          limit: ITEMS_PER_PAGE,
          ...newFilters
        }),
        mockApi.getCategoriesByBudgetId(currentBudget!.id),
      ]);

      setTransactions(trans);
      setCategories(cats);
      setHasMore(trans.length === ITEMS_PER_PAGE);
    } catch (error) {
      console.error('Failed to load transactions/categories:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentBudget]);

  // Функция загрузки данных
  const loadData = useCallback(async (reset = false) => {
    if (!currentBudget) return;
    
    if (reset) {
      setPage(1);
      setTransactions([]);
      setHasMore(true);
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }

    if (isLoading && !reset) return;
    if (!reset && !hasMore) return;
    
    try {
      const [trans, cats] = await Promise.all([
        mockApi.getTransactionsByBudgetId(currentBudget.id, {
          page: reset ? 1 : page,
          limit: ITEMS_PER_PAGE,
          ...filters
        }),
        mockApi.getCategoriesByBudgetId(currentBudget.id),
      ]);

      if (reset) {
        setTransactions(trans);
      } else {
        setTransactions(prev => [...prev, ...trans]);
      }
      
      setCategories(cats);
      setHasMore(trans.length === ITEMS_PER_PAGE);
      
      if (!reset) {
        setPage(prev => prev + 1);
      }
    } catch (error) {
      console.error('Failed to load transactions/categories:', error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
      isInitialLoad.current = false;
    }
  }, [currentBudget, page, isLoading, hasMore, filters]);

  // Экспорт loadData через ref
  useImperativeHandle(ref, () => ({
    loadData: () => loadData(true),
  }), [loadData]);

  // Эффект для загрузки следующей страницы при скролле
  useEffect(() => {
    if (!isInitialLoad.current && inView && hasMore && !isLoading) {
      loadData();
    }
  }, [inView, hasMore, isLoading, loadData]);

  // Эффект для начальной загрузки
  useEffect(() => {
    if (currentBudget && isInitialLoad.current) {
      loadData(true);
    }
  }, [currentBudget, loadData]);

  // Обработчики действий
  const handleAddTransaction = () => {
    setTransactionToEdit(null);
    setIsFormOpen(true);
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setTransactionToEdit(transaction);
    setIsFormOpen(true);
  };

  const handleDeleteTransaction = async (transaction: Transaction) => {
    setTransactionToDelete(transaction);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!transactionToDelete) return;
    try {
      await mockApi.deleteTransaction(transactionToDelete.id);
      await loadData(true);
    } catch (error) {
      console.error('Failed to delete transaction:', error);
    } finally {
      setTransactionToDelete(null);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleTransactionSaved = () => {
    loadData(true);
  };

  // Получаем уникальных пользователей
  const uniqueUsers = useMemo(() => {
    const users = new Map<string, WebAppUser>();
    transactions.forEach(transaction => {
      users.set(transaction.author.id.toString(), transaction.author);
    });
    return Array.from(users.values());
  }, [transactions]);

  if (!currentBudget) return null;

  return (
    <div className="mb-6" data-transaction-list>
      <div className="mb-3 flex items-center justify-between px-1">
        <h3 className="text-md font-semibold">Транзакции:</h3>
        <HapticButton variant="ghost" size="sm" onClick={handleAddTransaction} disabled={isLoading}>
          <PlusCircle className="mr-1 h-4 w-4" />
          Добавить
        </HapticButton>
      </div>

      <TransactionFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        categories={categories}
        uniqueUsers={uniqueUsers}
      />

      <div className="space-y-4">
        {isLoading && transactions.length === 0 ? (
          <TransactionListSkeleton />
        ) : transactions.length === 0 ? (
          <div className="text-muted-foreground bg-card rounded-lg border p-4 text-center">
            Транзакций по этому бюджету еще нет.
          </div>
        ) : (
          <>
            {groupedTransactions.map(([dateKey, transactions]) => (
              <div key={dateKey} className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground px-1">
                  {getGroupDateTitle(new Date(dateKey))}
                </h4>
                {transactions.map((transaction) => (
                  <TransactionItem
                    key={transaction.id}
                    transaction={transaction}
                    onEdit={handleEditTransaction}
                    onDelete={handleDeleteTransaction}
                    transactionToDelete={transactionToDelete}
                    setTransactionToDelete={setTransactionToDelete}
                    handleConfirmDelete={handleConfirmDelete}
                    expandedTransactionId={expandedTransactionId}
                    setExpandedTransactionId={setExpandedTransactionId}
                  />
                ))}
              </div>
            ))}
            
            {hasMore && (
              <div ref={loadMoreRef} className="space-y-2">
                {isLoadingMore && (
                  <>
                    <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                    <div className="space-y-2">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="bg-card rounded-lg border p-3">
                          <div className="flex items-center space-x-3">
                            <div className="h-5 w-5 bg-muted rounded-full animate-pulse" />
                            <div className="space-y-2 flex-1">
                              <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                              <div className="h-3 w-24 bg-muted rounded animate-pulse" />
                            </div>
                            <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
            {!hasMore && transactions.length > 0 && (
              <div className="text-muted-foreground text-sm text-center py-2">
                Больше транзакций нет
              </div>
            )}
          </>
        )}
      </div>

      {currentBudget && (
        <TransactionForm
          budgetId={currentBudget.id}
          transactionToEdit={transactionToEdit}
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          onTransactionSaved={handleTransactionSaved}
        />
      )}
    </div>
  );
});
