import { Budget, Category, Transaction, TransactionType, WebAppUser } from '@/types';
import { generateId } from './utils';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, subWeeks, subMonths, isWithinInterval } from 'date-fns';

// Определение типа для данных формы транзакции
export interface TransactionFormData {
  name?: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  comment?: string;
  createdAt?: Date;
}

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

// Имитация задержки сети с случайным временем для реалистичности
const fakeNetworkDelay = (minDelay = 300, maxDelay = 800) => 
  new Promise((res) => setTimeout(res, Math.random() * (maxDelay - minDelay) + minDelay));

let budgets: Budget[] = [
  {
    id: 'b1',
    name: 'Январь 2024',
    totalAmount: 115201,
    createdAt: new Date('2024-01-01T10:00:00Z'),
    totalExpense: 0,
    totalIncome: 0,
    balance: 0
  },
  {
    id: 'b2',
    name: 'Отпуск Сочи',
    totalAmount: 150000,
    createdAt: new Date('2024-02-10T12:00:00Z'),
    totalExpense: 0,
    totalIncome: 0,
    balance: 0
  },
];

let categories: Category[] = [
  { id: 'c1', budgetId: 'b1', name: 'Еда', limit: 40000, spent: 0, income: 0, balance: 40000 },
  { id: 'c2', budgetId: 'b1', name: 'Транспорт', limit: 10000, spent: 0, income: 0, balance: 10000 },
  { id: 'c3', budgetId: 'b1', name: 'Развлечения', limit: 15000, spent: 0, income: 0, balance: 15000 },
  { id: 'c4', budgetId: 'b1', name: 'Кексы', limit: 100, spent: 0, income: 0, balance: 100 },
  { id: 'c5', budgetId: 'b1', name: 'Сникеры', limit: 100, spent: 0, income: 0, balance: 100 },
  { id: 'c6', budgetId: 'b1', name: 'Игры', limit: 15000, spent: 0, income: 0, balance: 15000 },
  { id: 'c7', budgetId: 'b1', name: 'Прочее', limit: 1, spent: 0, income: 0, balance: 1 },
  { id: 'c8', budgetId: 'b2', name: 'Отель', limit: 80000, spent: 0, income: 0, balance: 80000 },
  { id: 'c9', budgetId: 'b2', name: 'Авиабилеты', limit: 45000, spent: 0, income: 0, balance: 45000 },
  { id: 'c10', budgetId: 'b2', name: 'Рестораны', limit: 25000, spent: 0, income: 0, balance: 25000 },
];

let transactions: Transaction[] = [];

// Функция для сериализации объектов Date в строки ISO для всех объектов
const serializeDate = <T>(obj: T): T => {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    return obj;
  }
  
  const result = { ...obj } as any;
  
  for (const key in result) {
    if (result[key] instanceof Date) {
      result[key] = (result[key] as Date).toISOString();
    } else if (result[key] !== null && typeof result[key] === 'object' && !Array.isArray(result[key])) {
      result[key] = serializeDate(result[key]);
    }
  }
  
  return result as T;
};

// Функция для сериализации массива объектов с датами
const serializeArrayDates = <T>(array: T[]): T[] => {
  return array.map(item => serializeDate(item));
};

// Функция для пересчета значений бюджета
const recalculateBudgetValues = (budgetId: string) => {
  const budgetTransactions = transactions.filter(t => t.budgetId === budgetId);
  
  // Считаем общий расход и доход
  const totalExpense = budgetTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalIncome = budgetTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  // Обновляем бюджет
  const budgetIndex = budgets.findIndex(b => b.id === budgetId);
  if (budgetIndex !== -1) {
    budgets[budgetIndex] = {
      ...budgets[budgetIndex],
      totalExpense,
      totalIncome,
      balance: budgets[budgetIndex].totalAmount - totalExpense + totalIncome
    };
  }
};

// Функция для пересчета значений категорий
const recalculateCategoryValues = (budgetId: string) => {
  const budgetTransactions = transactions.filter(t => t.budgetId === budgetId);
  
  // Обновляем значения для каждой категории
  categories = categories.map(category => {
    if (category.budgetId !== budgetId) return category;

    const categoryTransactions = budgetTransactions.filter(t => t.categoryId === category.id);
    
    const spent = categoryTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const income = categoryTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      ...category,
      spent,
      income,
      balance: category.limit - spent + income
    };
  });
};

// Инициализация транзакций с тестовыми данными
transactions = generateTestTransactions();

// Пересчитываем значения для каждого бюджета после инициализации
budgets.forEach(budget => {
  recalculateBudgetValues(budget.id);
  recalculateCategoryValues(budget.id);
});

// --- Функции для имитации API ---

// == Бюджеты ==
export const getBudgets = async (): Promise<Budget[]> => {
  await fakeNetworkDelay();
  console.log('Mock API: getBudgets called');
  
  // Сериализуем все объекты с датами
  return serializeArrayDates(budgets);
};

export const addBudget = async (name: string, totalAmount: number): Promise<Budget> => {
  await fakeNetworkDelay(500, 1000); // Увеличенная задержка для операции создания
  console.log('Mock API: addBudget called with', { name, totalAmount });
  if (!name || totalAmount <= 0) {
    throw new Error('Invalid budget data');
  }
  const newBudget: Budget = {
    id: generateId(),
    name,
    totalAmount,
    createdAt: new Date(),
    totalExpense: 0,
    totalIncome: 0,
    balance: totalAmount
  };
  budgets.push(newBudget);
  return { ...newBudget }; // Возвращаем копию
};

export const updateBudget = async (
  budgetId: string,
  name: string,
  totalAmount: number
): Promise<Budget> => {
  await fakeNetworkDelay(400, 800); // Средняя задержка для операции обновления
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
  await fakeNetworkDelay(600, 1200); // Увеличенная задержка для операции удаления
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
  return serializeArrayDates(categories.filter((c) => c.budgetId === budgetId));
};

export const addCategory = async (
  budgetId: string,
  name: string,
  limit: number
): Promise<Category> => {
  await fakeNetworkDelay(500, 1000);
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
    spent: 0,
    income: 0,
    balance: limit
  };
  categories.push(newCategory);
  return { ...newCategory };
};

export const updateCategory = async (
  categoryId: string,
  name: string,
  limit: number
): Promise<Category> => {
  await fakeNetworkDelay(400, 800);
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
  await fakeNetworkDelay(600, 1200);
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
  await fakeNetworkDelay(300, 600); // Меньшая задержка для чтения
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
  filteredTransactions.sort((a, b) => {
    const dateA = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime();
    const dateB = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime();
    return dateB - dateA;
  });
  
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  
  // Сериализуем даты перед возвратом
  return serializeArrayDates(
    filteredTransactions
      .slice(startIndex, endIndex)
      .map((t) => ({ ...t }))
  );
};

// Обновляем функцию addTransaction
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
  await fakeNetworkDelay(500, 1000);
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
    name: name || `${type === 'expense' ? 'Расход' : 'Пополнение'} по категории`,
    comment,
    createdAt: createdAt || new Date(),
  };
  transactions.push(newTransaction);
  
  // Пересчитываем значения после добавления транзакции
  recalculateBudgetValues(budgetId);
  recalculateCategoryValues(budgetId);
  
  // Сериализуем даты перед возвратом
  return serializeDate({ ...newTransaction });
};

// Обновляем функцию updateTransaction
export const updateTransaction = async (
  transactionId: string,
  data: Partial<TransactionFormData>
): Promise<Transaction> => {
  await fakeNetworkDelay(400, 800);
  console.log('Mock API: updateTransaction called for', transactionId, 'with data:', data);
  const transactionIndex = transactions.findIndex((t) => t.id === transactionId);
  if (transactionIndex === -1) {
    throw new Error('Transaction not found');
  }

  const oldTransaction = transactions[transactionIndex];
  const budgetId = oldTransaction.budgetId;

  // Обновляем только переданные поля
  const updatedTransaction = {
    ...oldTransaction,
    ...data,
  };
  transactions[transactionIndex] = updatedTransaction as Transaction;

  // Пересчитываем значения после обновления транзакции
  recalculateBudgetValues(budgetId);
  recalculateCategoryValues(budgetId);

  // Сериализуем даты перед возвратом
  return serializeDate({ ...updatedTransaction } as Transaction);
};

// Обновляем функцию deleteTransaction
export const deleteTransaction = async (transactionId: string): Promise<boolean> => {
  await fakeNetworkDelay(600, 1200);
  console.log('Mock API: deleteTransaction called for', transactionId);
  
  const transactionToDelete = transactions.find(t => t.id === transactionId);
  if (!transactionToDelete) {
    return false;
  }

  const budgetId = transactionToDelete.budgetId;
  const initialLength = transactions.length;
  
  transactions = transactions.filter((t) => t.id !== transactionId);
  
  // Пересчитываем значения после удаления транзакции
  recalculateBudgetValues(budgetId);
  recalculateCategoryValues(budgetId);

  return transactions.length < initialLength;
};
