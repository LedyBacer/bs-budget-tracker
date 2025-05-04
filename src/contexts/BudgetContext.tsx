import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
  ReactNode,
} from 'react';
import { Budget } from '@/types';
import * as mockApi from '@/lib/mockData'; // Импортируем наши моковые функции

interface BudgetContextType {
  allBudgets: Budget[];
  currentBudget: Budget | null;
  isLoadingBudgets: boolean;
  errorLoadingBudgets: Error | null;
  selectBudget: (budgetId: string | null) => void;
  reloadBudgets: () => Promise<void>;
  addBudget: (name: string, totalAmount: number) => Promise<Budget | null>;
}

const BudgetContext = createContext<BudgetContextType | undefined>(undefined);

export const BudgetProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [allBudgets, setAllBudgets] = useState<Budget[]>([]);
  const [currentBudgetId, setCurrentBudgetId] = useState<string | null>(null);
  const [isLoadingBudgets, setIsLoadingBudgets] = useState(true);
  const [errorLoadingBudgets, setErrorLoadingBudgets] = useState<Error | null>(null);

  const currentBudget = allBudgets.find((b) => b.id === currentBudgetId) || null;

  // Функция для загрузки/перезагрузки списка бюджетов
  const reloadBudgets = useCallback(async () => {
    setIsLoadingBudgets(true);
    setErrorLoadingBudgets(null);
    console.log('BudgetContext: Reloading budgets...');
    try {
      const budgets = await mockApi.getBudgets();
      setAllBudgets(budgets);
      // Если текущий выбранный бюджет исчез после перезагрузки, сбрасываем выбор
      if (currentBudgetId && !budgets.some((b) => b.id === currentBudgetId)) {
        setCurrentBudgetId(null);
      }
      // Если бюджет не выбран, выбрать первый из списка автоматически
      if (!currentBudgetId && budgets.length > 0) {
        setCurrentBudgetId(budgets[0].id);
      }
    } catch (err) {
      console.error('Failed to load budgets:', err);
      setErrorLoadingBudgets(err instanceof Error ? err : new Error('Failed to load budgets'));
    } finally {
      setIsLoadingBudgets(false);
    }
  }, [currentBudgetId]); // Добавляем currentBudgetId в зависимости, чтобы обработать его сброс

  // Загружаем бюджеты при первом монтировании провайдера
  useEffect(() => {
    reloadBudgets();
  }, [reloadBudgets]); // reloadBudgets теперь зависит от currentBudgetId

  // Функция выбора бюджета
  const selectBudget = (budgetId: string | null) => {
    console.log('BudgetContext: Selecting budget', budgetId);
    setCurrentBudgetId(budgetId);
  };

  // Функция добавления бюджета
  const addBudget = async (name: string, totalAmount: number): Promise<Budget | null> => {
    try {
      const newBudget = await mockApi.addBudget(name, totalAmount);
      await reloadBudgets(); // Перезагружаем список после добавления
      selectBudget(newBudget.id); // Выбираем новый бюджет
      return newBudget;
    } catch (error) {
      console.error('Failed to add budget:', error);
      // Можно пробросить ошибку или показать уведомление
      return null;
    }
  };

  const value = {
    allBudgets,
    currentBudget,
    isLoadingBudgets,
    errorLoadingBudgets,
    selectBudget,
    reloadBudgets,
    addBudget,
  };

  return <BudgetContext.Provider value={value}>{children}</BudgetContext.Provider>;
};

// Хук для удобного использования контекста
export const useBudgets = (): BudgetContextType => {
  const context = useContext(BudgetContext);
  if (context === undefined) {
    throw new Error('useBudgets must be used within a BudgetProvider');
  }
  return context;
};
