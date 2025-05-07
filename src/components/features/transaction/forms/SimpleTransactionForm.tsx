import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { HapticButton } from '@/components/ui/haptic-button';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';

import { useBudgetsRedux } from '@/hooks/useBudgetsRedux';
import { useScrollToInput } from '@/hooks/useScrollToInput';
import { useAddTransactionMutation } from '@/lib/redux/api';

// Импортируем переиспользуемые компоненты
import { TypeSelector } from './TypeSelector';
import { CategorySelector } from './CategorySelector';
import { AmountInput } from './AmountInput';

// Импортируем типы и хуки
import { SimpleTransactionFormData, simpleTransactionSchema } from '../utils/schemas';
import { getSimpleFormDefaultValues, handleAmountChange } from '../utils/formHelpers';
import { useCategoriesLoader } from '../hooks/useCategoriesLoader';
import { useTelegramUser } from '../hooks/useTelegramUser';

interface SimpleTransactionFormProps {
  budgetId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTransactionSaved: () => void;
}

export function SimpleTransactionForm({
  budgetId,
  open,
  onOpenChange,
  onTransactionSaved,
}: SimpleTransactionFormProps) {
  // Хуки
  useScrollToInput({ isOpen: open });
  const { reloadBudgets } = useBudgetsRedux();
  const { currentUser } = useTelegramUser();
  const { categories, isLoadingCategories, error: categoriesError } = useCategoriesLoader(budgetId, open);
  const [addTransaction] = useAddTransactionMutation();

  // Состояния
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formattedAmount, setFormattedAmount] = useState<string>('');

  // React Hook Form
  const {
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors },
  } = useForm<SimpleTransactionFormData>({
    resolver: zodResolver(simpleTransactionSchema) as any,
    defaultValues: getSimpleFormDefaultValues(),
  });

  // Сброс формы при открытии
  useEffect(() => {
    if (open) {
      setFormattedAmount('');
      reset(getSimpleFormDefaultValues());
      setSubmitError(null);
    }
  }, [open, reset]);

  // Обработчик сохранения формы
  const onSubmit = async (data: SimpleTransactionFormData) => {
    if (!currentUser) {
      setSubmitError('Не удалось определить пользователя Telegram');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Проверяем, что сумма установлена и больше 0
      if (data.amount <= 0) {
        setSubmitError('Сумма должна быть больше 0');
        setIsSubmitting(false);
        return;
      }

      // Используем Redux API вместо прямого вызова mockApi
      await addTransaction({
        budgetId,
        categoryId: data.categoryId,
        type: data.type,
        amount: data.amount,
        author: {
          id: currentUser.id,
          first_name: currentUser.first_name,
          last_name: currentUser.last_name,
          username: currentUser.username,
        },
        name: '',
        comment: '',
        createdAt: new Date()
      }).unwrap();
      
      onTransactionSaved();
      await reloadBudgets();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save transaction:', error);
      setSubmitError(error instanceof Error ? error.message : 'Не удалось сохранить транзакцию');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Обработчик изменения суммы
  const handleAmountChangeProxy = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Используем типизированную версию setValue для amount
    const amountSetter = (name: "amount", value: number) => setValue(name, value);
    handleAmountChange(e, setFormattedAmount, amountSetter);
  };

  // Отображение ошибки из загрузчика категорий
  useEffect(() => {
    if (categoriesError) {
      setSubmitError(categoriesError);
    }
  }, [categoriesError]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Добавить транзакцию</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit as any)}>
          <div className="grid gap-4 py-4">
            {/* Тип транзакции */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Тип</Label>
              <div className="col-span-3">
                <TypeSelector 
                  control={control} 
                  disabled={isSubmitting} 
                />
                {errors.type && (
                  <p className="text-destructive mt-1 text-xs">{errors.type.message}</p>
                )}
              </div>
            </div>

            {/* Категория */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="categoryId" className="text-right">
                Категория
              </Label>
              <div className="col-span-3">
                <CategorySelector
                  control={control}
                  categories={categories}
                  isLoading={isLoadingCategories}
                  disabled={isSubmitting}
                  errors={errors}
                />
              </div>
            </div>

            {/* Сумма */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right whitespace-nowrap">
                Сумма, ₽
              </Label>
              <div className="col-span-3">
                <AmountInput
                  value={formattedAmount}
                  onChange={handleAmountChangeProxy}
                  disabled={isSubmitting}
                  errors={errors}
                />
              </div>
            </div>

            {submitError && (
              <p className="text-destructive col-span-4 text-center text-sm">{submitError}</p>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <HapticButton type="button" variant="outline" disabled={isSubmitting}>
                Отмена
              </HapticButton>
            </DialogClose>
            <HapticButton type="submit" disabled={isSubmitting || !currentUser}>
              {isSubmitting ? 'Сохранение...' : 'Сохранить'}
            </HapticButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 