// src/App.tsx
import { useEffect, useState, useRef } from 'react';
import {
  useLaunchParams,
  miniApp,
  backButton,
  themeParams,
} from '@telegram-apps/sdk-react';
import { WebAppUser } from '@/types';
import { ThemeProvider } from '@/components/theme-provider';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { BudgetList } from '@/components/features/budget/BudgetList';
import { BudgetDetails } from '@/components/features/budget/BudgetDetails';
import { CategoryList } from '@/components/features/category';
import { 
  TransactionList, 
  SimpleTransactionForm
} from '@/components/features/transaction';
import {
  BudgetListSkeleton,
  BudgetDetailsSkeleton,
  CategoryListSkeleton,
  TransactionListSkeleton,
  Skeleton,
} from '@/components/ui/skeletons';
import { PlusCircle } from 'lucide-react';
import { ActionButton } from '@/components/ui/action-button';
import { ReduxProvider } from '@/lib/redux/provider';
import { useBudgetsRedux } from '@/hooks/useBudgetsRedux';
import { useAppSelector } from '@/lib/redux/hooks';
import { selectDataVersion } from '@/lib/redux/slices/budgetsSlice';

function AppContent() {
  const { currentBudget, isLoadingBudgets, errorLoadingBudgets, reloadBudgets } = useBudgetsRedux();
  const dataVersion = useAppSelector(selectDataVersion);
  const launchParams = useLaunchParams();
  const [isSimpleFormOpen, setIsSimpleFormOpen] = useState(false);
  const transactionListRef = useRef<{ loadData: () => Promise<void> } | null>(null);

  const currentUser =
    launchParams.tgWebAppData &&
    typeof launchParams.tgWebAppData === 'object' &&
    'user' in launchParams.tgWebAppData
      ? (launchParams.tgWebAppData.user as WebAppUser | undefined)
      : undefined;

  useEffect(() => {
    miniApp.ready();
  }, []);

  useEffect(() => {
    const handleBackClick = () => {
      if (miniApp.close.isAvailable()) {
        miniApp.close();
      }
    };
    backButton.show.ifAvailable();
    const cleanup = backButton.onClick.isAvailable()
      ? backButton.onClick(handleBackClick)
      : undefined;
    return () => cleanup?.();
  }, []);

  const refreshDependentData = async () => {
    await reloadBudgets(); 
  };

  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col">
      {/* <Header /> */}
      <PageWrapper>
        {isLoadingBudgets ? (
          <BudgetListSkeleton />
        ) : (
          <BudgetList />
        )}

        {isLoadingBudgets ? (
          <>
            <BudgetDetailsSkeleton />
            <div className="mb-6">
              <Skeleton className="h-10 w-full" />
            </div>
            <CategoryListSkeleton />
            <TransactionListSkeleton />
          </>
        ) : errorLoadingBudgets ? (
          <div className="text-destructive p-4 text-center">Ошибка загрузки данных.</div>
        ) : currentBudget ? (
          <>
            <BudgetDetails key={`${currentBudget.id}-${dataVersion}`} />
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
            <CategoryList key={`${currentBudget.id}-categories-${dataVersion}`} />
            <TransactionList 
              ref={transactionListRef} 
              budgetId={currentBudget.id}
              onMajorDataChange={refreshDependentData} 
            />
            {currentBudget && (
              <SimpleTransactionForm
                budgetId={currentBudget.id}
                open={isSimpleFormOpen}
                onOpenChange={setIsSimpleFormOpen}
                onTransactionSaved={async () => {
                  if (transactionListRef.current) {
                    await transactionListRef.current.loadData(); 
                  }
                  await refreshDependentData(); 
                }}
              />
            )}
          </>
        ) : (
          !isLoadingBudgets && (
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
