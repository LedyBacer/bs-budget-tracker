// src/components/features/budget/BudgetForm.tsx
import { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { popup } from '@telegram-apps/sdk-react';
import { Budget } from '@/types';
import { useScrollToInput } from '@/hooks/useScrollToInput';
import { formatNumberWithSpaces, parseFormattedNumber } from '@/lib/utils';
import { BudgetFormFields } from './components/BudgetFormFields';
import { BudgetFormFooter } from './components/BudgetFormFooter';
import { budgetSchema, BudgetFormData } from './components/BudgetFormValidation';
import { BudgetHandlers, BudgetFormControlProps } from './utils';
import { useBudgetsRedux } from '@/hooks/useBudgetsRedux';

interface BudgetFormProps extends BudgetFormControlProps, BudgetHandlers {
  budgetToEdit?: Budget | null;
}

export function BudgetForm({
  budgetToEdit,
  open,
  onOpenChange,
  onBudgetSaved,
}: BudgetFormProps) {
  useScrollToInput({ isOpen: open });
  const { addBudget, updateBudget } = useBudgetsRedux();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formattedAmount, setFormattedAmount] = useState<string>('');

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<BudgetFormData>({
    resolver: zodResolver(budgetSchema) as any,
  });

  // Сброс и установка значений при открытии/смене режима
  useEffect(() => {
    if (open) {
      const initialAmount = budgetToEdit?.total_amount || 0;
      setFormattedAmount(initialAmount ? formatNumberWithSpaces(initialAmount) : '');
      reset({
        name: budgetToEdit?.name || '',
        total_amount: initialAmount,
      });
      setSubmitError(null);
    } else {
      reset();
      setFormattedAmount('');
    }
  }, [open, budgetToEdit, reset]);

  const onSubmit: SubmitHandler<BudgetFormData> = async (data) => {
    setIsSubmitting(true);
    setSubmitError(null);
    console.log('Submitting budget form:', data);

    try {
      if (budgetToEdit) {
        await handleUpdateBudget(budgetToEdit.id, data);
      } else {
        await handleCreateBudget(data);
      }
      onBudgetSaved();
      onOpenChange(false);
    } catch (error) {
      handleSubmitError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateBudget = async (budgetId: string, data: BudgetFormData) => {
    const updated = await updateBudget(budgetId, data.name, data.total_amount);
    if (!updated) {
      throw new Error('Не удалось обновить бюджет.');
    }
  };

  const handleCreateBudget = async (data: BudgetFormData) => {
    const newBudget = await addBudget(data.name, data.total_amount);
    if (!newBudget) {
      throw new Error('Не удалось добавить бюджет. Попробуйте снова.');
    }
  };

  const handleSubmitError = (error: unknown) => {
    console.error('Failed to save budget:', error);
    const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
    setSubmitError(errorMessage);
    popup.open.ifAvailable({ title: 'Ошибка', message: errorMessage });
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const formatted = formatNumberWithSpaces(value);
    setFormattedAmount(formatted);
    setValue('total_amount', parseFormattedNumber(value));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {budgetToEdit ? 'Редактировать бюджет' : 'Новый бюджет'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit as any)}>
          <BudgetFormFields 
            register={register}
            errors={errors}
            formattedAmount={formattedAmount}
            handleAmountChange={handleAmountChange}
            isSubmitting={isSubmitting}
          />
          
          {/* Ошибка отправки */}
          {submitError && (
            <p className="text-destructive col-span-4 text-center text-sm">{submitError}</p>
          )}
          
          <BudgetFormFooter 
            isSubmitting={isSubmitting} 
            budgetToEdit={budgetToEdit} 
          />
        </form>
      </DialogContent>
    </Dialog>
  );
}
