// src/components/features/transaction/TransactionForm.tsx
import { useState, useEffect, useCallback } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
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
import { useLaunchParams } from '@telegram-apps/sdk-react'; // Для получения данных пользователя

// --- Схема валидации Zod для транзакции ---
const transactionSchema = z.object({
  type: z.enum(['expense', 'income'], { required_error: 'Выберите тип транзакции' }),
  amount: z.preprocess(
    (val) => (val === '' ? undefined : Number(val)),
    z
      .number({ invalid_type_error: 'Сумма должна быть числом' })
      .positive({ message: 'Сумма должна быть положительной' })
      .min(0.01, { message: 'Сумма должна быть больше 0' })
  ),
  categoryId: z.string().min(1, { message: 'Выберите категорию' }),
  name: z.string().optional(),
  comment: z.string().optional(),
  createdAt: z.date({ required_error: 'Выберите дату' }), // Используем нативный тип Date
});

export type TransactionFormData = z.infer<typeof transactionSchema>;

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
  const launchParams = useLaunchParams();
  const currentUser = launchParams.initData?.user as WebAppUser | undefined; // Текущий пользователь из SDK

  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    control, // Нужен для Select
    formState: { errors },
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      // Значения по умолчанию
      type: transactionToEdit?.type || 'expense',
      amount: transactionToEdit?.amount || undefined,
      categoryId: transactionToEdit?.categoryId || '',
      name: transactionToEdit?.name || '',
      comment: transactionToEdit?.comment || '',
      createdAt: transactionToEdit?.createdAt || new Date(), // Текущая дата по умолчанию
    },
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
      // TODO: Показать ошибку
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
      reset({
        type: transactionToEdit?.type || 'expense',
        amount: transactionToEdit?.amount || undefined,
        categoryId: transactionToEdit?.categoryId || '',
        name: transactionToEdit?.name || '',
        comment: transactionToEdit?.comment || '',
        // Форматируем дату для input[type=datetime-local]
        createdAt: transactionToEdit?.createdAt || new Date(),
      });
      setSubmitError(null); // Сброс ошибки
    }
  }, [transactionToEdit, open, reset]);

  // --- Обработчик отправки формы ---
  const onSubmit: SubmitHandler<TransactionFormData> = async (data) => {
    if (!currentUser) {
      setSubmitError('Не удалось определить пользователя Telegram.');
      return;
    }
    setIsSubmitting(true);
    setSubmitError(null);
    console.log('Submitting transaction form:', data);

    // Готовим данные автора
    const authorInfo: Pick<WebAppUser, 'id' | 'first_name' | 'last_name' | 'username'> = {
      id: currentUser.id,
      first_name: currentUser.first_name,
      last_name: currentUser.last_name,
      username: currentUser.username,
    };

    try {
      if (transactionToEdit) {
        // Обновление существующей (передаем только измененные данные)
        // В mockApi это пока не очень хорошо обрабатывается, но делаем вызов
        const updateData: Partial<TransactionFormData> = {
          type: data.type,
          amount: data.amount,
          categoryId: data.categoryId,
          name: data.name,
          comment: data.comment,
          createdAt: data.createdAt,
        };
        await mockApi.updateTransaction(transactionToEdit.id, updateData);
      } else {
        // Добавление новой транзакции
        await mockApi.addTransaction(
          budgetId,
          data.categoryId,
          data.type,
          data.amount,
          authorInfo,
          data.name,
          data.comment,
          data.createdAt // Передаем дату
        );
      }
      onTransactionSaved(); // Вызываем колбэк для обновления списков
      onOpenChange(false); // Закрываем диалог
      reset(); // Очищаем форму
    } catch (error) {
      console.error('Failed to save transaction:', error);
      setSubmitError(error instanceof Error ? error.message : 'Не удалось сохранить транзакцию');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Форматирование даты для input type="datetime-local"
  const formatDateForInput = (date: Date): string => {
    // Корректируем часовой пояс перед форматированием
    const offset = date.getTimezoneOffset() * 60000;
    const localDate = new Date(date.getTime() - offset);
    return localDate.toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm
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
            {/* Тип транзакции */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Тип</Label>
              <div className="col-span-3">
                {/* Используем Controller для Select от shadcn/ui */}
                <Select
                  value={control._getWatch('type')} // Получаем текущее значение
                  onValueChange={(value) => control._setValue('type', value as TransactionType)} // Обновляем значение
                  disabled={isSubmitting}
                >
                  <SelectTrigger className={errors.type ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Выберите тип..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expense">Списание (Расход)</SelectItem>
                    <SelectItem value="income">Пополнение (Доход)</SelectItem>
                  </SelectContent>
                </Select>
                {errors.type && (
                  <p className="text-destructive mt-1 text-xs">{errors.type.message}</p>
                )}
              </div>
            </div>

            {/* Сумма */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                Сумма (₽)
              </Label>
              <div className="col-span-3">
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="Например, 1500.50"
                  {...register('amount')}
                  className={errors.amount ? 'border-destructive' : ''}
                  disabled={isSubmitting}
                />
                {errors.amount && (
                  <p className="text-destructive mt-1 text-xs">{errors.amount.message}</p>
                )}
              </div>
            </div>

            {/* Категория */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="categoryId" className="text-right">
                Категория
              </Label>
              <div className="col-span-3">
                <Select
                  value={control._getWatch('categoryId')}
                  onValueChange={(value) => control._setValue('categoryId', value)}
                  disabled={isSubmitting || isLoadingCategories}
                >
                  <SelectTrigger className={errors.categoryId ? 'border-destructive' : ''}>
                    <SelectValue
                      placeholder={isLoadingCategories ? 'Загрузка...' : 'Выберите категорию...'}
                    />
                  </SelectTrigger>
                  <SelectContent>
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
                {errors.categoryId && (
                  <p className="text-destructive mt-1 text-xs">{errors.categoryId.message}</p>
                )}
              </div>
            </div>

            {/* Дата и время */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="createdAt" className="text-right">
                Дата
              </Label>
              <div className="col-span-3">
                <Input
                  id="createdAt"
                  type="datetime-local" // Используем нативный input
                  defaultValue={formatDateForInput(control._getWatch('createdAt') || new Date())} // Форматируем для input
                  onChange={(e) => control._setValue('createdAt', new Date(e.target.value))} // Преобразуем обратно в Date
                  className={errors.createdAt ? 'border-destructive' : ''}
                  disabled={isSubmitting}
                />
                {errors.createdAt && (
                  <p className="text-destructive mt-1 text-xs">{errors.createdAt.message}</p>
                )}
              </div>
            </div>

            {/* Название (опционально) */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Название <span className="text-muted-foreground text-xs">(опц.)</span>
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

            {/* Комментарий (опционально) */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="comment" className="text-right">
                Комментарий <span className="text-muted-foreground text-xs">(опц.)</span>
              </Label>
              <div className="col-span-3">
                <Textarea
                  id="comment"
                  placeholder="Дополнительная информация..."
                  {...register('comment')}
                  disabled={isSubmitting}
                  rows={2}
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
              <Button type="button" variant="outline" disabled={isSubmitting}>
                Отмена
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
