import { Budget, Category, Transaction, TransactionType, WebAppUser } from '@/types';
import { generateId } from './utils';
import { TransactionFormData } from '@/components/features/transaction/TransactionForm.tsx'; // Предполагаем, что утилита для генерации ID будет создана
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, subWeeks, subMonths, isWithinInterval } from 'date-fns';

// --- Начальные Моковые Данные ---

// Для имитации автора возьмем гипотетического пользователя
const mockUser: Pick<WebAppUser, 'id' | 'first_name' | 'last_name' | 'username'> = {
  id: 12345678,
  first_name: 'Demo',
  last_name: 'User',
  username: 'demouser',
};

// Функция для генерации случайной даты в пределах последних 3 месяцев
const getRandomDate = () => {
  const now = new Date();
  const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  const randomDate = new Date(threeMonthsAgo.getTime() + Math.random() * (now.getTime() - threeMonthsAgo.getTime()));
  // Устанавливаем случайное время в течение дня
  randomDate.setHours(Math.floor(Math.random() * 24));
  randomDate.setMinutes(Math.floor(Math.random() * 60));
  randomDate.setSeconds(Math.floor(Math.random() * 60));
  return randomDate;
};

// Функция для генерации случайной суммы
const getRandomAmount = (type: TransactionType) => {
  const min = type === 'expense' ? 100 : 1000;
  const max = type === 'expense' ? 10000 : 50000;
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Функция для генерации случайного имени транзакции
const getRandomTransactionName = (type: TransactionType) => {
  const expenseNames = [
    'Продукты',
    'Обед',
    'Ужин',
    'Кофе',
    'Такси',
    'Метро',
    'Кино',
    'Театр',
    'Концерт',
    'Одежда',
    'Обувь',
    'Книги',
    'Подарки',
    'Ремонт',
    'Коммунальные',
    'Интернет',
    'Телефон',
    'Медицина',
    'Спорт',
    'Развлечения'
  ];
  
  const incomeNames = [
    'Зарплата',
    'Аванс',
    'Возврат долга',
    'Подарок',
    'Премия',
    'Подработка',
    'Фриланс',
    'Инвестиции',
    'Возврат товара',
    'Компенсация'
  ];

  const names = type === 'expense' ? expenseNames : incomeNames;
  return names[Math.floor(Math.random() * names.length)];
};

// Генерация тестовых транзакций
const generateTestTransactions = (): Transaction[] => {
  const transactions: Transaction[] = [];
  const budgetIds = ['b1', 'b2'];
  const categoryIds = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8', 'c9', 'c10'];
  
  for (let i = 0; i < 100; i++) {
    const type: TransactionType = Math.random() > 0.7 ? 'income' : 'expense';
    const budgetId = budgetIds[Math.floor(Math.random() * budgetIds.length)];
    const categoryId = categoryIds[Math.floor(Math.random() * categoryIds.length)];
    
    transactions.push({
      id: generateId(),
      budgetId,
      categoryId,
      type,
      amount: getRandomAmount(type),
      name: getRandomTransactionName(type),
      createdAt: getRandomDate(),
      author: mockUser,
    });
  }
  
  return transactions;
};

let budgets: Budget[] = [
  {
    id: 'b1',
    name: 'Январь 2024',
    totalAmount: 115201,
    createdAt: new Date('2024-01-01T10:00:00Z'),
  },
  {
    id: 'b2',
    name: 'Отпуск Сочи',
    totalAmount: 150000,
    createdAt: new Date('2024-02-10T12:00:00Z'),
  },
];

let categories: Category[] = [
  { id: 'c1', budgetId: 'b1', name: 'Еда', limit: 40000 },
  { id: 'c2', budgetId: 'b1', name: 'Транспорт', limit: 10000 },
  { id: 'c3', budgetId: 'b1', name: 'Развлечения', limit: 15000 },
  { id: 'c4', budgetId: 'b1', name: 'Кексы', limit: 100 },
  { id: 'c5', budgetId: 'b1', name: 'Сникеры', limit: 100 },
  { id: 'c6', budgetId: 'b1', name: 'Игры', limit: 15000 },
  { id: 'c7', budgetId: 'b1', name: 'Прочее', limit: 1 },
  { id: 'c8', budgetId: 'b2', name: 'Отель', limit: 80000 },
  { id: 'c9', budgetId: 'b2', name: 'Авиабилеты', limit: 45000 },
  { id: 'c10', budgetId: 'b2', name: 'Рестораны', limit: 25000 },
];

// Инициализация транзакций с тестовыми данными
let transactions: Transaction[] = generateTestTransactions();

// Имитация задержки сети
const fakeNetworkDelay = (delay = 300) => new Promise((res) => setTimeout(res, delay));

// --- Функции для имитации API ---

// == Бюджеты ==
export const getBudgets = async (): Promise<Budget[]> => {
  await fakeNetworkDelay();
  console.log('Mock API: getBudgets called');
  return [...budgets]; // Возвращаем копию
};

export const addBudget = async (name: string, totalAmount: number): Promise<Budget> => {
  await fakeNetworkDelay();
  console.log('Mock API: addBudget called with', { name, totalAmount });
  if (!name || totalAmount <= 0) {
    throw new Error('Invalid budget data');
  }
  const newBudget: Budget = {
    id: generateId(),
    name,
    totalAmount,
    createdAt: new Date(),
  };
  budgets.push(newBudget);
  return { ...newBudget }; // Возвращаем копию
};

export const updateBudget = async (
  budgetId: string,
  name: string,
  totalAmount: number
): Promise<Budget> => {
  await fakeNetworkDelay();
  console.log('Mock API: updateBudget called for', budgetId, 'with', { name, totalAmount });
  const budgetIndex = budgets.findIndex((b) => b.id === budgetId);
  if (budgetIndex === -1) {
    throw new Error('Budget not found');
  }
  if (!name || totalAmount <= 0) {
    throw new Error('Invalid budget data');
  }
  // TODO: Подумать о логике изменения totalAmount, если он стал меньше суммы лимитов категорий?
  // Для MVP просто обновляем.

  budgets[budgetIndex] = { ...budgets[budgetIndex], name, totalAmount };
  console.warn('Update budget in mockData is basic.');
  return { ...budgets[budgetIndex] };
};

export const deleteBudget = async (budgetId: string): Promise<boolean> => {
  await fakeNetworkDelay();
  console.log('Mock API: deleteBudget called for', budgetId);
  const initialLength = budgets.length;
  // Удаляем бюджет
  budgets = budgets.filter((b) => b.id !== budgetId);
  // Удаляем связанные категории
  const initialCategoriesLength = categories.length;
  categories = categories.filter((c) => c.budgetId !== budgetId);
  console.log(
    `Deleted ${initialCategoriesLength - categories.length} categories for budget ${budgetId}`
  );
  // Удаляем связанные транзакции
  const initialTransactionsLength = transactions.length;
  transactions = transactions.filter((t) => t.budgetId !== budgetId);
  console.log(
    `Deleted ${initialTransactionsLength - transactions.length} transactions for budget ${budgetId}`
  );

  return budgets.length < initialLength;
};

// == Категории ==
export const getCategoriesByBudgetId = async (budgetId: string): Promise<Category[]> => {
  await fakeNetworkDelay();
  console.log('Mock API: getCategoriesByBudgetId called for', budgetId);
  if (!budgetId) return [];
  return categories.filter((c) => c.budgetId === budgetId).map((c) => ({ ...c })); // Возвращаем копии
};

export const addCategory = async (
  budgetId: string,
  name: string,
  limit: number
): Promise<Category> => {
  await fakeNetworkDelay();
  console.log('Mock API: addCategory called for', budgetId, 'with', { name, limit });
  if (!budgetId || !name || limit <= 0) {
    throw new Error('Invalid category data');
  }
  // TODO: Добавить проверку, не превышает ли сумма лимитов бюджет
  const newCategory: Category = {
    id: generateId(),
    budgetId,
    name,
    limit,
  };
  categories.push(newCategory);
  return { ...newCategory };
};

export const updateCategory = async (
  categoryId: string,
  name: string,
  limit: number
): Promise<Category> => {
  await fakeNetworkDelay();
  console.log('Mock API: updateCategory called for', categoryId, 'with', { name, limit });
  const categoryIndex = categories.findIndex((c) => c.id === categoryId);
  if (categoryIndex === -1) {
    throw new Error('Category not found');
  }
  if (!name || limit <= 0) {
    throw new Error('Invalid category data');
  }
  // TODO: Проверка лимитов бюджета при обновлении

  categories[categoryIndex] = { ...categories[categoryIndex], name, limit };
  console.warn('Update category in mockData is basic, might need budget limit checks.');
  return { ...categories[categoryIndex] };
};

export const deleteCategory = async (categoryId: string): Promise<boolean> => {
  await fakeNetworkDelay();
  console.log('Mock API: deleteCategory called for', categoryId);
  // Проверка на наличие транзакций (опционально для MVP)
  const hasTransactions = transactions.some((t) => t.categoryId === categoryId);
  if (hasTransactions) {
    console.warn('Mock API: Category has transactions, deletion prevented.');
    throw new Error('Нельзя удалить категорию, по ней есть транзакции.');
  }

  const initialLength = categories.length;
  categories = categories.filter((c) => c.id !== categoryId);
  return categories.length < initialLength;
};

// == Транзакции ==
export const getTransactionsByBudgetId = async (
  budgetId: string,
  options?: { 
    page?: number; 
    limit?: number;
    dateRange?: 'all' | 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth' | 'custom';
    startDate?: string;
    endDate?: string;
    type?: 'all' | 'expense' | 'income';
    categoryId?: string;
    userId?: string;
  }
): Promise<Transaction[]> => {
  await fakeNetworkDelay();
  console.log('Mock API: getTransactionsByBudgetId called for', budgetId, 'with options:', options);
  if (!budgetId) return [];
  
  const { 
    page = 1, 
    limit = 10,
    dateRange = 'all',
    startDate,
    endDate,
    type = 'all',
    categoryId = 'all',
    userId = 'all'
  } = options || {};

  // Получаем базовый список транзакций для бюджета
  let filteredTransactions = transactions.filter((t) => t.budgetId === budgetId);

  // Функция для получения интервала дат
  const getDateInterval = (range: typeof dateRange) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Устанавливаем начало дня

    switch (range) {
      case 'thisWeek': {
        const start = startOfWeek(now, { weekStartsOn: 1 });
        const end = endOfWeek(now, { weekStartsOn: 1 });
        return {
          start: new Date(start.setHours(0, 0, 0, 0)),
          end: new Date(end.setHours(23, 59, 59, 999))
        };
      }
      case 'lastWeek': {
        const lastWeek = subWeeks(now, 1);
        const start = startOfWeek(lastWeek, { weekStartsOn: 1 });
        const end = endOfWeek(lastWeek, { weekStartsOn: 1 });
        return {
          start: new Date(start.setHours(0, 0, 0, 0)),
          end: new Date(end.setHours(23, 59, 59, 999))
        };
      }
      case 'thisMonth': {
        const start = startOfMonth(now);
        const end = endOfMonth(now);
        return {
          start: new Date(start.setHours(0, 0, 0, 0)),
          end: new Date(end.setHours(23, 59, 59, 999))
        };
      }
      case 'lastMonth': {
        const lastMonth = subMonths(now, 1);
        const start = startOfMonth(lastMonth);
        const end = endOfMonth(lastMonth);
        return {
          start: new Date(start.setHours(0, 0, 0, 0)),
          end: new Date(end.setHours(23, 59, 59, 999))
        };
      }
      case 'custom':
        if (!startDate || !endDate) return null;
        const start = new Date(startDate);
        const end = new Date(endDate);
        return {
          start: new Date(start.setHours(0, 0, 0, 0)),
          end: new Date(end.setHours(23, 59, 59, 999))
        };
      default:
        return null;
    }
  };

  // Применяем фильтры последовательно
  const filters = [
    // Фильтр по типу
    (t: Transaction) => type === 'all' || t.type === type,
    
    // Фильтр по категории
    (t: Transaction) => categoryId === 'all' || t.categoryId === categoryId,
    
    // Фильтр по пользователю
    (t: Transaction) => userId === 'all' || t.author.id.toString() === userId,
    
    // Фильтр по дате
    (t: Transaction) => {
      if (dateRange === 'all') return true;
      
      const interval = getDateInterval(dateRange);
      if (!interval) return true;

      const transactionDate = new Date(t.createdAt);
      transactionDate.setHours(0, 0, 0, 0); // Нормализуем время транзакции

      return isWithinInterval(transactionDate, interval);
    }
  ];

  // Применяем все фильтры
  filteredTransactions = filteredTransactions.filter(transaction => 
    filters.every(filter => filter(transaction))
  );

  // Сортируем по дате, самые новые сверху
  filteredTransactions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  
  console.log('Mock API: Found transactions:', {
    total: filteredTransactions.length,
    page,
    limit,
    startIndex,
    endIndex,
    willReturn: filteredTransactions.slice(startIndex, endIndex).length,
    dateRange,
    dateInterval: getDateInterval(dateRange)
  });

  return filteredTransactions
    .slice(startIndex, endIndex)
    .map((t) => ({ ...t })); // Возвращаем копии
};

export const addTransaction = async (
  budgetId: string,
  categoryId: string,
  type: TransactionType,
  amount: number,
  author: Pick<WebAppUser, 'id' | 'first_name' | 'last_name' | 'username'>,
  name?: string,
  comment?: string,
  createdAt?: Date
): Promise<Transaction> => {
  await fakeNetworkDelay();
  console.log('Mock API: addTransaction called for', budgetId, categoryId, 'with', {
    type,
    amount,
    name,
    author,
  });
  if (!budgetId || !categoryId || amount <= 0 || !author) {
    throw new Error('Invalid transaction data');
  }
  const newTransaction: Transaction = {
    id: generateId(),
    budgetId,
    categoryId,
    type,
    amount,
    author,
    name: name || `${type === 'expense' ? 'Расход' : 'Пополнение'} по категории`, // Дефолтное имя
    comment,
    createdAt: createdAt || new Date(),
  };
  transactions.push(newTransaction);
  return { ...newTransaction };
};

export const updateTransaction = async (
  transactionId: string,
  data: Partial<TransactionFormData>
): Promise<Transaction> => {
  await fakeNetworkDelay();
  console.log('Mock API: updateTransaction called for', transactionId, 'with data:', data);
  const transactionIndex = transactions.findIndex((t) => t.id === transactionId);
  if (transactionIndex === -1) {
    throw new Error('Transaction not found');
  }

  // Обновляем только переданные поля (упрощенно)
  const updatedTransaction = {
    ...transactions[transactionIndex],
    ...data,
    // updatedAt: new Date(), // Для реального API
    // lastEditor: currentUser, // Для реального API
  };
  transactions[transactionIndex] = updatedTransaction as Transaction; // Приведение типа, т.к. data частичное
  console.warn('Update transaction in mockData is basic.');
  return { ...updatedTransaction } as Transaction;
};

export const deleteTransaction = async (transactionId: string): Promise<boolean> => {
  await fakeNetworkDelay();
  console.log('Mock API: deleteTransaction called for', transactionId);
  const initialLength = transactions.length;
  transactions = transactions.filter((t) => t.id !== transactionId);
  return transactions.length < initialLength;
};
