// src/App.tsx
import { useEffect, useState, useRef } from 'react';
import {
  useLaunchParams,
  miniApp,
  backButton,
  // themeParams, // Не используется напрямую здесь, но инициализируется в main.tsx
} from '@telegram-apps/sdk-react';
import { WebAppUser } from '@/types';
import { ThemeProvider } from '@/components/theme-provider';
// import { Header } from '@/components/layout/Header'; // Header пока закомментирован
import { Footer } from '@/components/layout/Footer';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { BudgetList } from '@/components/features/budget/BudgetList';
import { BudgetDetails } from '@/components/features/budget/BudgetDetails';
import { CategoryList } from '@/components/features/category';
import { TransactionList, SimpleTransactionForm } from '@/components/features/transaction';
import type { TransactionListRef } from '@/components/features/transaction/list/TransactionList';
import {
  BudgetListSkeleton,
  BudgetDetailsSkeleton,
  CategoryListSkeleton,
  TransactionListSkeleton,
  // Skeleton, // Skeleton используется внутри других скелетонов
} from '@/components/ui/skeletons';
import { PlusCircle } from 'lucide-react';
import { ActionButton } from '@/components/ui/action-button';
import { ReduxProvider } from '@/lib/redux/provider';
import { useBudgetsRedux } from '@/hooks/useBudgetsRedux';
// import { useAppSelector } from '@/lib/redux/hooks'; // Не нужен, если dataVersion удален
// import { selectDataVersion } from '@/lib/redux/slices/budgetsSlice'; // dataVersion удален

function AppContent() {
  const {
    currentBudget,
    allBudgets,
    isLoadingBudgets,
    isAuthLoading,
    errorLoadingBudgets,
    reloadBudgets,
    selectBudget,
  } = useBudgetsRedux();
  // const dataVersion = useAppSelector(selectDataVersion); // УДАЛЕНО
  const launchParams = useLaunchParams();
  const [isSimpleFormOpen, setIsSimpleFormOpen] = useState(false);
  const transactionListRef = useRef<TransactionListRef | null>(null);

  const currentUser = // Типизация WebAppUser уже есть в types/telegram.ts
    launchParams.tgWebAppData &&
    typeof launchParams.tgWebAppData === 'object' &&
    'user' in launchParams.tgWebAppData
      ? (launchParams.tgWebAppData.user as WebAppUser | undefined)
      : undefined;

  useEffect(() => {
    miniApp.ready();
  }, []);

  useEffect(() => {
    if (!isLoadingBudgets && !currentBudget && allBudgets.length > 0) {
      selectBudget(allBudgets[0].id);
    }
  }, [isLoadingBudgets, currentBudget, allBudgets, selectBudget]);

  useEffect(() => {
    const handleBackClick = () => {
      // Вместо miniApp.close() можно реализовать навигацию назад внутри приложения, если она есть.
      // Пока оставим закрытие, если это основное поведение кнопки "Назад" на главном экране.
      if (miniApp.close.isAvailable && miniApp.close.isAvailable()) {
        miniApp.close();
      } else {
        // Возможно, здесь стоит добавить логику для history.back() если используется роутер
        console.log('Back button clicked, but miniApp.close is not available.');
      }
    };
    if (backButton.show.isAvailable && backButton.show.isAvailable()) {
      backButton.show();
    }
    const cleanup =
      backButton.onClick.isAvailable && backButton.onClick.isAvailable()
        ? backButton.onClick(handleBackClick)
        : undefined;
    return () => cleanup?.();
  }, []);

  // Эта функция теперь будет вызываться TransactionList напрямую через свои хуки
  // или через проброшенный reloadBudgets (если изменение транзакции должно обновить сам бюджет)
  const refreshBudgetAndCategoryData = async () => {
    // console.log('App.tsx: Refreshing budget and category data');
    await reloadBudgets();
    // Категории и транзакции будут обновляться через свои хуки и инвалидацию тегов RTK Query
  };

  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col">
      {/* <Header /> */}
      <PageWrapper>
        {isAuthLoading || isLoadingBudgets && !allBudgets.length ? ( // Показываем скелет только если совсем нет данных
          <BudgetListSkeleton />
        ) : (
          <BudgetList />
        )}

        {currentBudget && isLoadingBudgets ? ( // Если есть currentBudget, но он обновляется
          <>
            <BudgetDetailsSkeleton />
            <div className="mb-6">
              {/* <Skeleton className="h-10 w-full" /> // Заменено на ActionButton skeleton если нужно */}
              <ActionButton
                onClick={() => {}}
                text="Добавить транзакцию"
                icon={<PlusCircle className="mr-2 h-4 w-4" />}
                variant="default"
                size="lg"
                fullWidth={true}
                disabled={true}
                className="bg-muted animate-pulse"
              />
            </div>
            <CategoryListSkeleton />
            <TransactionListSkeleton />
          </>
        ) : errorLoadingBudgets && !currentBudget ? ( // Ошибка только если нет текущего бюджета
          <div className="text-destructive p-4 text-center">Ошибка загрузки данных бюджета.</div>
        ) : currentBudget ? (
          <>
            {/* key={`${currentBudget.id}-${dataVersion}`} // УДАЛЕНО dataVersion */}
            <BudgetDetails key={currentBudget.id} />
            <div className="mb-6">
              <ActionButton
                onClick={() => setIsSimpleFormOpen(true)}
                text="Добавить транзакцию"
                icon={<PlusCircle className="mr-2 h-4 w-4" />}
                variant="default"
                size="lg"
                fullWidth={true}
              />
            </div>
            {/* key={`${currentBudget.id}-categories-${dataVersion}`} // УДАЛЕНО dataVersion */}
            <CategoryList key={`${currentBudget.id}-categories`} />{' '}
            {/* Можно оставить key по ID бюджета для сброса состояния списка категорий при смене бюджета */}
            <TransactionList
              ref={transactionListRef}
              budgetId={currentBudget.id}
              // onMajorDataChange больше не нужен здесь, т.к. инвалидация тегов RTK Query должна обновлять бюджеты
              // onMajorDataChange={refreshBudgetAndCategoryData}
              key={`${currentBudget.id}-transactions`}
            />
            {/* SimpleTransactionForm для текущего бюджета */}
            <SimpleTransactionForm
              budgetId={currentBudget.id}
              open={isSimpleFormOpen}
              onOpenChange={setIsSimpleFormOpen}
              onTransactionSaved={async () => {
                // После сохранения транзакции через простую форму:
                // 1. Обновить список транзакций (если TransactionList сам это не делает через подписку)
                if (transactionListRef.current?.reloadData) {
                  // transactionListRef.current.reloadData(); // reloadData теперь принимает фильтры
                  // и будет вызван изнутри TransactionList при смене фильтров
                }
                // 2. Обновить данные бюджета и категорий (RTK Query должен сделать это через инвалидацию)
                // await refreshBudgetAndCategoryData(); // Это вызовет reloadBudgets()
                // Мутации транзакций уже инвалидируют теги бюджетов и категорий
              }}
            />
          </>
        ) : (
          !isLoadingBudgets && ( // Если не загрузка и нет currentBudget (и нет ошибки)
            <div className="text-muted-foreground p-4 text-center">
              Создайте или выберите бюджет для начала.
            </div>
          )
        )}
      </PageWrapper>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <ReduxProvider>
        <AppContent />
      </ReduxProvider>
    </ThemeProvider>
  );
}

export default App;
