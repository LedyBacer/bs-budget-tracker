// lib/mockData.ts
import { Budget, Category, Transaction, TransactionType, WebAppUser } from '@/types';
import { generateId } from './utils';
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subWeeks,
  subMonths,
  isWithinInterval,
} from 'date-fns';

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
  const randomDate = new Date(
    threeMonthsAgo.getTime() + Math.random() * (now.getTime() - threeMonthsAgo.getTime())
  );
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
    'Развлечения',
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
    'Компенсация',
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
    balance: 0,
  },
  {
    id: 'b2',
    name: 'Отпуск Сочи',
    totalAmount: 150000,
    createdAt: new Date('2024-02-10T12:00:00Z'),
    totalExpense: 0,
    totalIncome: 0,
    balance: 0,
  },
];

let categories: Category[] = [
  { id: 'c1', budgetId: 'b1', name: 'Еда', limit: 40000, spent: 0, income: 0, balance: 40000 },
  {
    id: 'c2',
    budgetId: 'b1',
    name: 'Транспорт',
    limit: 10000,
    spent: 0,
    income: 0,
    balance: 10000,
  },
  {
    id: 'c3',
    budgetId: 'b1',
    name: 'Развлечения',
    limit: 15000,
    spent: 0,
    income: 0,
    balance: 15000,
  },
  { id: 'c4', budgetId: 'b1', name: 'Кексы', limit: 100, spent: 0, income: 0, balance: 100 },
  { id: 'c5', budgetId: 'b1', name: 'Сникеры', limit: 100, spent: 0, income: 0, balance: 100 },
  { id: 'c6', budgetId: 'b1', name: 'Игры', limit: 15000, spent: 0, income: 0, balance: 15000 },
  { id: 'c7', budgetId: 'b1', name: 'Прочее', limit: 1, spent: 0, income: 0, balance: 1 },
  { id: 'c8', budgetId: 'b2', name: 'Отель', limit: 80000, spent: 0, income: 0, balance: 80000 },
  {
    id: 'c9',
    budgetId: 'b2',
    name: 'Авиабилеты',
    limit: 45000,
    spent: 0,
    income: 0,
    balance: 45000,
  },
  {
    id: 'c10',
    budgetId: 'b2',
    name: 'Рестораны',
    limit: 25000,
    spent: 0,
    income: 0,
    balance: 25000,
  },
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
    } else if (
      result[key] !== null &&
      typeof result[key] === 'object' &&
      !Array.isArray(result[key])
    ) {
      result[key] = serializeDate(result[key]);
    }
  }

  return result as T;
};

// Функция для сериализации массива объектов с датами
const serializeArrayDates = <T>(array: T[]): T[] => {
  return array.map((item) => serializeDate(item));
};

// Функция для пересчета значений бюджета
const recalculateBudgetValues = (budgetId: string) => {
  const budgetTransactions = transactions.filter((t) => t.budgetId === budgetId);

  // Считаем общий расход и доход
  const totalExpense = budgetTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalIncome = budgetTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  // Обновляем бюджет
  const budgetIndex = budgets.findIndex((b) => b.id === budgetId);
  if (budgetIndex !== -1) {
    budgets[budgetIndex] = {
      ...budgets[budgetIndex],
      totalExpense,
      totalIncome,
      balance: budgets[budgetIndex].totalAmount - totalExpense + totalIncome,
    };
  }
};

// Функция для пересчета значений категорий
const recalculateCategoryValues = (budgetId: string) => {
  const budgetTransactions = transactions.filter((t) => t.budgetId === budgetId);

  // Обновляем значения для каждой категории
  categories = categories.map((category) => {
    if (category.budgetId !== budgetId) return category;

    const categoryTransactions = budgetTransactions.filter((t) => t.categoryId === category.id);

    const spent = categoryTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const income = categoryTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      ...category,
      spent,
      income,
      balance: category.limit - spent + income,
    };
  });
};

// Инициализация транзакций с тестовыми данными
transactions = generateTestTransactions();

// Пересчитываем значения для каждого бюджета после инициализации
budgets.forEach((budget) => {
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
    balance: totalAmount,
  };
  budgets.push(newBudget);
  return serializeDate({ ...newBudget }); // Возвращаем копию, сериализованную
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

  budgets[budgetIndex] = { ...budgets[budgetIndex], name, totalAmount };
  recalculateBudgetValues(budgetId); // Пересчитываем баланс после обновления
  console.warn('Update budget in mockData. Recalculated balance.');
  return serializeDate({ ...budgets[budgetIndex] });
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
  const newCategory: Category = {
    id: generateId(),
    budgetId,
    name,
    limit,
    spent: 0,
    income: 0,
    balance: limit,
  };
  categories.push(newCategory);
  recalculateCategoryValues(budgetId); // Пересчитываем для этого бюджета
  return serializeDate({ ...newCategory });
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

  const budgetId = categories[categoryIndex].budgetId;
  categories[categoryIndex] = { ...categories[categoryIndex], name, limit };
  recalculateCategoryValues(budgetId); // Пересчитываем для этого бюджета
  console.warn('Update category in mockData. Recalculated balances for budget.');
  return serializeDate({ ...categories[categoryIndex] });
};

export const deleteCategory = async (categoryId: string): Promise<boolean> => {
  await fakeNetworkDelay(600, 1200);
  console.log('Mock API: deleteCategory called for', categoryId);

  const categoryToDelete = categories.find((c) => c.id === categoryId);
  if (!categoryToDelete) {
    return false; // Категория не найдена
  }
  const budgetId = categoryToDelete.budgetId;

  const hasTransactions = transactions.some((t) => t.categoryId === categoryId);
  if (hasTransactions) {
    console.warn('Mock API: Category has transactions, deletion prevented.');
    throw new Error('Нельзя удалить категорию, по ней есть транзакции.');
  }

  const initialLength = categories.length;
  categories = categories.filter((c) => c.id !== categoryId);

  if (categories.length < initialLength) {
    recalculateCategoryValues(budgetId); // Пересчитываем для этого бюджета
    return true;
  }
  return false;
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
    categoryId?: string; // Может быть '' или undefined
    userId?: string; // Может быть '' или undefined
  }
): Promise<{ transactions: Transaction[]; totalCount: number }> => {
  await fakeNetworkDelay(1300, 1600);
  console.log('Mock API: getTransactionsByBudgetId called for', budgetId, 'with options:', options);
  if (!budgetId) return { transactions: [], totalCount: 0 };

  const defaultOptions = {
    page: 1,
    limit: 10,
    dateRange: 'all' as const, // Явное указание типа для 'all'
    startDate: '',
    endDate: '',
    type: 'all' as const,
    categoryId: '', // Пустая строка будет означать "все категории"
    userId: '', // Пустая строка будет означать "все пользователи"
  };

  const currentOptions = { ...defaultOptions, ...(options || {}) };

  const {
    page,
    limit,
    dateRange,
    startDate,
    endDate,
    type,
    categoryId, // Теперь это может быть ''
    userId, // Теперь это может быть ''
  } = currentOptions;

  let filteredTransactions = transactions.filter((t) => t.budgetId === budgetId);

  const getDateInterval = (dr: typeof dateRange, sd?: string, ed?: string) => {
    // передаем startDate и endDate явно
    const now = new Date();
    let startIntervalDate: Date;
    let endIntervalDate: Date;

    switch (dr) {
      case 'thisWeek':
        startIntervalDate = startOfWeek(now, { weekStartsOn: 1 });
        endIntervalDate = endOfWeek(now, { weekStartsOn: 1 });
        break;
      case 'lastWeek': {
        const lastWeekDate = subWeeks(now, 1);
        startIntervalDate = startOfWeek(lastWeekDate, { weekStartsOn: 1 });
        endIntervalDate = endOfWeek(lastWeekDate, { weekStartsOn: 1 });
        break;
      }
      case 'thisMonth':
        startIntervalDate = startOfMonth(now);
        endIntervalDate = endOfMonth(now);
        break;
      case 'lastMonth': {
        const lastMonthDate = subMonths(now, 1);
        startIntervalDate = startOfMonth(lastMonthDate);
        endIntervalDate = endOfMonth(lastMonthDate);
        break;
      }
      case 'custom':
        if (!sd || !ed) return null; // Используем переданные sd, ed
        startIntervalDate = new Date(sd);
        endIntervalDate = new Date(ed);
        break;
      default: // 'all'
        return null;
    }
    startIntervalDate.setHours(0, 0, 0, 0);
    endIntervalDate.setHours(23, 59, 59, 999);
    return { start: startIntervalDate, end: endIntervalDate };
  };

  const filtersToApply = [
    (t: Transaction) => currentOptions.type === 'all' || t.type === currentOptions.type,
    // ИЗМЕНЕНИЕ: Пустая строка (или undefined от optional chaining) означает "все"
    (t: Transaction) =>
      !currentOptions.categoryId ||
      currentOptions.categoryId === 'all' ||
      t.categoryId === currentOptions.categoryId,
    (t: Transaction) =>
      !currentOptions.userId ||
      currentOptions.userId === 'all' ||
      t.author.id.toString() === currentOptions.userId,
    (t: Transaction) => {
      if (currentOptions.dateRange === 'all') return true;
      // Передаем startDate и endDate из currentOptions в getDateInterval
      const interval = getDateInterval(
        currentOptions.dateRange,
        currentOptions.startDate,
        currentOptions.endDate
      );
      if (!interval) return true;
      const transactionDate = new Date(t.createdAt);
      return isWithinInterval(transactionDate, interval);
    },
  ];

  // Отфильтровываем транзакции
  filteredTransactions = filteredTransactions.filter((transaction) =>
    filtersToApply.every((filterFn) => filterFn(transaction))
  );

  // Сортировка
  filteredTransactions.sort((a, b) => {
    const dateA =
      a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime();
    const dateB =
      b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime();
    return dateB - dateA;
  });

  const totalCount = filteredTransactions.length;

  const startIndex = (page - 1) * limit;
  const paginatedTransactions = filteredTransactions.slice(startIndex, startIndex + limit);

  console.log('[DEBUG] Mock API getTransactionsByBudgetId - Returning:', {
    optionsUsed: currentOptions, // Используем currentOptions для лога
    page,
    limit,
    totalCountAfterFiltering: totalCount,
    paginatedTransactionCount: paginatedTransactions.length,
  });
  if (paginatedTransactions.length > 0 && totalCount > 0) {
    // Добавил totalCount > 0 для лога
    console.log(
      '[DEBUG] First paginated transaction example:',
      JSON.parse(JSON.stringify(paginatedTransactions[0]))
    );
  } else if (totalCount === 0) {
    console.log('[DEBUG] No transactions found after filtering for options:', currentOptions);
  }

  return {
    transactions: serializeArrayDates(paginatedTransactions.map((t) => ({ ...t }))),
    totalCount: totalCount,
  };
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
    name: name || `${type === 'expense' ? 'Расход' : 'Пополнение'} по категории`, // Убрал "по категории", так как имя может быть и своим
    comment,
    createdAt: createdAt || new Date(),
  };
  transactions.push(newTransaction);

  recalculateBudgetValues(budgetId);
  recalculateCategoryValues(budgetId);

  return serializeDate({ ...newTransaction });
};

export const updateTransaction = async (
  transactionId: string,
  data: Partial<TransactionFormData & { createdAt: Date | string }> // Уточняем тип для createdAt
): Promise<Transaction> => {
  await fakeNetworkDelay(400, 800);
  console.log('Mock API: updateTransaction called for', transactionId, 'with data:', data);
  const transactionIndex = transactions.findIndex((t) => t.id === transactionId);
  if (transactionIndex === -1) {
    throw new Error('Transaction not found');
  }

  const oldTransaction = transactions[transactionIndex];
  const budgetId = oldTransaction.budgetId;

  const updatedTransactionData = { ...oldTransaction, ...data };
  // Если createdAt передана как строка, конвертируем в Date
  if (typeof data.createdAt === 'string') {
    updatedTransactionData.createdAt = new Date(data.createdAt);
  }

  transactions[transactionIndex] = updatedTransactionData as Transaction;

  recalculateBudgetValues(budgetId);
  recalculateCategoryValues(budgetId);

  return serializeDate({ ...transactions[transactionIndex] } as Transaction);
};

export const deleteTransaction = async (transactionId: string): Promise<boolean> => {
  await fakeNetworkDelay(600, 1200);
  console.log('Mock API: deleteTransaction called for', transactionId);

  const transactionToDelete = transactions.find((t) => t.id === transactionId);
  if (!transactionToDelete) {
    return false;
  }

  const budgetId = transactionToDelete.budgetId;
  const initialLength = transactions.length;

  transactions = transactions.filter((t) => t.id !== transactionId);

  if (transactions.length < initialLength) {
    recalculateBudgetValues(budgetId);
    recalculateCategoryValues(budgetId);
    return true;
  }
  return false;
};

// == Новая функция для сумм расходов по дням ==
export const getDailyExpenseSummaries = async (
  budgetId: string,
  dateRange: { startDate: string; endDate: string } // Даты в формате YYYY-MM-DD
): Promise<Record<string, number>> => {
  await fakeNetworkDelay(200, 500);
  console.log(
    'Mock API: getDailyExpenseSummaries called for budget',
    budgetId,
    'daterange:',
    dateRange
  );

  if (!budgetId || !dateRange.startDate || !dateRange.endDate) {
    console.warn('Mock API: getDailyExpenseSummaries - missing budgetId or dateRange');
    return {};
  }

  const rangeStart = new Date(dateRange.startDate);
  rangeStart.setHours(0, 0, 0, 0);
  const rangeEnd = new Date(dateRange.endDate);
  rangeEnd.setHours(23, 59, 59, 999);

  const relevantTransactions = transactions.filter((t) => {
    if (t.budgetId !== budgetId || t.type !== 'expense') {
      return false;
    }
    const transactionDate = new Date(t.createdAt);
    return isWithinInterval(transactionDate, { start: rangeStart, end: rangeEnd });
  });

  const summaries: Record<string, number> = {};

  relevantTransactions.forEach((t) => {
    const transactionDate = new Date(t.createdAt);
    // Форматируем дату в YYYY-MM-DD для ключа
    const dateKey = `${transactionDate.getFullYear()}-${String(transactionDate.getMonth() + 1).padStart(2, '0')}-${String(transactionDate.getDate()).padStart(2, '0')}`;

    if (!summaries[dateKey]) {
      summaries[dateKey] = 0;
    }
    summaries[dateKey] += t.amount;
  });

  console.log('Mock API: getDailyExpenseSummaries result:', summaries);
  return summaries;
};
