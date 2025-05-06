// src/App.tsx
import { useEffect, useState, useRef } from 'react';
import {
  useLaunchParams,
  useSignal,
  miniApp,
  backButton,
  mainButton,
  themeParams,
} from '@telegram-apps/sdk-react';
import { WebAppUser } from '@/types';
import { Button } from '@/components/ui/button';
import { ThemeProvider } from '@/components/theme-provider';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { BudgetProvider, useBudgets } from '@/contexts/BudgetContext';
import { BudgetList } from '@/components/features/budget/BudgetList';
import { BudgetDetails } from '@/components/features/budget/BudgetDetails';
import { CategoryList } from '@/components/features/category/CategoryList';
import { TransactionList } from '@/components/features/transaction/TransactionList';
import {
  BudgetListSkeleton,
  BudgetDetailsSkeleton,
  CategoryListSkeleton,
  TransactionListSkeleton,
} from '@/components/ui/skeletons';
import { HapticButton } from '@/components/ui/haptic-button';
import { PlusCircle } from 'lucide-react';
import { SimpleTransactionForm } from '@/components/features/transaction/SimpleTransactionForm';

function AppContent() {
  const { currentBudget, isLoadingBudgets, errorLoadingBudgets } = useBudgets();
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

  // useEffect(() => {
  //   // Пока оставим MainButton без действия
  //   const handleMainClick = () => console.log('Main button clicked!');
  //   mainButton.setParams.ifAvailable({ text: 'MAIN ACTION', isVisible: true, isEnabled: false }); // Пока выключим
  //   const cleanup = mainButton.onClick.isAvailable()
  //     ? mainButton.onClick(handleMainClick)
  //     : undefined;
  //   return () => cleanup?.();
  // }, []);

  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col">
      <Header />
      <PageWrapper>
        {/* Показываем список бюджетов */}
        {isLoadingBudgets ? (
          <BudgetListSkeleton />
        ) : (
          <BudgetList />
        )}

        {/* Показываем детали и категории только если бюджет выбран */}
        {isLoadingBudgets ? (
          <>
            <BudgetDetailsSkeleton />
            <CategoryListSkeleton />
            <TransactionListSkeleton />
          </>
        ) : errorLoadingBudgets ? (
          <div className="text-destructive p-4 text-center">Ошибка загрузки данных.</div>
        ) : currentBudget ? (
          <>
            <BudgetDetails />
            <HapticButton
              variant="default"
              size="lg"
              className="mb-6 w-full"
              onClick={() => setIsSimpleFormOpen(true)}
            >
              <PlusCircle className="mr-2 h-5 w-5" />
              Добавить транзакцию
            </HapticButton>
            <CategoryList />
            <TransactionList ref={transactionListRef} />
            {currentBudget && (
              <SimpleTransactionForm
                budgetId={currentBudget.id}
                open={isSimpleFormOpen}
                onOpenChange={setIsSimpleFormOpen}
                onTransactionSaved={() => {
                  // Обновляем список транзакций через ref
                  if (transactionListRef.current) {
                    transactionListRef.current.loadData();
                  }
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

        {/* --- Отладочный блок SDK --- */}
        <div className="mt-auto pt-6">
          {/* Добавим отступ сверху */}
          <details className="bg-card text-card-foreground rounded-lg border p-4 text-sm">
            <summary className="mb-2 cursor-pointer font-semibold">SDK Status & Debug Info</summary>

            {/* <div className="mt-2 space-y-1">
              <h4 className="text-muted-foreground mb-1 text-xs font-medium uppercase">Buttons:</h4>
              <p>Back Button Visible: {useSignal(backButton.isVisible) ? '✅ Yes' : '❌ No'}</p>
              <p>Main Button Visible: {useSignal(mainButton.isVisible) ? '✅ Yes' : '❌ No'}</p>
              <p>Main Button Text: "{useSignal(mainButton.text)}"</p>
              <p>
                Main Button Loading: {useSignal(mainButton.isLoaderVisible) ? '⏳ Yes' : '✅ No'}
              </p>
            </div> */}

            <div className="mt-3 space-y-1">
              <h4 className="text-muted-foreground mb-1 text-xs font-medium uppercase">
                User Data (from tgWebAppData):
              </h4>
              {/* Проверяем исправленный currentUser */}
              {currentUser ? (
                <>
                  <p>
                    Status: <span className="font-medium text-green-600">✅ Loaded</span>
                  </p>
                  {/* Используем поля как есть, т.к. они уже в camelCase в v3 */}
                  <p>
                    ID: <span className="font-mono text-xs">{currentUser.id}</span>
                  </p>
                  <p>First Name: {currentUser.first_name}</p>
                  {currentUser.last_name && <p>Last Name: {currentUser.last_name}</p>}
                  {currentUser.username && <p>Username: @{currentUser.username}</p>}
                  <p>Is Premium: {currentUser.is_premium ? 'Yes' : 'No'}</p>
                  <p>Language: {currentUser.language_code || 'N/A'}</p>
                </>
              ) : (
                <p>
                  Status:{' '}
                  <span className="font-medium text-red-600">❌ Not Loaded (Check code!)</span>
                </p>
              )}
            </div>

            <div className="mt-3 space-y-1">
              <h4 className="text-muted-foreground mb-1 text-xs font-medium uppercase">
                Theme Data:
              </h4>
              <p>
                ThemeParams Mounted:{' '}
                <span className={themeParams.isMounted() ? 'text-green-600' : 'text-red-600'}>
                  {themeParams.isMounted() ? '✅ Yes' : '❌ No'}
                </span>
              </p>
              <p>
                CSS Vars Bound:{' '}
                <span className={themeParams.isCssVarsBound() ? 'text-green-600' : 'text-red-600'}>
                  {themeParams.isCssVarsBound() ? '✅ Yes' : '❌ No'}
                </span>
              </p>
              <details className="text-xs">
                <summary className="text-muted-foreground cursor-pointer">
                  Raw Theme Colors
                </summary>
                <pre className="bg-muted mt-1 max-h-40 overflow-auto rounded p-1 text-[10px] leading-tight">
                  {JSON.stringify(
                    {
                      backgroundColor: themeParams.backgroundColor(),
                      textColor: themeParams.textColor(),
                      buttonColor: themeParams.buttonColor(),
                      buttonTextColor: themeParams.buttonTextColor(),
                      secondaryBackgroundColor: themeParams.secondaryBackgroundColor(),
                      hintColor: themeParams.hintColor(),
                      linkColor: themeParams.linkColor(),
                      destructiveTextColor: themeParams.destructiveTextColor(),
                      accentTextColor: themeParams.accentTextColor(),
                    },
                    null,
                    2
                  )}
                </pre>
              </details>
            </div>

            <div className="mt-3">
              <details className="text-xs">
                <summary className="text-muted-foreground cursor-pointer">
                  Raw Launch Params
                </summary>
                <pre className="bg-muted mt-1 max-h-40 overflow-auto rounded p-1 text-[10px] leading-tight">
                  {JSON.stringify(launchParams, null, 2)}
                </pre>
              </details>
            </div>
          </details>
        </div>
        {/* --- Конец отладочного блока --- */}
      </PageWrapper>
      <Footer />
    </div>
  );
}

// Оборачиваем основной контент в провайдеры
function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <BudgetProvider>
        <AppContent />
      </BudgetProvider>
    </ThemeProvider>
  );
}

export default App;
