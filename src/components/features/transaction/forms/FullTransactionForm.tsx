import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { HapticButton } from '@/components/ui/haptic-button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';

import { Category, Transaction, WebAppUser } from '@/types';
import { useScrollToInput } from '@/hooks/useScrollToInput';
import { useTransactionsRedux } from '@/hooks/useTransactionsRedux';
import { formatNumberWithSpaces } from '@/lib/utils';

// Импортируем переиспользуемые компоненты
import { TypeSelector } from './TypeSelector';
import { CategorySelector } from './CategorySelector';
import { AmountInput } from './AmountInput';
import { DateTimeInput } from './DateTimeInput';

// Импортируем типы и хуки
import { FullTransactionFormData, fullTransactionSchema } from '../utils/schemas';
import { getFullFormDefaultValues } from '../utils/formHelpers';
import { useTelegramUser } from '../hooks/useTelegramUser';

interface FullTransactionFormProps {
  budgetId: string;
  transactionToEdit?: Transaction | null;
  categories: Category[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTransactionSaved: () => void;
}

export function FullTransactionForm({
  budgetId,
  transactionToEdit,
  categories,
  open,
  onOpenChange,
  onTransactionSaved,
}: FullTransactionFormProps) {
  // Хуки
  useScrollToInput({ isOpen: open });
  const { currentUser } = useTelegramUser();
  const { addTransaction, updateTransaction } = useTransactionsRedux(budgetId);
  
  // Состояния
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formattedAmount, setFormattedAmount] = useState<string>('');
  const [isLoadingCategories] = useState(false);

  // React Hook Form
  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    trigger,
    watch,
    formState: { errors, isValid },
  } = useForm<FullTransactionFormData>({
    resolver: zodResolver(fullTransactionSchema) as any,
    defaultValues: getFullFormDefaultValues(transactionToEdit),
    mode: 'onChange',
  });

  // Наблюдаем за изменениями в основных полях формы
  const watchedType = watch('type');
  const watchedCategoryId = watch('categoryId');
  const watchedAmount = watch('amount');
  const watchedCreatedAt = watch('createdAt');

  // Инициализация формы при открытии или изменении транзакции для редактирования
  useEffect(() => {
    if (open) {
      const defaultValues = getFullFormDefaultValues();
      
      if (transactionToEdit) {
        defaultValues.type = transactionToEdit.type || 'expense';
        defaultValues.amount = transactionToEdit.amount || 0;
        defaultValues.categoryId = transactionToEdit.category_id;
        defaultValues.name = transactionToEdit.name || '';
        defaultValues.comment = transactionToEdit.comment || '';
        setFormattedAmount(formatNumberWithSpaces(transactionToEdit.amount));
      }
      
      // Убедимся, что дата корректно передается компоненту DateTimeInput
      if (transactionToEdit?.transaction_date) {
        defaultValues.createdAt = new Date(transactionToEdit.transaction_date);
      }
      
      reset(defaultValues);
      setSubmitError(null);
    }
  }, [open, reset, transactionToEdit]);

  // Обработчик сохранения формы
  const onSubmit = async (data: FullTransactionFormData) => {
    if (!currentUser) {
      setSubmitError('Не удалось определить пользователя Telegram');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      if (transactionToEdit) {
        // Обновление существующей транзакции
        await updateTransaction(transactionToEdit.id, {
          type: data.type,
          amount: data.amount,
          category_id: data.categoryId,
          name: data.name,
          comment: data.comment,
          transaction_date: data.createdAt,
        });
      } else {
        // Создание новой транзакции
        await addTransaction(
          data.categoryId,
          data.type,
          data.amount,
          {
            id: currentUser.id,
            first_name: currentUser.first_name,
            last_name: currentUser.last_name,
            username: currentUser.username,
          },
          data.name || '',
          data.comment || '',
          data.createdAt
        );
      }

      onTransactionSaved();
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
    const value = e.target.value;
    const formatted = value.replace(/\s/g, '');
    const formattedValue = formatNumberWithSpaces(value);
    setFormattedAmount(formattedValue);
    setValue('amount', Number(formatted) || 0);
    trigger('amount'); // Запускаем повторную валидацию суммы
  };

  // Эффект для принудительной валидации при изменении основных полей
  useEffect(() => {
    if (open) {
      trigger(); // Запускаем валидацию всей формы при изменении основных полей
    }
  }, [watchedType, watchedCategoryId, watchedAmount, watchedCreatedAt, open, trigger]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {transactionToEdit ? 'Редактировать транзакцию' : 'Добавить транзакцию'}
          </DialogTitle>
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

            {/* Название */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Название
              </Label>
              <div className="col-span-3">
                <Input
                  id="name"
                  placeholder="Например: Обед в кафе"
                  {...register('name')}
                  disabled={isSubmitting}
                />
                {errors.name && (
                  <p className="text-destructive mt-1 text-xs">{errors.name.message}</p>
                )}
              </div>
            </div>

            {/* Комментарий */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="comment" className="text-right">
                Заметка
              </Label>
              <div className="col-span-3">
                <Textarea
                  id="comment"
                  placeholder="Дополнительная информация..."
                  {...register('comment')}
                  className="h-20 resize-none"
                  disabled={isSubmitting}
                />
                {errors.comment && (
                  <p className="text-destructive mt-1 text-xs">{errors.comment.message}</p>
                )}
              </div>
            </div>

            {/* Дата и время */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Дата</Label>
              <div className="col-span-3">
                <DateTimeInput
                  control={control}
                  disabled={isSubmitting}
                  errors={errors}
                />
              </div>
            </div>

            {/* Ошибка отправки */}
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
            <HapticButton type="submit" disabled={isSubmitting || !isValid}>
              {isSubmitting ? 'Сохранение...' : 'Сохранить'}
            </HapticButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 