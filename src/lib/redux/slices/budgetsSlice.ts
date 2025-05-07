// lib/redux/slices/budgetsSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store';

interface BudgetsState {
  currentBudgetId: string | null;
}

const initialState: BudgetsState = {
  currentBudgetId: null,
};

export const budgetsSlice = createSlice({
  name: 'budgets',
  initialState,
  reducers: {
    selectBudget: (state, action: PayloadAction<string | null>) => {
      state.currentBudgetId = action.payload;
    },
  },
});

export const { selectBudget } = budgetsSlice.actions;

// Селектор
export const selectCurrentBudgetId = (state: RootState) => state.budgets.currentBudgetId;

export default budgetsSlice.reducer;
