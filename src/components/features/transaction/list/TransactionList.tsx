import { useState, useEffect, forwardRef, useImperativeHandle, useRef } from 'react';
import { Category, Transaction, WebAppUser } from '@/types';
import * as mockApi from '@/lib/mockData';
import { FullTransactionForm } from '../forms/FullTransactionForm';
import { TransactionListSkeleton } from '@/components/ui/skeletons';
import { useInView } from 'react-intersection-observer';
import { TransactionWithCategoryName } from '../utils/types';
import { TransactionFilters } from './TransactionFilters';
import { TransactionGroup } from './TransactionGroup';
import { AddTransactionButtonContainer } from './AddTransactionButtonContainer';
import { useTransactionFilters } from '../hooks/useTransactionFilters';
import { useTransactionGroups } from '../hooks/useTransactionGroups';

export interface TransactionListRef {
  loadData: () => Promise<void>;
}

interface TransactionListProps {
  budgetId: string;
  onMajorDataChange?: () => void | Promise<void>;
}

export const TransactionList = forwardRef<TransactionListRef, TransactionListProps>(
  ({ budgetId, onMajorDataChange }, ref) => {
    // Состояния для данных
    const [transactions, setTransactions] = useState<TransactionWithCategoryName[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [uniqueUsers, setUniqueUsers] = useState<WebAppUser[]>([]);
    
    // Состояния для загрузки и пагинации
    const [isLoading, setIsLoading] = useState(false);
    const [hasMoreTransactions, setHasMoreTransactions] = useState(true);
    const [page, setPage] = useState(1);
    
    // Состояния для управления UI
    const [expandedTransactionId, setExpandedTransactionId] = useState<string | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);
    
    const loadMoreRef = useRef<HTMLDivElement>(null);
    const { ref: inViewRef, inView } = useInView();

    // Применяем фильтры к транзакциям
    const { filters, updateFilters, filteredTransactions } = useTransactionFilters(transactions);
    
    // Группируем отфильтрованные транзакции по дате
    const { groupedTransactions, sortedGroupKeys } = useTransactionGroups(filteredTransactions);

    // Загрузка транзакций
    const loadTransactions = async (pageNum: number, append = false) => {
      if (!budgetId) return;
      
      try {
        setIsLoading(true);
        const response = await mockApi.getTransactionsByBudgetId(budgetId, { page: pageNum });
        
        // Загружаем категории один раз для получения их имён
        let allCategories: Category[] = [];
        try {
          allCategories = await mockApi.getCategoriesByBudgetId(budgetId);
        } catch (error) {
          console.error('Failed to load categories for transaction names:', error);
        }
        
        // Добавляем имена категорий к транзакциям
        const transactionsWithCategories: TransactionWithCategoryName[] = response.map((transaction) => {
          const category = allCategories.find(c => c.id === transaction.categoryId);
          return {
            ...transaction,
            categoryName: category?.name || 'Неизвестная категория',
          };
        });

        if (append) {
          setTransactions((prev) => [...prev, ...transactionsWithCategories]);
        } else {
          setTransactions(transactionsWithCategories);
        }
        
        setHasMoreTransactions(response.length === 10); // Если получили полную страницу
        
        // Извлекаем уникальных пользователей из транзакций
        if (page === 1) {
          const users = response.reduce<WebAppUser[]>((acc, transaction) => {
            const exists = acc.find((user) => user.id === transaction.author.id);
            if (!exists) {
              acc.push(transaction.author);
            }
            return acc;
          }, []);
          setUniqueUsers(users);
        }
      } catch (error) {
        console.error('Failed to load transactions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Загрузка категорий
    const loadCategories = async () => {
      try {
        const cats = await mockApi.getCategoriesByBudgetId(budgetId);
        setCategories(cats);
      } catch (error) {
        console.error('Failed to load categories:', error);
      }
    };

    // Начальная загрузка данных
    useEffect(() => {
      if (budgetId) {
        loadTransactions(1);
        loadCategories();
      }
    }, [budgetId]);

    // Загрузка при скроллинге до конца списка
    useEffect(() => {
      if (inView && hasMoreTransactions && !isLoading) {
        setPage((prev) => prev + 1);
        loadTransactions(page + 1, true);
      }
    }, [inView, hasMoreTransactions, isLoading]);

    // Предоставляем функцию загрузки данных через ref
    useImperativeHandle(ref, () => ({
      loadData: async () => {
        setPage(1);
        await loadTransactions(1);
        await loadCategories();
      },
    }));

    // Функции для управления транзакциями
    const handleAddTransaction = () => {
      setTransactionToEdit(null);
      setIsEditModalOpen(true);
    };

    const handleEditTransaction = (transaction: Transaction) => {
      setTransactionToEdit(transaction);
      setIsEditModalOpen(true);
    };

    const handleDeleteTransaction = async (transaction: Transaction) => {
      try {
        await mockApi.deleteTransaction(transaction.id);
        // Обновляем список транзакций, исключая удаленную
        setTransactions((prev) => prev.filter((t) => t.id !== transaction.id));
        // Сигнализируем о необходимости глобального обновления, если callback передан
        if (onMajorDataChange) {
          await onMajorDataChange();
        }
      } catch (error) {
        console.error('Failed to delete transaction:', error);
      }
    };

    const handleTransactionSaved = async () => {
      // Перезагружаем все данные после сохранения транзакции
      setPage(1); // Сбрасываем на первую страницу
      await loadTransactions(1, false); // Перезагружаем транзакции для первой страницы
      await loadCategories(); // Перезагружаем категории

      // Сигнализируем о необходимости глобального обновления, если callback передан
      if (onMajorDataChange) {
        await onMajorDataChange();
      }
    };

    // Отображаем скелетон загрузки, если данные ещё не загружены
    if (isLoading && transactions.length === 0) {
      return <TransactionListSkeleton />;
    }

    return (
      <div className="space-y-1">
        {/* Кнопка добавления */}
        <AddTransactionButtonContainer 
          onClick={handleAddTransaction} 
          title="Транзакции" // Добавляем заголовок
        />

        {/* Фильтры */}
        <TransactionFilters
          filters={filters}
          onFiltersChange={updateFilters}
          categories={categories}
          uniqueUsers={uniqueUsers}
        />

        {/* Список транзакций, сгруппированных по дате */}
        <div className="space-y-6">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Нет транзакций, соответствующих фильтрам
            </div>
          ) : (
            sortedGroupKeys.map((dateKey) => (
              <TransactionGroup
                key={dateKey}
                date={new Date(dateKey)}
                transactions={groupedTransactions[dateKey]}
                onEdit={handleEditTransaction}
                onDelete={handleDeleteTransaction}
                expandedTransactionId={expandedTransactionId}
                setExpandedTransactionId={setExpandedTransactionId}
              />
            ))
          )}
        </div>

        {/* Элемент для отслеживания загрузки новых данных */}
        {hasMoreTransactions && (
          <div ref={inViewRef} className="py-4">
            {isLoading && <TransactionListSkeleton />}
          </div>
        )}

        {/* Форма редактирования */}
        <FullTransactionForm
          budgetId={budgetId}
          transactionToEdit={transactionToEdit}
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          onTransactionSaved={handleTransactionSaved}
        />
      </div>
    );
  }
); 