import { useState, useEffect } from 'react';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { HapticButton } from '@/components/ui/haptic-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Minus } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Category, TransactionType, WebAppUser } from '@/types';
import * as mockApi from '@/lib/mockData';
import { useLaunchParams } from '@telegram-apps/sdk-react';
import { useScrollToInput } from '@/hooks/useScrollToInput';

// Упрощённая схема валидации
const simpleTransactionSchema = z.object({
  type: z.enum(['expense', 'income'], { required_error: 'Выберите тип транзакции' }),
  amount: z.preprocess(
    (val) => (val === '' ? undefined : Number(val)),
    z
      .number({ invalid_type_error: 'Сумма должна быть числом' })
      .positive({ message: 'Сумма должна быть положительной' })
      .min(0.01, { message: 'Сумма должна быть больше 0' })
  ),
  categoryId: z.string().min(1, { message: 'Выберите категорию' }),
});

type SimpleTransactionFormData = z.infer<typeof simpleTransactionSchema>;

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
  useScrollToInput({ isOpen: open });
  const launchParams = useLaunchParams();
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
    control,
    formState: { errors },
  } = useForm<SimpleTransactionFormData>({
    resolver: zodResolver(simpleTransactionSchema),
    defaultValues: {
      type: 'expense' as const,
      amount: undefined,
      categoryId: '',
    },
  });

  // Загрузка категорий
  useEffect(() => {
    if (open) {
      setIsLoadingCategories(true);
      mockApi
        .getCategoriesByBudgetId(budgetId)
        .then((cats) => {
          setCategories(cats);
        })
        .catch((error) => {
          console.error('Failed to load categories:', error);
          setSubmitError('Ошибка загрузки категорий');
        })
        .finally(() => {
          setIsLoadingCategories(false);
        });
    }
  }, [open, budgetId]);

  // Сброс формы при открытии
  useEffect(() => {
    if (open) {
      reset({
        type: 'expense' as const,
        amount: undefined,
        categoryId: '',
      });
      setSubmitError(null);
    }
  }, [open, reset]);

  const onSubmit: SubmitHandler<SimpleTransactionFormData> = async (data) => {
    if (!currentUser) {
      setSubmitError('Не удалось определить пользователя Telegram');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await mockApi.addTransaction(
        budgetId,
        data.categoryId,
        data.type,
        data.amount,
        {
          id: currentUser.id,
          first_name: currentUser.first_name,
          last_name: currentUser.last_name,
          username: currentUser.username,
        },
        '', // Пустое название
        '', // Пустой комментарий
        new Date() // Текущая дата и время
      );
      onTransactionSaved();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save transaction:', error);
      setSubmitError(error instanceof Error ? error.message : 'Не удалось сохранить транзакцию');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Добавить транзакцию</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            {/* Тип транзакции */}
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
                        <Plus className={`h-4 w-4 ${field.value === 'income' ? 'text-white' : 'text-primary'}`} />
                      </HapticButton>
                      <HapticButton
                        type="button"
                        variant={field.value === 'expense' ? 'default' : 'outline'}
                        className="max-w-[107px] flex-1 flex items-center justify-center"
                        onClick={() => field.onChange('expense')}
                        disabled={isSubmitting}
                      >
                        <Minus className={`h-4 w-4 ${field.value === 'expense' ? 'text-white' : 'text-primary'}`} />
                      </HapticButton>
                    </>
                  )}
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
                <Controller
                  control={control}
                  name="categoryId"
                  render={({ field }) => (
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
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

            {/* Сумма */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right whitespace-nowrap">
                Сумма, ₽
              </Label>
              <div className="col-span-3">
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  inputMode="decimal"
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