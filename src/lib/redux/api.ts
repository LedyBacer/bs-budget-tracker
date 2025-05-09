// lib/redux/api.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from './store';
import {
  Budget,
  Category,
  Transaction,
  TransactionType as LocalTransactionType, // Переименовываем локальный для избежания конфликта с импортированным
  TransactionAuthorInfo,
} from '@/types';
import {
  BudgetCreate,
  BudgetUpdate,
  CategoryCreate,
  CategoryUpdate,
  TransactionCreate,
  TransactionUpdate,
  TransactionListResponse,
  DateTransactionSummary, // <--- Новый тип для ответа
  TransactionType as ApiTransactionType, // Тип из API, если он отличается
} from '@/types/api';

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: '/',
    prepareHeaders: (headers, { getState }) => {
      const initData = (getState() as RootState).auth.rawInitData;
      if (initData) {
        headers.set('X-Telegram-Init-Data', initData);
      }
      return headers;
    },
  }),
  tagTypes: ['Budget', 'Category', 'Transaction', 'TransactionList', 'TransactionSums'],
  endpoints: (builder) => ({
    // ... эндпоинты для Budget, Category ... (без изменений от предыдущего шага)
    getBudgets: builder.query<Budget[], { skip?: number; limit?: number }>({
      query: (params) => ({
        url: '/api/v1/budgets/',
        params,
      }),
      onQueryStarted: async (args, { getState, queryFulfilled, dispatch }) => {
        const initData = (getState() as RootState).auth.rawInitData;
        if (!initData) {
          console.warn('Attempting to fetch budgets without auth data, this will likely fail');
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
    getBudgetById: builder.query<Budget, string>({
      query: (budget_id) => `/api/v1/budgets/${budget_id}`,
      providesTags: (result, error, id) => [{ type: 'Budget', id }],
    }),
    addBudget: builder.mutation<Budget, BudgetCreate>({
      query: (newBudget) => ({
        url: '/api/v1/budgets/',
        method: 'POST',
        body: newBudget,
      }),
      invalidatesTags: [{ type: 'Budget', id: 'LIST' }],
    }),
    updateBudget: builder.mutation<Budget, { budget_id: string; data: BudgetUpdate }>({
      query: ({ budget_id, data }) => ({
        url: `/api/v1/budgets/${budget_id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { budget_id }) => [
        { type: 'Budget', id: budget_id },
        { type: 'Budget', id: 'LIST' },
      ],
    }),
    deleteBudget: builder.mutation<void, string>({
      query: (budget_id) => ({
        url: `/api/v1/budgets/${budget_id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Budget', id: 'LIST' },
        { type: 'Budget', id },
        { type: 'Category', id: 'LIST' },
        { type: 'TransactionList' },
        { type: 'TransactionSums' },
      ],
    }),

    // Категории
    getCategoriesByBudgetId: builder.query<
      Category[],
      { budget_id: string; skip?: number; limit?: number }
    >({
      query: ({ budget_id, ...params }) => ({
        url: `/api/v1/budgets/${budget_id}/categories/`,
        params,
      }),
      providesTags: (result, error, { budget_id }) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Category' as const, id })),
              { type: 'Category', id: 'LIST', budgetId: budget_id },
            ]
          : [{ type: 'Category', id: 'LIST', budgetId: budget_id }],
    }),
    getCategoryById: builder.query<Category, string>({
      query: (category_id) => `/api/v1/categories/${category_id}`,
      providesTags: (result, error, id) => [{ type: 'Category', id }],
    }),
    addCategory: builder.mutation<Category, { budget_id: string; data: CategoryCreate }>({
      query: ({ budget_id, data }) => ({
        url: `/api/v1/budgets/${budget_id}/categories/`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { budget_id }) => [
        { type: 'Category', id: 'LIST', budgetId: budget_id },
        { type: 'Budget', id: budget_id },
      ],
    }),
    updateCategory: builder.mutation<Category, { category_id: string; data: CategoryUpdate }>({
      query: ({ category_id, data }) => ({
        url: `/api/v1/categories/${category_id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { category_id }) =>
        result
          ? [
              { type: 'Category', id: category_id },
              { type: 'Category', id: 'LIST', budgetId: result.budget_id },
              { type: 'Budget', id: result.budget_id },
            ]
          : [],
    }),
    deleteCategory: builder.mutation<void, string>({
      query: (category_id) => ({
        url: `/api/v1/categories/${category_id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, category_id) => [
        { type: 'Category', id: 'LIST' },
        { type: 'Category', id: category_id },
        { type: 'Budget', id: 'LIST' },
        { type: 'TransactionList' },
      ],
    }),

    // Транзакции
    getTransactionsByBudgetId: builder.query<
      TransactionListResponse,
      {
        budget_id: string;
        skip?: number;
        limit?: number;
        category_id?: string | null;
        author_user_id?: number | null;
        type?: ApiTransactionType | null; // Используем тип из API
        start_date?: string | null;
        end_date?: string | null;
      }
    >({
      query: ({ budget_id, ...params }) => ({
        url: `/api/v1/budgets/${budget_id}/transactions/`,
        params,
      }),
      providesTags: (result, error, { budget_id, ...params }) => [
        { type: 'TransactionList', id: `${budget_id}-${JSON.stringify(params)}` },
      ],
    }),
    getTransactionById: builder.query<Transaction, string>({
      query: (transaction_id) => `/api/v1/transactions/${transaction_id}`,
      providesTags: (result, error, id) => [{ type: 'Transaction', id }],
    }),
    addTransaction: builder.mutation<Transaction, { budget_id: string; data: TransactionCreate }>({
      query: ({ budget_id, data }) => ({
        url: `/api/v1/budgets/${budget_id}/transactions/`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { budget_id }) =>
        [
          { type: 'TransactionList' },
          { type: 'TransactionSums' }, // Инвалидируем суммы при добавлении транзакции
          { type: 'Budget', id: budget_id },
          { type: 'Category', id: 'LIST', budgetId: budget_id },
          result ? { type: 'Category', id: result.category_id } : undefined,
        ].filter(Boolean) as any,
    }),
    updateTransaction: builder.mutation<
      Transaction,
      { transaction_id: string; data: TransactionUpdate }
    >({
      query: ({ transaction_id, data }) => ({
        url: `/api/v1/transactions/${transaction_id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { transaction_id }) =>
        result
          ? [
              { type: 'Transaction', id: transaction_id },
              { type: 'TransactionList' },
              { type: 'TransactionSums' }, // Инвалидируем суммы при обновлении транзакции
              { type: 'Budget', id: result.budget_id },
              { type: 'Category', id: 'LIST', budgetId: result.budget_id },
              { type: 'Category', id: result.category_id },
            ]
          : [],
    }),
    deleteTransaction: builder.mutation<void, string>({
      query: (transaction_id) => ({
        url: `/api/v1/transactions/${transaction_id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, transaction_id) => [
        { type: 'Transaction', id: transaction_id },
        { type: 'TransactionList' },
        { type: 'TransactionSums' }, // Инвалидируем суммы при удалении транзакции
        { type: 'Budget', id: 'LIST' },
        { type: 'Category', id: 'LIST' },
      ],
    }),

    // Эндпоинт для получения сумм транзакций по дате
    getTransactionsDateSummary: builder.query<
      DateTransactionSummary,
      {
        budget_id: string;
        start_date: string; // Обязательный параметр, YYYY-MM-DD
        end_date?: string | null; // Опциональный, YYYY-MM-DD
        transaction_type?: 'expense' | 'income' | 'all'; // опционально, default 'all'
      }
    >({
      query: ({ budget_id, start_date, end_date, transaction_type }) => {
        const params: Record<string, any> = { start_date };
        if (end_date) {
          params.end_date = end_date;
        }
        if (transaction_type) {
          params.transaction_type = transaction_type;
        }
        return {
          url: `/api/v1/budgets/${budget_id}/transactions/date-summary/`,
          params,
        };
      },
      providesTags: (result, error, { budget_id, start_date, end_date, transaction_type }) => [
        {
          type: 'TransactionSums',
          id: `${budget_id}-${start_date}-${end_date || start_date}-${transaction_type || 'all'}`,
        },
      ],
    }),
  }),
});

export const {
  useGetBudgetsQuery,
  useGetBudgetByIdQuery,
  useAddBudgetMutation,
  useUpdateBudgetMutation,
  useDeleteBudgetMutation,
  useGetCategoriesByBudgetIdQuery,
  useGetCategoryByIdQuery,
  useAddCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useGetTransactionsByBudgetIdQuery,
  useGetTransactionByIdQuery,
  useAddTransactionMutation,
  useUpdateTransactionMutation,
  useDeleteTransactionMutation,
  useGetTransactionsDateSummaryQuery, // <--- Эта строка должна быть здесь
} = api;
