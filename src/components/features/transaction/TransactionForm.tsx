// src/components/features/transaction/TransactionForm.tsx
import { useState, useEffect, useCallback, useMemo } from 'react';
// Важно: Импортируем Controller
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { HapticButton } from '@/components/ui/haptic-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'; // Компонент Select
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Category, Transaction, TransactionType, WebAppUser } from '@/types';
import * as mockApi from '@/lib/mockData';
import { useLaunchParams } from '@telegram-apps/sdk-react';
import { popup } from '@telegram-apps/sdk-react'; // Импортируем popup для уведомлений
import { Plus, Minus } from 'lucide-react';
import { useScrollToInput } from '@/hooks/useScrollToInput'; // Импортируем хук
import { formatNumberWithSpaces, parseFormattedNumber } from '@/lib/utils';

// --- Схема валидации Zod для транзакции ---
const transactionSchema = z.object({
  type: z.enum(['expense', 'income'], { required_error: 'Выберите тип транзакции' }),
  amount: z.number({ required_error: 'Введите сумму' })
    .positive({ message: 'Сумма должна быть положительной' })
    .min(0.01, { message: 'Сумма должна быть больше 0' }),
  categoryId: z.string().min(1, { message: 'Выберите категорию' }),
  name: z.string().optional(),
  comment: z.string().optional(),
  createdAt: z.date({ required_error: 'Выберите дату' }),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

interface TransactionFormProps {
  budgetId: string;
  transactionToEdit?: Transaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTransactionSaved: () => void; // Колбэк после сохранения
}

export function TransactionForm({
  budgetId,
  transactionToEdit,
  open,
  onOpenChange,
  onTransactionSaved,
}: TransactionFormProps) {
  useScrollToInput({ isOpen: open });
  
  const launchParams = useLaunchParams();
  const currentUser = useMemo(() => {
    if (launchParams.tgWebAppData && typeof launchParams.tgWebAppData === 'object') {
      const user = (launchParams.tgWebAppData as { user?: WebAppUser }).user;
      return user;
    }
    return undefined;
  }, [launchParams.tgWebAppData]);

  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formattedAmount, setFormattedAmount] = useState<string>('');

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors, isDirty, isValid },
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: transactionToEdit?.type || 'expense',
      amount: transactionToEdit?.amount || 0,
      categoryId: transactionToEdit?.categoryId || '',
      name: transactionToEdit?.name || '',
      comment: transactionToEdit?.comment || '',
      createdAt: transactionToEdit?.createdAt || new Date(),
    },
    mode: 'onChange',
  });

  // Загрузка категорий для выпадающего списка
  const loadCategories = useCallback(async () => {
    if (!budgetId) return;
    setIsLoadingCategories(true);
    try {
      const cats = await mockApi.getCategoriesByBudgetId(budgetId);
      setCategories(cats);
    } catch (error) {
      console.error('Failed to load categories for form:', error);
      setSubmitError('Ошибка загрузки категорий');
    } finally {
      setIsLoadingCategories(false);
    }
  }, [budgetId]);

  // Загружаем категории при открытии или смене budgetId
  useEffect(() => {
    if (open) {
      loadCategories();
    }
  }, [open, loadCategories]);

  // Сброс формы при изменении данных для редактирования или при открытии/закрытии
  useEffect(() => {
    if (open) {
      const initialAmount = transactionToEdit?.amount || 0;
      setFormattedAmount(formatNumberWithSpaces(initialAmount));
      reset({
        type: transactionToEdit?.type || 'expense',
        amount: initialAmount,
        categoryId: transactionToEdit?.categoryId || '',
        name: transactionToEdit?.name || '',
        comment: transactionToEdit?.comment || '',
        createdAt: transactionToEdit?.createdAt || new Date(),
      });
      setSubmitError(null);
    }
  }, [transactionToEdit, open, reset]);

  // Устанавливаем тип транзакции при открытии формы
  useEffect(() => {
    if (open && !transactionToEdit) {
      setValue('type', 'expense', { shouldValidate: true, shouldDirty: true });
    }
  }, [open, transactionToEdit, setValue]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\s/g, '');
    setFormattedAmount(formatNumberWithSpaces(Number(value)));
    setValue('amount', Number(value) || 0, { shouldValidate: true });
  };

  const onSubmit: SubmitHandler<TransactionFormData> = async (data) => {
    if (!currentUser) {
      const userFromLp = (launchParams.tgWebAppData as { user?: WebAppUser })?.user;
      if (!userFromLp) {
        console.error('Submit blocked: currentUser is still undefined.');
        setSubmitError('Ошибка: не удалось получить данные пользователя');
        return;
      }
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const authorInfo = currentUser || (launchParams.tgWebAppData as { user?: WebAppUser })?.user;
      if (!authorInfo) {
        throw new Error('Не удалось получить данные пользователя');
      }

      if (transactionToEdit) {
        await mockApi.updateTransaction(transactionToEdit.id, {
          type: data.type,
          amount: data.amount,
          categoryId: data.categoryId,
          name: data.name,
          comment: data.comment,
          createdAt: data.createdAt,
        });
      } else {
        await mockApi.addTransaction(
          budgetId,
          data.categoryId,
          data.type,
          data.amount,
          {
            id: authorInfo.id,
            first_name: authorInfo.first_name,
            last_name: authorInfo.last_name,
            username: authorInfo.username,
          },
          data.name,
          data.comment,
          data.createdAt
        );
      }

      onTransactionSaved();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save transaction:', error);
      setSubmitError('Ошибка при сохранении транзакции');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Форматирование даты для input type="datetime-local" ---
  const formatDateForInput = (date: Date | undefined): string => {
    if (!date) return ''; // Обработка случая, когда дата не определена
    try {
      // Корректируем часовой пояс перед форматированием
      const offset = date.getTimezoneOffset() * 60000;
      const localDate = new Date(date.getTime() - offset);
      // Проверяем, валидна ли дата после коррекции
      if (isNaN(localDate.getTime())) {
        console.error('Invalid date after timezone offset adjustment:', date);
        return ''; // Возвращаем пустую строку при невалидной дате
      }
      return localDate.toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm
    } catch (e) {
      console.error('Error formatting date for input:', date, e);
      return ''; // Возвращаем пустую строку в случае ошибки
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {transactionToEdit ? 'Редактировать транзакцию' : 'Добавить транзакцию'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            {/* --- Тип транзакции (с Controller) --- */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">
                Тип
              </Label>
              <Controller
                name="type"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <div className="col-span-3 flex w-full gap-2 justify-between">
                    <HapticButton
                      type="button"
                      variant={value === 'income' ? 'default' : 'outline'}
                      className="max-w-[107px] flex-1 flex items-center justify-center"
                      onClick={() => onChange('income')}
                      disabled={isSubmitting}
                    >
                      <Plus className={`h-4 w-4 ${value === 'income' ? 'text-white' : 'text-primary'}`} />
                    </HapticButton>
                    <HapticButton
                      type="button"
                      variant={value === 'expense' ? 'default' : 'outline'}
                      className="max-w-[107px] flex-1 flex items-center justify-center"
                      onClick={() => onChange('expense')}
                      disabled={isSubmitting}
                    >
                      <Minus className={`h-4 w-4 ${value === 'expense' ? 'text-white' : 'text-primary'}`} />
                    </HapticButton>
                  </div>
                )}
              />
            </div>

            {/* --- Категория (с Controller) --- */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="categoryId" className="text-right">
                Категория
              </Label>
              <div className="col-span-3">
                <Controller
                  control={control}
                  name="categoryId"
                  render={({ field }) => (
                    <Select
                      onValueChange={field.onChange}
                      value={field.value} // Используем field.value
                      disabled={isSubmitting || isLoadingCategories}
                    >
                      <SelectTrigger className={errors.categoryId ? 'border-destructive' : ''}>
                        <SelectValue
                          placeholder={
                            isLoadingCategories ? 'Загрузка...' : 'Выберите категорию...'
                          }
                        />
                      </SelectTrigger>
                      <SelectContent position="popper">
                        {isLoadingCategories && (
                          <SelectItem value="loading" disabled>
                            Загрузка...
                          </SelectItem>
                        )}
                        {!isLoadingCategories && categories.length === 0 && (
                          <SelectItem value="no-cats" disabled>
                            Нет категорий
                          </SelectItem>
                        )}
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.categoryId && (
                  <p className="text-destructive mt-1 text-xs">{errors.categoryId.message}</p>
                )}
              </div>
            </div>

            {/* --- Сумма --- */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right whitespace-nowrap">
                Сумма, ₽
              </Label>
              <div className="col-span-3">
                <Input
                  id="amount"
                  type="text"
                  inputMode="decimal"
                  placeholder="Например, 1 500.50"
                  value={formattedAmount}
                  onChange={handleAmountChange}
                  className={errors.amount ? 'border-destructive' : ''}
                  disabled={isSubmitting}
                />
                {errors.amount && (
                  <p className="text-destructive mt-1 text-xs">{errors.amount.message}</p>
                )}
              </div>
            </div>

            {/* --- Дата и время (с Controller) --- */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="createdAt" className="text-right">
                Дата
              </Label>
              <div className="col-span-3">
                <Controller
                  control={control}
                  name="createdAt"
                  render={({ field }) => (
                    <Input
                      id="createdAt"
                      type="datetime-local"
                      // Устанавливаем value напрямую из field.value, форматируя его
                      value={formatDateForInput(field.value)}
                      // При изменении парсим строку обратно в Date
                      onChange={(e) => {
                        try {
                          // Пытаемся создать дату, если значение пустое, передаем undefined/null
                          const dateValue = e.target.value ? new Date(e.target.value) : undefined;
                          // Проверяем валидность перед вызовом onChange
                          if (dateValue && !isNaN(dateValue.getTime())) {
                            field.onChange(dateValue);
                          } else if (!e.target.value) {
                            field.onChange(undefined); // Или null, если нужно
                          } else {
                            console.warn('Invalid date input detected:', e.target.value);
                          }
                        } catch (error) {
                          console.error('Error parsing date input:', e.target.value, error);
                        }
                      }}
                      onBlur={field.onBlur}
                      ref={field.ref}
                      className={`${errors.createdAt ? 'border-destructive' : ''} [&::-webkit-calendar-picker-indicator]:bg-[var(--primary)] [&::-webkit-calendar-picker-indicator]:p-1 [&::-webkit-calendar-picker-indicator]:rounded [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:hover:opacity-80 [&::-webkit-datetime-edit]:text-[var(--foreground)] [&::-webkit-datetime-edit-fields-wrapper]:text-[var(--foreground)] [&::-webkit-datetime-edit-text]:text-[var(--foreground)] [&::-webkit-datetime-edit-month-field]:text-[var(--foreground)] [&::-webkit-datetime-edit-day-field]:text-[var(--foreground)] [&::-webkit-datetime-edit-year-field]:text-[var(--foreground)] [&::-webkit-datetime-edit-hour-field]:text-[var(--foreground)] [&::-webkit-datetime-edit-minute-field]:text-[var(--foreground)] [&::-webkit-datetime-edit-ampm-field]:text-[var(--foreground)]`}
                      disabled={isSubmitting}
                    />
                  )}
                />
                {errors.createdAt && (
                  <p className="text-destructive mt-1 text-xs">{errors.createdAt.message}</p>
                )}
              </div>
            </div>

            {/* --- Название (опционально) --- */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right flex flex-col items-end">
                <span>Название</span>
                <span className="text-muted-foreground text-xs">(опц.)</span>
              </Label>
              <div className="col-span-3">
                <Input
                  id="name"
                  placeholder="Например, 'Обед в кафе'"
                  {...register('name')}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* --- Комментарий (опционально) --- */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="comment" className="text-right flex flex-col items-end">
                <span>Заметка</span>
                <span className="text-muted-foreground text-xs">(опц.)</span>
              </Label>
              <div className="col-span-3">
                <Textarea
                  id="comment"
                  placeholder="Дополнительная информация о транзакции..."
                  {...register('comment')}
                  disabled={isSubmitting}
                  rows={2}
                />
              </div>
            </div>

            {/* --- Ошибка отправки --- */}
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
            <HapticButton
              type="submit"
              // Блокируем кнопку, если нет пользователя ИЛИ форма не валидна/не изменена (опционально)
              disabled={isSubmitting || !currentUser || !isValid}
            >
              {isSubmitting ? 'Сохранение...' : 'Сохранить'}
            </HapticButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
