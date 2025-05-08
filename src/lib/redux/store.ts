// lib/redux/store.ts
import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { api } from './api';
import budgetsReducer from './slices/budgetsSlice';
import authReducer from './slices/authSlice'; // <--- Импортируем authReducer

export const store = configureStore({
  reducer: {
    auth: authReducer, // <--- Добавляем authReducer
    budgets: budgetsReducer,
    [api.reducerPath]: api.reducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(api.middleware),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
