import { Budget, Category, Transaction, TransactionType, WebAppUser } from '@/types';
import { generateId } from './utils';
import { TransactionFormData } from '@/components/features/transaction/TransactionForm.tsx'; // Предполагаем, что утилита для генерации ID будет создана

// --- Начальные Моковые Данные ---

// Для имитации автора возьмем гипотетического пользователя
const mockUser: Pick<WebAppUser, 'id' | 'first_name' | 'last_name' | 'username'> = {
  id: 12345678,
  first_name: 'Demo',
  last_name: 'User',
  username: 'demouser',
};

let budgets: Budget[] = [
  {
    id: 'b1',
    name: 'Январь 2024',
    totalAmount: 100000,
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
  { id: 'c4', budgetId: 'b2', name: 'Отель', limit: 80000 },
  { id: 'c5', budgetId: 'b2', name: 'Авиабилеты', limit: 45000 },
  { id: 'c6', budgetId: 'b2', name: 'Рестораны', limit: 25000 },
];

let transactions: Transaction[] = [
  {
    id: generateId(),
    budgetId: 'b1',
    categoryId: 'c1',
    type: 'expense',
    amount: 1500,
    name: 'Обед',
    createdAt: new Date('2024-01-05T13:00:00Z'),
    author: mockUser,
  },
  {
    id: generateId(),
    budgetId: 'b1',
    categoryId: 'c1',
    type: 'expense',
    amount: 3000,
    name: 'Продукты',
    createdAt: new Date('2024-01-06T18:30:00Z'),
    author: mockUser,
  },
  {
    id: generateId(),
    budgetId: 'b1',
    categoryId: 'c2',
    type: 'expense',
    amount: 500,
    name: 'Метро',
    createdAt: new Date('2024-01-07T09:00:00Z'),
    author: mockUser,
  },
  {
    id: generateId(),
    budgetId: 'b1',
    categoryId: 'c3',
    type: 'income',
    amount: 1000,
    name: 'Вернули долг за кино',
    createdAt: new Date('2024-01-08T20:00:00Z'),
    author: mockUser,
  },
  {
    id: generateId(),
    budgetId: 'b2',
    categoryId: 'c5',
    type: 'expense',
    amount: 44500,
    name: 'Билеты до Сочи',
    createdAt: new Date('2024-02-11T10:00:00Z'),
    author: mockUser,
  },
  {
    id: generateId(),
    budgetId: 'b2',
    categoryId: 'c4',
    type: 'expense',
    amount: 78000,
    name: 'Оплата отеля',
    createdAt: new Date('2024-02-12T14:00:00Z'),
    author: mockUser,
  },
];

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
export const getTransactionsByBudgetId = async (budgetId: string): Promise<Transaction[]> => {
  await fakeNetworkDelay();
  console.log('Mock API: getTransactionsByBudgetId called for', budgetId);
  if (!budgetId) return [];
  // Сортируем по дате, самые новые сверху
  return transactions
    .filter((t) => t.budgetId === budgetId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
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
