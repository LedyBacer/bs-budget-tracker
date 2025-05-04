// src/App.tsx
import { useEffect } from 'react';
import {
  useSignal,
  miniApp,
  backButton,
  mainButton,
  // popup, // Пока не используем
} from '@telegram-apps/sdk-react';
import { Button } from '@/components/ui/button';
import { ThemeProvider } from '@/components/theme-provider';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { BudgetProvider, useBudgets } from '@/contexts/BudgetContext';
import { BudgetList } from '@/components/features/budget/BudgetList';
import { BudgetDetails } from '@/components/features/budget/BudgetDetails';
import { CategoryList } from '@/components/features/category/CategoryList';
import { TransactionList } from '@/components/features/transaction/TransactionList'; // Импортируем список транзакций

function AppContent() {
  // --- Логика SDK остается прежней (кроме popup) ---
  const isBackButtonVisible = useSignal(backButton.isVisible);
  const mainButtonText = useSignal(mainButton.text);
  const mainButtonLoading = useSignal(mainButton.isLoaderVisible);
  const mainButtonVisible = useSignal(mainButton.isVisible);
  const { currentBudget, isLoadingBudgets, errorLoadingBudgets } = useBudgets();

  useEffect(() => {
    miniApp.ready();
  }, []);

  useEffect(() => {
    const handleBackClick = () => console.log('Back button clicked!');
    backButton.show.ifAvailable();
    const cleanup = backButton.onClick.isAvailable()
      ? backButton.onClick(handleBackClick)
      : undefined;
    return () => cleanup?.();
  }, []);

  useEffect(() => {
    // Пока оставим MainButton без действия
    const handleMainClick = () => console.log('Main button clicked!');
    mainButton.setParams.ifAvailable({ text: 'MAIN ACTION', isVisible: true, isEnabled: false }); // Пока выключим
    const cleanup = mainButton.onClick.isAvailable()
      ? mainButton.onClick(handleMainClick)
      : undefined;
    return () => cleanup?.();
  }, []);

  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col">
      <Header />
      <PageWrapper>
        {/* Здесь будет основная логика приложения */}
        {/* <h2 className="text-xl font-semibold mb-4">Бюджетный трекер</h2> */}

        {/* Показываем список бюджетов */}
        <BudgetList />

        {/* Показываем детали и категории только если бюджет выбран */}
        {isLoadingBudgets ? (
          <div className="text-muted-foreground p-4 text-center">Загрузка...</div>
        ) : errorLoadingBudgets ? (
          <div className="text-destructive p-4 text-center">Ошибка загрузки данных.</div>
        ) : currentBudget ? (
          <>
            <BudgetDetails />
            <CategoryList />
            <TransactionList /> {/* Добавляем список транзакций */}
          </>
        ) : (
          !isLoadingBudgets && (
            <div className="text-muted-foreground p-4 text-center">
              Создайте или выберите бюджет для начала.
            </div>
          )
        )}

        {/* Просто для отладки статуса SDK */}
        <div className="bg-card text-card-foreground mt-6 rounded-lg border p-4 text-sm">
          <h3 className="text-md mb-2 font-semibold">SDK Status:</h3>
          <p>Back Button Visible: {isBackButtonVisible ? '✅ Yes' : '❌ No'}</p>
          <p>Main Button Visible: {mainButtonVisible ? '✅ Yes' : '❌ No'}</p>
          <p>Main Button Text: "{mainButtonText}"</p>
          <p>Main Button Loading: {mainButtonLoading ? '⏳ Yes' : '✅ No'}</p>
        </div>
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
