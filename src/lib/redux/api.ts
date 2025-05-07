import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import { Budget, Category, Transaction, TransactionType, WebAppUser } from '@/types';
import * as mockApi from '@/lib/mockData';

// Вспомогательный тип для сериализованного бюджета с датой в виде строки
type SerializedBudget = Omit<Budget, 'createdAt'> & { createdAt: string };

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fakeBaseQuery(),
  tagTypes: ['Budget', 'Category', 'Transaction'],
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
              error: error instanceof Error ? error.message : 'Ошибка при загрузке бюджетов' 
            } 
          };
        }
      },
      providesTags: ['Budget'],
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
              error: error instanceof Error ? error.message : 'Ошибка при добавлении бюджета' 
            } 
          };
        }
      },
      invalidatesTags: ['Budget'],
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
              error: error instanceof Error ? error.message : 'Ошибка при обновлении бюджета' 
            } 
          };
        }
      },
      invalidatesTags: ['Budget'],
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
              error: error instanceof Error ? error.message : 'Ошибка при удалении бюджета' 
            } 
          };
        }
      },
      invalidatesTags: ['Budget'],
    }),
    
    // Категории
    getCategoriesByBudgetId: builder.query<Category[], string>({
      queryFn: async (budgetId) => {
        try {
          const response = await mockApi.getCategoriesByBudgetId(budgetId);
          return { data: response };
        } catch (error) {
          return { 
            error: { 
              status: 'CUSTOM_ERROR', 
              error: error instanceof Error ? error.message : 'Ошибка при загрузке категорий' 
            } 
          };
        }
      },
      providesTags: ['Category'],
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
              error: error instanceof Error ? error.message : 'Ошибка при добавлении категории' 
            } 
          };
        }
      },
      invalidatesTags: ['Category', 'Budget'],
    }),
    
    updateCategory: builder.mutation<Category, { categoryId: string; name: string; limit: number }>({
      queryFn: async ({ categoryId, name, limit }) => {
        try {
          const response = await mockApi.updateCategory(categoryId, name, limit);
          return { data: response };
        } catch (error) {
          return { 
            error: { 
              status: 'CUSTOM_ERROR', 
              error: error instanceof Error ? error.message : 'Ошибка при обновлении категории' 
            } 
          };
        }
      },
      invalidatesTags: ['Category', 'Budget'],
    }),
    
    deleteCategory: builder.mutation<boolean, string>({
      queryFn: async (categoryId) => {
        try {
          const response = await mockApi.deleteCategory(categoryId);
          return { data: response };
        } catch (error) {
          return { 
            error: { 
              status: 'CUSTOM_ERROR', 
              error: error instanceof Error ? error.message : 'Ошибка при удалении категории' 
            } 
          };
        }
      },
      invalidatesTags: ['Category', 'Budget'],
    }),
    
    // Транзакции
    getTransactionsByBudgetId: builder.query<
      Transaction[], 
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
        }
      }
    >({
      queryFn: async ({ budgetId, options }) => {
        try {
          const response = await mockApi.getTransactionsByBudgetId(budgetId, options);
          return { data: response };
        } catch (error) {
          return { 
            error: { 
              status: 'CUSTOM_ERROR', 
              error: error instanceof Error ? error.message : 'Ошибка при загрузке транзакций' 
            } 
          };
        }
      },
      providesTags: ['Transaction'],
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
          const { budgetId, categoryId, type, amount, author, name, comment, createdAt } = transactionData;
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
              error: error instanceof Error ? error.message : 'Ошибка при добавлении транзакции' 
            } 
          };
        }
      },
      invalidatesTags: ['Transaction', 'Budget', 'Category'],
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
          // Преобразуем строковую дату в объект Date перед отправкой
          const processedData = {
            ...data,
            createdAt: data.createdAt instanceof Date ? 
              data.createdAt : 
              data.createdAt ? new Date(data.createdAt) : undefined
          };
          const response = await mockApi.updateTransaction(transactionId, processedData);
          return { data: response };
        } catch (error) {
          return { 
            error: { 
              status: 'CUSTOM_ERROR', 
              error: error instanceof Error ? error.message : 'Ошибка при обновлении транзакции' 
            } 
          };
        }
      },
      invalidatesTags: ['Transaction', 'Budget', 'Category'],
    }),
    
    deleteTransaction: builder.mutation<boolean, string>({
      queryFn: async (transactionId) => {
        try {
          const response = await mockApi.deleteTransaction(transactionId);
          return { data: response };
        } catch (error) {
          return { 
            error: { 
              status: 'CUSTOM_ERROR', 
              error: error instanceof Error ? error.message : 'Ошибка при удалении транзакции' 
            } 
          };
        }
      },
      invalidatesTags: ['Transaction', 'Budget', 'Category'],
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
  useAddTransactionMutation,
  useUpdateTransactionMutation,
  useDeleteTransactionMutation,
} = api; 