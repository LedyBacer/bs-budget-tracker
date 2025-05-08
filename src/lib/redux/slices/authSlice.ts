// lib/redux/slices/authSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store';

interface AuthState {
  rawInitData: string | null;
  // Можно добавить другие поля, связанные с аутентификацией, если понадобятся
  // например, parsedUserData, isAuthenticated и т.д.
}

const initialState: AuthState = {
  rawInitData: null,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setRawInitData: (state, action: PayloadAction<string | null>) => {
      state.rawInitData = action.payload;
      // Здесь можно добавить логику для парсинга initData и сохранения данных пользователя, если нужно
    },
    // Можно добавить clearAuthData для выхода или сброса
    clearAuthData: (state) => {
      state.rawInitData = null;
      // сбросить другие поля
    },
  },
});

export const { setRawInitData, clearAuthData } = authSlice.actions;

// Селекторы
export const selectRawInitData = (state: RootState) => state.auth.rawInitData;
// export const selectIsAuthenticated = (state: RootState) => !!state.auth.rawInitData; // Пример

export default authSlice.reducer;
