import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store';

interface BudgetsState {
  currentBudgetId: string | null;
  dataVersion: number; // Для обновления компонентов при изменении данных
}

const initialState: BudgetsState = {
  currentBudgetId: null,
  dataVersion: 0,
};

export const budgetsSlice = createSlice({
  name: 'budgets',
  initialState,
  reducers: {
    selectBudget: (state, action: PayloadAction<string | null>) => {
      state.currentBudgetId = action.payload;
    },
    incrementDataVersion: (state) => {
      state.dataVersion += 1;
    },
  },
});

export const { selectBudget, incrementDataVersion } = budgetsSlice.actions;

// Селекторы
export const selectCurrentBudgetId = (state: RootState) => state.budgets.currentBudgetId;
export const selectDataVersion = (state: RootState) => state.budgets.dataVersion;

export default budgetsSlice.reducer; 