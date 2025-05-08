// hooks/useTransactionListRedux.ts
import { useState, useCallback, useEffect, useRef } from 'react';
import { Transaction, WebAppUser } from '@/types';
import { useTransactionsRedux } from './useTransactionsRedux';
import { useCategoriesRedux } from './useCategoriesRedux';

const DEFAULT_PAGE_LIMIT = 10;

interface TransactionListOptions {
  dateRange?: 'all' | 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth' | 'custom';
  startDate?: string;
  endDate?: string;
  type?: 'all' | 'expense' | 'income';
  categoryId?: string;
  userId?: string;
}

interface TransactionWithCategoryName extends Transaction {
  categoryName: string;
}

export const useTransactionListRedux = (
  budgetId: string | null,
  initialFilters?: TransactionListOptions
) => {
  const [accumulatedTransactions, setAccumulatedTransactions] = useState<Transaction[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreState, setHasMoreState] = useState(true);
  const [appliedFilters, setAppliedFilters] = useState<TransactionListOptions>(
    initialFilters || {}
  );

  const [isActuallyLoadingInitial, setIsActuallyLoadingInitial] = useState(false);
  const [isActuallyLoadingMore, setIsActuallyLoadingMore] = useState(false);

  const fetchOperationInProgress = useRef(false); // Основная блокировка операций фетча

  const {
    transactions: newTransactionsFromHook,
    totalTransactionsCount,
    isLoadingTransactions: isLoadingPageFromBaseHook, // Флаг от RTK Query
    errorLoadingTransactions,
    addTransaction,
    updateTransaction,
    deleteTransaction: deleteTransactionMutation,
  } = useTransactionsRedux(budgetId, {
    ...appliedFilters,
    page: currentPage,
    limit: DEFAULT_PAGE_LIMIT,
  });

  const { categories, reloadCategories } = useCategoriesRedux(budgetId);

  // Эффект №1: Управление флагами загрузки (isActuallyLoading* ) и блокировкой fetchOperationInProgress
  useEffect(() => {
    if (!budgetId) {
      setIsActuallyLoadingInitial(false);
      setIsActuallyLoadingMore(false);
      fetchOperationInProgress.current = false; // Сброс блокировки если нет budgetId
      return;
    }

    if (isLoadingPageFromBaseHook) {
      // Если RTK Query начал загрузку
      // console.log(`[useTxListRedux DEBUG_EFFECT_1] RTK Loading (page ${currentPage}). Setting fetchOperationInProgress=true.`);
      fetchOperationInProgress.current = true; // Блокируем новые операции
      if (currentPage === 1) {
        // Если это первая страница (возможно, после reloadData)
        // И если нет накопленных данных (т.е. это действительно первая загрузка для этого набора фильтров)
        if (accumulatedTransactions.length === 0) {
          // console.log("[useTxListRedux DEBUG_EFFECT_1] Setting isActuallyLoadingInitial=true");
          setIsActuallyLoadingInitial(true);
        }
        setIsActuallyLoadingMore(false); // Не может быть одновременно
      } else {
        // Если это не первая страница, значит это догрузка
        // console.log("[useTxListRedux DEBUG_EFFECT_1] Setting isActuallyLoadingMore=true");
        setIsActuallyLoadingInitial(false);
        setIsActuallyLoadingMore(true); // Устанавливаем флаг догрузки
      }
    } else {
      // Если RTK Query ЗАВЕРШИЛ загрузку
      // console.log(`[useTxListRedux DEBUG_EFFECT_1] RTK NOT Loading (page ${currentPage}). Resetting loading flags.`);
      if (isActuallyLoadingInitial) setIsActuallyLoadingInitial(false);
      if (isActuallyLoadingMore) setIsActuallyLoadingMore(false);
      // fetchOperationInProgress.current будет сброшен в Эффекте №2 ПОСЛЕ обработки данных
    }
  }, [
    isLoadingPageFromBaseHook,
    currentPage,
    budgetId,
    accumulatedTransactions.length,
    isActuallyLoadingInitial,
    isActuallyLoadingMore,
  ]);
  // isActuallyLoadingInitial и isActuallyLoadingMore добавлены, чтобы эффект мог сбросить их, если они были true

  // Эффект №2: Обработка полученных данных, обновление hasMoreState и сброс основной блокировки
  useEffect(() => {
    if (!budgetId || isLoadingPageFromBaseHook) {
      // Работаем только если RTK Query НЕ грузит
      return;
    }

    // console.log(`[useTxListRedux DEBUG_EFFECT_2] Processing data (page ${currentPage}). RTK Not Loading.`);

    // Данные пришли (или ошибка)
    if (errorLoadingTransactions) {
      console.warn(
        '[useTransactionListRedux] Error processing transactions:',
        errorLoadingTransactions
      );
      setHasMoreState(false); // При ошибке считаем, что больше грузить нечего
    } else if (newTransactionsFromHook) {
      let newAccumulated: Transaction[];
      if (currentPage === 1) {
        newAccumulated = newTransactionsFromHook;
        // console.log("[useTxListRedux DEBUG_EFFECT_2] Setting initial accumulated data:", newAccumulated.length);
      } else {
        const existingIds = new Set(accumulatedTransactions.map((t) => t.id));
        const trulyNew = newTransactionsFromHook.filter((t) => !existingIds.has(t.id));
        newAccumulated =
          trulyNew.length > 0 ? [...accumulatedTransactions, ...trulyNew] : accumulatedTransactions;
        // console.log(`[useTxListRedux DEBUG_EFFECT_2] Appending data. Prev: ${accumulatedTransactions.length}, New from hook: ${newTransactionsFromHook.length}, Truly new: ${trulyNew.length}, Total acc: ${newAccumulated.length}`);
      }
      setAccumulatedTransactions(newAccumulated);

      // Логика для hasMoreState
      const receivedLessThanLimit = newTransactionsFromHook.length < DEFAULT_PAGE_LIMIT;
      const allItemsLoaded = newAccumulated.length >= totalTransactionsCount;
      let newHasMoreCalc = true;

      if (newTransactionsFromHook.length === 0 && currentPage > 1 && newAccumulated.length > 0) {
        newHasMoreCalc = false;
      } else if (receivedLessThanLimit) {
        newHasMoreCalc = false;
      } else if (allItemsLoaded && totalTransactionsCount > 0) {
        newHasMoreCalc = false;
      } else if (newAccumulated.length === 0 && totalTransactionsCount === 0 && currentPage === 1) {
        newHasMoreCalc = false;
      }
      // console.log(`[useTxListRedux DEBUG_EFFECT_2] hasMore Check: currPage: ${currentPage}, newHookLen: ${newTransactionsFromHook.length}, accLen: ${newAccumulated.length}, totalCount: ${totalTransactionsCount}, received<Limit: ${receivedLessThanLimit}, allLoaded: ${allItemsLoaded} => newHasMore: ${newHasMoreCalc}`);

      if (hasMoreState !== newHasMoreCalc) {
        // console.log(`[useTxListRedux DEBUG_EFFECT_2] Setting hasMoreState to: ${newHasMoreCalc}`);
        setHasMoreState(newHasMoreCalc);
      }
    } else {
      // newTransactionsFromHook is null/undefined, но не было ошибки
      if (currentPage > 1) {
        // Если это не первая страница, и мы ничего не получили
        // console.log("[useTxListRedux DEBUG_EFFECT_2] No new transactions from hook on page > 1. Setting hasMoreState=false.");
        setHasMoreState(false);
      }
    }

    // Сбрасываем главную блокировку ПОСЛЕ ВСЕХ ОБНОВЛЕНИЙ СОСТОЯНИЯ
    // console.log(`[useTxListRedux DEBUG_EFFECT_2] Data processed for page ${currentPage}. Setting fetchOperationInProgress=false (delayed).`);
    setTimeout(() => {
      // Даем React время на рендер перед разблокировкой
      fetchOperationInProgress.current = false;
    }, 0);
  }, [
    isLoadingPageFromBaseHook, // Ключевой триггер - окончание загрузки RTK
    newTransactionsFromHook, // Новые данные
    errorLoadingTransactions,
    currentPage,
    budgetId,
    totalTransactionsCount,
    accumulatedTransactions, // Важно для корректного расчета newAccumulated при догрузке
    hasMoreState, // Для сравнения и предотвращения лишних setHasMoreState
  ]);

  const loadMore = useCallback(() => {
    // console.log(`[useTxListRedux loadMore CALLED] fetchOpInProgress: ${fetchOperationInProgress.current}, hasMore: ${hasMoreState}, budgetId: ${budgetId}`);
    if (!fetchOperationInProgress.current && hasMoreState && budgetId) {
      // console.log(`[useTxListRedux loadMore EXECUTING] Page ${currentPage} -> ${currentPage + 1}. Setting fetchOperationInProgress=true.`);
      fetchOperationInProgress.current = true; // Блокируем немедленно
      // setIsActuallyLoadingMore(true); // Убрано. Теперь управляется Эффектом №1
      setCurrentPage((prevPage) => prevPage + 1);
    } else {
      // console.log(`[useTxListRedux loadMore SKIPPED] Conditions not met.`);
    }
  }, [hasMoreState, budgetId, currentPage]); // Добавил currentPage для актуальности в замыкании при проверке

  const reloadData = useCallback(
    async (newFilters?: TransactionListOptions) => {
      if (budgetId && !fetchOperationInProgress.current) {
        // console.log(`[useTxListRedux reloadData EXECUTING] Filters:`, newFilters);
        fetchOperationInProgress.current = true; // Блокируем немедленно
        // setIsActuallyLoadingInitial(true); // Убрано. Теперь управляется Эффектом №1
        // setIsActuallyLoadingMore(false);
        setAppliedFilters(newFilters || {});
        setAccumulatedTransactions([]); // Очищаем, чтобы Эффект №1 правильно установил isActuallyLoadingInitial
        setCurrentPage(1);
        setHasMoreState(true); // Сбрасываем в true, будет пересчитано
        await reloadCategories();
      }
    },
    [budgetId, reloadCategories]
  );

  const handleDeleteTransactionOptimistic = useCallback(
    async (transactionId: string) => {
      if (!budgetId) return false;
      try {
        // Удаляем транзакцию из API
        const success = await deleteTransactionMutation(transactionId);
        
        if (success) {
          // Удаляем транзакцию из локального состояния
          setAccumulatedTransactions((prev) => prev.filter((t) => t.id !== transactionId));
          
          // // Принудительно перезагружаем транзакции при следующем цикле рендеринга
          // setTimeout(() => {
          //   // Мы используем setTimeout, чтобы избежать потенциальных проблем с React обновлениями состояния
          //   if (currentPage === 1) {
          //     // Если мы на первой странице, просто обновляем с текущими фильтрами
          //     reloadData(appliedFilters);
          //   } else {
          //     // Если мы не на первой странице, сначала сбрасываем на первую страницу
          //     setCurrentPage(1);
          //     setAccumulatedTransactions([]);
          //     setHasMoreState(true);
          //   }
          // }, 0);
        }
        
        return success;
      } catch (error) {
        console.error('[useTransactionListRedux] Failed to delete transaction:', error);
        return false;
      }
    },
    [deleteTransactionMutation, budgetId, currentPage, reloadData, appliedFilters]
  );

  const transactionsWithCategoryName: TransactionWithCategoryName[] = accumulatedTransactions.map(
    (transaction) => {
      // Исправляем categoryId на category_id
      const category = categories.find((c) => c.id === transaction.category_id);
      return {
        ...transaction,
        categoryName: category?.name || 'Неизвестная категория',
      };
    }
  );

  const uniqueUsers = accumulatedTransactions.reduce<WebAppUser[]>((acc, transaction) => {
    // ... (без изменений)
    const author = transaction.author as WebAppUser | undefined;
    if (author) {
      const exists = acc.find((user) => user.id === author.id);
      if (!exists) {
        acc.push(author);
      }
    }
    return acc;
  }, []);

  return {
    transactions: transactionsWithCategoryName,
    categories,
    uniqueUsers,
    isLoading: isActuallyLoadingInitial,
    isLoadingMore: isActuallyLoadingMore,
    errorLoading: errorLoadingTransactions || null,
    hasMoreTransactions: hasMoreState,
    loadMore,
    reloadData,
    addTransaction,
    updateTransaction,
    deleteTransaction: handleDeleteTransactionOptimistic,
    totalAccumulatedCount: accumulatedTransactions.length,
    totalFilteredCount: totalTransactionsCount,
  };
};
