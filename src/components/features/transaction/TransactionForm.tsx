// src/components/features/transaction/TransactionForm.tsx
import { useState, useEffect, useCallback } from 'react';
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
  // Дата и время теперь обязательны по схеме
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
  console.log('TransactionForm rendered with props:', { budgetId, open, transactionToEdit });
  
  const launchParams = useLaunchParams();
  // Пытаемся получить пользователя, но проверяем на undefined
  const currentUser =
    launchParams.tgWebAppData &&
    typeof launchParams.tgWebAppData === 'object' &&
    'user' in launchParams.tgWebAppData
      ? (launchParams.tgWebAppData.user as WebAppUser | undefined)
      : undefined;

  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    control, // Используем control для Controller
    formState: { errors, isDirty, isValid },
    // watch   // watch больше не нужен напрямую для datetime-local с Controller
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    // defaultValues остаются здесь, Controller их подхватит
    defaultValues: {
      type: transactionToEdit?.type || 'expense',
      amount: transactionToEdit?.amount || undefined,
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
      setSubmitError('Ошибка загрузки категорий'); // Уведомляем пользователя
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
        // Используем reset для установки всех значений
        type: transactionToEdit?.type || 'expense',
        amount: transactionToEdit?.amount || undefined,
        categoryId: transactionToEdit?.categoryId || '',
        name: transactionToEdit?.name || '',
        comment: transactionToEdit?.comment || '',
        createdAt: transactionToEdit?.createdAt || new Date(),
      });
      setSubmitError(null); // Сброс ошибки
      loadCategories();
    } else {
      // reset(); // Сбрасываем при закрытии - МОЖЕТ БЫТЬ ЛИШНИМ, если open меняется только на false при успешном сабмите/отмене
    }
  }, [transactionToEdit, open, reset, loadCategories]);

  // --- Обработчик отправки формы ---
  const onSubmit: SubmitHandler<TransactionFormData> = async (data) => {
    // Проверяем пользователя еще раз НА МОМЕНТ ОТПРАВКИ
    if (!currentUser) {
      const currentLp = launchParams; // Получаем актуальные параметры на момент клика
      const userFromLp = currentLp.initData?.user as WebAppUser | undefined;

      if (!userFromLp) {
        console.error('Submit blocked: currentUser is still undefined.', currentLp);
        setSubmitError(
          'Не удалось определить пользователя Telegram. Попробуйте перезапустить приложение.'
        );
        // Используем popup, если доступен
        popup.open.ifAvailable({
          title: 'Ошибка',
          message:
            'Не удалось получить данные пользователя Telegram. Попробуйте перезапустить приложение.',
        });
        return; // Прерываем отправку
      }
      // Если пользователь появился, используем его
      console.warn('currentUser was initially undefined, but found in launchParams on submit.');
      // authorInfo будет создан ниже с userFromLp
    }

    setIsSubmitting(true);
    setSubmitError(null);
    console.log(
      'Submitting transaction form with user:',
      currentUser || launchParams.initData?.user
    ); // Логируем пользователя

    // Готовим данные автора, используя актуальные данные на момент сабмита
    const authorInfo: Pick<WebAppUser, 'id' | 'first_name' | 'last_name' | 'username'> | null =
      currentUser || launchParams.initData?.user
        ? {
            id: (currentUser || launchParams.initData!.user!).id,
            first_name: (currentUser || launchParams.initData!.user!).first_name,
            last_name: (currentUser || launchParams.initData!.user!).last_name,
            username: (currentUser || launchParams.initData!.user!).username,
          }
        : null;

    if (!authorInfo) {
      // Эта проверка дублирует первую, но на всякий случай
      setSubmitError('Ошибка получения данных автора.');
      setIsSubmitting(false);
      return;
    }

    try {
      if (transactionToEdit) {
        // Обновление существующей
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
          authorInfo, // Передаем полученные данные автора
          data.name,
          data.comment,
          data.createdAt
        );
      }
      onTransactionSaved(); // Вызываем колбэк для обновления списков
      onOpenChange(false); // Закрываем диалог
      // reset(); // reset теперь в useEffect при открытии/смене данных
    } catch (error) {
      console.error('Failed to save transaction:', error);
      setSubmitError(error instanceof Error ? error.message : 'Не удалось сохранить транзакцию');
      // Используем popup для ошибки сохранения
      popup.open.ifAvailable({
        title: 'Ошибка сохранения',
        message: error instanceof Error ? error.message : 'Не удалось сохранить транзакцию',
      });
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
              <Label className="text-right">Тип</Label>
              <div className="col-span-3 flex w-full gap-2 justify-between">
                <Controller
                  control={control}
                  name="type"
                  render={({ field }) => (
                    <>
                      <HapticButton
                        type="button"
                        variant={field.value === 'income' ? 'default' : 'outline'}
                        className="max-w-[107px] flex-1 flex items-center justify-center"
                        onClick={() => field.onChange('income')}
                        disabled={isSubmitting}
                      >
                        <Plus className="h-4 w-4 text-green-500" />
                      </HapticButton>
                      <HapticButton
                        type="button"
                        variant={field.value === 'expense' ? 'default' : 'outline'}
                        className="max-w-[107px] flex-1 flex items-center justify-center"
                        onClick={() => field.onChange('expense')}
                        disabled={isSubmitting}
                      >
                        <Minus className="h-4 w-4 text-red-500" />
                      </HapticButton>
                    </>
                  )}
                />
                {errors.type && (
                  <p className="text-destructive mt-1 text-xs">{errors.type.message}</p>
                )}
              </div>
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
                  type="number"
                  step="0.01"
                  placeholder="Например, 1500.50"
                  {...register('amount')} // Оставляем register для простых инпутов
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
