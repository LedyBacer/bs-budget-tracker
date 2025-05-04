// src/contexts/BudgetContext.tsx
import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
  ReactNode,
} from 'react';
import { Budget } from '@/types';
import * as mockApi from '@/lib/mockData';
import { popup } from '@telegram-apps/sdk-react'; // Для ошибок

interface BudgetContextType {
  allBudgets: Budget[];
  currentBudget: Budget | null;
  isLoadingBudgets: boolean;
  errorLoadingBudgets: Error | null;
  selectBudget: (budgetId: string | null) => void;
  reloadBudgets: () => Promise<void>;
  addBudget: (name: string, totalAmount: number) => Promise<Budget | null>;
  // Добавляем новые методы
  updateBudget: (id: string, name: string, totalAmount: number) => Promise<Budget | null>;
  deleteBudget: (id: string) => Promise<boolean>;
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
      console.log('BudgetContext: Calling mockApi.addBudget');
      const newBudget = await mockApi.addBudget(name, totalAmount);
      await reloadBudgets(); // Перезагружаем список после добавления
      // Автоматически выбираем новый бюджет после перезагрузки
      // selectBudget(newBudget.id); // selectBudget теперь вызывается внутри reloadBudgets при необходимости
      console.log('BudgetContext: Budget added successfully, new budget ID:', newBudget.id);
      return newBudget;
    } catch (error) {
      console.error('BudgetContext: Failed to add budget:', error);
      popup.open.ifAvailable({
        title: 'Ошибка добавления',
        message: error instanceof Error ? error.message : 'Неизвестная ошибка',
      });
      return null;
    }
  };

  // --- Новая функция updateBudget ---
  const updateBudget = async (
    id: string,
    name: string,
    totalAmount: number
  ): Promise<Budget | null> => {
    try {
      console.log('BudgetContext: Calling mockApi.updateBudget for', id);
      const updatedBudget = await mockApi.updateBudget(id, name, totalAmount);
      await reloadBudgets(); // Перезагружаем список
      // Если обновили текущий бюджет, он останется выбранным после reload
      console.log('BudgetContext: Budget updated successfully:', updatedBudget.id);
      return updatedBudget;
    } catch (error) {
      console.error('BudgetContext: Failed to update budget:', error);
      popup.open.ifAvailable({
        title: 'Ошибка обновления',
        message: error instanceof Error ? error.message : 'Неизвестная ошибка',
      });
      return null;
    }
  };

  // --- Новая функция deleteBudget ---
  const deleteBudget = async (id: string): Promise<boolean> => {
    try {
      console.log('BudgetContext: Calling mockApi.deleteBudget for', id);
      const success = await mockApi.deleteBudget(id);
      if (success) {
        await reloadBudgets(); // Перезагружаем список
        // selectBudget(null) будет вызван в reloadBudgets, если удалили текущий
        console.log('BudgetContext: Budget deleted successfully:', id);
      }
      return success;
    } catch (error) {
      console.error('BudgetContext: Failed to delete budget:', error);
      popup.open.ifAvailable({
        title: 'Ошибка удаления',
        message: error instanceof Error ? error.message : 'Неизвестная ошибка',
      });
      return false;
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
    updateBudget, // Добавляем в контекст
    deleteBudget, // Добавляем в контекст
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
