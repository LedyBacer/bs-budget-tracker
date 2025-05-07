// lib/redux/api.ts
import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import { Budget, Category, Transaction, TransactionType, WebAppUser } from '@/types';
import * as mockApi from '@/lib/mockData';

// Тип для ответа от getTransactionsByBudgetId
interface TransactionsResponse {
  transactions: Transaction[];
  totalCount: number;
}

// Тип для аргументов getDailyExpenseSummaries
interface DailyExpenseSummariesArgs {
  budgetId: string;
  dateRange: { startDate: string; endDate: string };
}

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fakeBaseQuery(),
  tagTypes: ['Budget', 'Category', 'Transaction', 'TransactionList', 'TransactionSums'], // Добавлены TransactionList и TransactionSums
  endpoints: (builder) => ({
    // Бюджеты
    getBudgets: builder.query<Budget[], void>({
      queryFn: async () => {
        try {
          const response = await mockApi.getBudgets();
          return { data: response };
        } catch (error) {
          return {
            error: {
              status: 'CUSTOM_ERROR',
              error: error instanceof Error ? error.message : 'Ошибка при загрузке бюджетов',
            },
          };
        }
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Budget' as const, id })),
              { type: 'Budget', id: 'LIST' },
            ]
          : [{ type: 'Budget', id: 'LIST' }],
    }),

    addBudget: builder.mutation<Budget, { name: string; totalAmount: number }>({
      queryFn: async ({ name, totalAmount }) => {
        try {
          const response = await mockApi.addBudget(name, totalAmount);
          return { data: response };
        } catch (error) {
          return {
            error: {
              status: 'CUSTOM_ERROR',
              error: error instanceof Error ? error.message : 'Ошибка при добавлении бюджета',
            },
          };
        }
      },
      invalidatesTags: [{ type: 'Budget', id: 'LIST' }],
    }),

    updateBudget: builder.mutation<Budget, { id: string; name: string; totalAmount: number }>({
      queryFn: async ({ id, name, totalAmount }) => {
        try {
          const response = await mockApi.updateBudget(id, name, totalAmount);
          return { data: response };
        } catch (error) {
          return {
            error: {
              status: 'CUSTOM_ERROR',
              error: error instanceof Error ? error.message : 'Ошибка при обновлении бюджета',
            },
          };
        }
      },
      invalidatesTags: (result, error, { id }) => [
        { type: 'Budget', id },
        { type: 'Budget', id: 'LIST' },
      ],
    }),

    deleteBudget: builder.mutation<boolean, string>({
      queryFn: async (id) => {
        try {
          const response = await mockApi.deleteBudget(id);
          return { data: response };
        } catch (error) {
          return {
            error: {
              status: 'CUSTOM_ERROR',
              error: error instanceof Error ? error.message : 'Ошибка при удалении бюджета',
            },
          };
        }
      },
      invalidatesTags: (result, error, id) => [
        { type: 'Budget', id: 'LIST' },
        { type: 'Budget', id },
        { type: 'Category', id: 'LIST' }, // Бюджет удален, категории тоже
        { type: 'TransactionList' }, // Транзакции тоже
        { type: 'TransactionSums' }, // И суммы
      ],
    }),

    // Категории
    getCategoriesByBudgetId: builder.query<Category[], string>({
      queryFn: async (budgetId) => {
        if (!budgetId) return { data: [] }; // Если нет budgetId, возвращаем пустой массив
        try {
          const response = await mockApi.getCategoriesByBudgetId(budgetId);
          return { data: response };
        } catch (error) {
          return {
            error: {
              status: 'CUSTOM_ERROR',
              error: error instanceof Error ? error.message : 'Ошибка при загрузке категорий',
            },
          };
        }
      },
      providesTags: (result, error, budgetId) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Category' as const, id })),
              { type: 'Category', id: 'LIST', budgetId },
            ]
          : [{ type: 'Category', id: 'LIST', budgetId }],
    }),

    addCategory: builder.mutation<Category, { budgetId: string; name: string; limit: number }>({
      queryFn: async ({ budgetId, name, limit }) => {
        try {
          const response = await mockApi.addCategory(budgetId, name, limit);
          return { data: response };
        } catch (error) {
          return {
            error: {
              status: 'CUSTOM_ERROR',
              error: error instanceof Error ? error.message : 'Ошибка при добавлении категории',
            },
          };
        }
      },
      invalidatesTags: (result, error, { budgetId }) => [
        { type: 'Category', id: 'LIST', budgetId },
        { type: 'Budget', id: budgetId }, // Обновить данные бюджета (например, totalLimits)
      ],
    }),

    updateCategory: builder.mutation<Category, { categoryId: string; name: string; limit: number }>(
      {
        queryFn: async ({ categoryId, name, limit }) => {
          try {
            const response = await mockApi.updateCategory(categoryId, name, limit);
            return { data: response };
          } catch (error) {
            return {
              error: {
                status: 'CUSTOM_ERROR',
                error: error instanceof Error ? error.message : 'Ошибка при обновлении категории',
              },
            };
          }
        },
        invalidatesTags: (result, error, { categoryId }) =>
          result
            ? [
                { type: 'Category', id: categoryId },
                { type: 'Category', id: 'LIST', budgetId: result.budgetId },
                { type: 'Budget', id: result.budgetId }, // Обновить данные бюджета
              ]
            : [],
      }
    ),

    deleteCategory: builder.mutation<boolean, string>({
      queryFn: async (categoryId) => {
        try {
          // Нужно получить budgetId перед удалением, если он не возвращается
          // Для мока это не так критично, но для реального API это важно
          // Пока оставим так, но в реальном API mockApi.deleteCategory мог бы возвращать удаленную категорию или ее budgetId
          const response = await mockApi.deleteCategory(categoryId);
          return { data: response };
        } catch (error) {
          return {
            error: {
              status: 'CUSTOM_ERROR',
              error: error instanceof Error ? error.message : 'Ошибка при удалении категории',
            },
          };
        }
      },
      // Инвалидация немного усложняется, так как budgetId не доступен напрямую из arg
      // Можно было бы сделать refetchQueries или инвалидировать более общий тег,
      // либо mockApi.deleteCategory должен возвращать { success: boolean, budgetId: string }
      // Для упрощения пока инвалидируем общий список категорий и все бюджеты.
      // В идеале, нужно инвалидировать категории конкретного бюджета.
      invalidatesTags: (result, error, categoryId) => [
        { type: 'Category', id: 'LIST' }, // Общий для всех бюджетов, если не знаем budgetId
        { type: 'Category', id: categoryId },
        { type: 'Budget', id: 'LIST' }, // Предполагаем, что это может повлиять на бюджет
      ],
    }),

    // Транзакции
    getTransactionsByBudgetId: builder.query<
      TransactionsResponse, // Измененный тип
      {
        budgetId: string;
        options?: {
          page?: number;
          limit?: number;
          dateRange?: 'all' | 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth' | 'custom';
          startDate?: string;
          endDate?: string;
          type?: 'all' | 'expense' | 'income';
          categoryId?: string;
          userId?: string;
        };
      }
    >({
      queryFn: async ({ budgetId, options }) => {
        if (!budgetId) return { data: { transactions: [], totalCount: 0 } };
        try {
          console.log(
            `RTK Query: getTransactionsByBudgetId для бюджета ${budgetId}, опции:`,
            options
          );
          // mockApi теперь возвращает { transactions, totalCount }
          const response = await mockApi.getTransactionsByBudgetId(budgetId, options);
          return { data: response };
        } catch (error) {
          return {
            error: {
              status: 'CUSTOM_ERROR',
              error: error instanceof Error ? error.message : 'Ошибка при загрузке транзакций',
            },
          };
        }
      },
      serializeQueryArgs: ({ queryArgs }) => {
        // Сериализуем все опции для уникальности ключа кэша
        const { budgetId, options } = queryArgs;
        return `transactions-${budgetId}-${JSON.stringify(options || {})}`;
      },
      // merge больше не нужен здесь в таком виде, если мы управляем накоплением в хуке
      // RTK Query будет кэшировать каждую страницу (или комбинацию фильтров + страница) отдельно.
      providesTags: (result, error, { budgetId, options }) => [
        { type: 'TransactionList', id: `${budgetId}-${JSON.stringify(options || {})}` },
      ],
    }),

    // Новый эндпоинт для получения сумм расходов по дням
    getDailyExpenseSummaries: builder.query<Record<string, number>, DailyExpenseSummariesArgs>({
      queryFn: async ({ budgetId, dateRange }) => {
        try {
          const response = await mockApi.getDailyExpenseSummaries(budgetId, dateRange);
          return { data: response };
        } catch (error) {
          return {
            error: {
              status: 'CUSTOM_ERROR',
              error: error instanceof Error ? error.message : 'Ошибка при загрузке сумм расходов',
            },
          };
        }
      },
      providesTags: (result, error, { budgetId, dateRange }) => [
        { type: 'TransactionSums', id: `${budgetId}-${dateRange.startDate}-${dateRange.endDate}` },
      ],
    }),

    addTransaction: builder.mutation<
      Transaction,
      {
        budgetId: string;
        categoryId: string;
        type: TransactionType;
        amount: number;
        author: Pick<WebAppUser, 'id' | 'first_name' | 'last_name' | 'username'>;
        name?: string;
        comment?: string;
        createdAt?: Date | string;
      }
    >({
      queryFn: async (transactionData) => {
        try {
          const { budgetId, categoryId, type, amount, author, name, comment, createdAt } =
            transactionData;
          const response = await mockApi.addTransaction(
            budgetId,
            categoryId,
            type,
            amount,
            author,
            name,
            comment,
            createdAt instanceof Date ? createdAt : createdAt ? new Date(createdAt) : undefined
          );
          return { data: response };
        } catch (error) {
          return {
            error: {
              status: 'CUSTOM_ERROR',
              error: error instanceof Error ? error.message : 'Ошибка при добавлении транзакции',
            },
          };
        }
      },
      invalidatesTags: (result, error, { budgetId }) =>
        [
          { type: 'TransactionList' }, // Инвалидируем все списки транзакций (можно уточнить по budgetId)
          { type: 'TransactionSums' }, // Инвалидируем все суммы (можно уточнить по budgetId)
          { type: 'Budget', id: budgetId },
          { type: 'Category', id: 'LIST', budgetId: budgetId }, // Обновляем список категорий для бюджета
          result ? { type: 'Category', id: result.categoryId } : undefined, // Обновляем конкретную категорию
        ].filter(Boolean) as any,
    }),

    updateTransaction: builder.mutation<
      Transaction,
      {
        transactionId: string;
        data: Partial<{
          name?: string;
          type: TransactionType;
          amount: number;
          categoryId: string;
          comment?: string;
          createdAt?: Date | string;
        }>;
      }
    >({
      queryFn: async ({ transactionId, data }) => {
        try {
          const processedData = {
            ...data,
            createdAt:
              data.createdAt instanceof Date
                ? data.createdAt
                : data.createdAt
                  ? new Date(data.createdAt)
                  : undefined,
          };
          const response = await mockApi.updateTransaction(transactionId, processedData);
          return { data: response };
        } catch (error) {
          return {
            error: {
              status: 'CUSTOM_ERROR',
              error: error instanceof Error ? error.message : 'Ошибка при обновлении транзакции',
            },
          };
        }
      },
      invalidatesTags: (result, error, { data }) =>
        result
          ? [
              { type: 'TransactionList' },
              { type: 'TransactionSums' },
              { type: 'Budget', id: result.budgetId },
              { type: 'Category', id: 'LIST', budgetId: result.budgetId },
              { type: 'Category', id: result.categoryId },
              // Если категория изменилась, нужно также инвалидировать старую категорию,
              // но для этого нужно знать старую categoryId.
              // Для простоты пока так.
            ]
          : [],
    }),

    deleteTransaction: builder.mutation<boolean, string>({
      queryFn: async (transactionId) => {
        try {
          // Перед удалением нужно получить транзакцию, чтобы знать ее budgetId и categoryId для корректной инвалидации.
          // В mockApi это не сделано, но в реальном API это было бы важно.
          // Предположим, что инвалидация более общих тегов достаточна для моков.
          const response = await mockApi.deleteTransaction(transactionId);
          return { data: response };
        } catch (error) {
          return {
            error: {
              status: 'CUSTOM_ERROR',
              error: error instanceof Error ? error.message : 'Ошибка при удалении транзакции',
            },
          };
        }
      },
      // Для инвалидации после удаления, в идеале, нам нужны budgetId и categoryId удаленной транзакции.
      // Так как mockApi.deleteTransaction их не возвращает, используем более общую инвалидацию.
      invalidatesTags: (result, error, transactionId) => [
        { type: 'TransactionList' },
        { type: 'TransactionSums' },
        { type: 'Budget', id: 'LIST' }, // Обновляем все бюджеты, т.к. баланс мог измениться
        { type: 'Category', id: 'LIST' }, // Обновляем все категории
      ],
    }),
  }),
});

export const {
  useGetBudgetsQuery,
  useAddBudgetMutation,
  useUpdateBudgetMutation,
  useDeleteBudgetMutation,
  useGetCategoriesByBudgetIdQuery,
  useAddCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useGetTransactionsByBudgetIdQuery,
  useGetDailyExpenseSummariesQuery, // Экспортируем новый хук
  useAddTransactionMutation,
  useUpdateTransactionMutation,
  useDeleteTransactionMutation,
} = api;
