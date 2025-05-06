// src/components/features/budget/BudgetForm.tsx
import { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { useBudgets } from '@/contexts/BudgetContext'; // Импортируем контекст для вызова addBudget
import { popup } from '@telegram-apps/sdk-react'; // Для уведомлений об ошибках
import { Budget } from '@/types'; // Импорт типа
import * as mockApi from '@/lib/mockData'; // Импорт API
import { useScrollToInput } from '@/hooks/useScrollToInput'; // Импортируем хук

// Схема валидации Zod для бюджета
const budgetSchema = z.object({
  name: z
    .string()
    .min(1, { message: 'Название бюджета обязательно' })
    .max(50, { message: 'Название слишком длинное (макс. 50)' }),
  totalAmount: z.preprocess(
    (val) => (val === '' ? undefined : Number(val)),
    z
      .number({ invalid_type_error: 'Сумма должна быть числом' })
      .positive({ message: 'Сумма должна быть положительной' })
      .min(0.01, { message: 'Сумма должна быть больше 0' })
  ),
});

type BudgetFormData = z.infer<typeof budgetSchema>;

interface BudgetFormProps {
  budgetToEdit?: Budget | null; // Принимаем бюджет для редактирования
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBudgetSaved: () => void;
}

export function BudgetForm({
  budgetToEdit, // Используем пропс
  open,
  onOpenChange,
  onBudgetSaved,
}: BudgetFormProps) {
  useScrollToInput({ isOpen: open }); // Передаем состояние открытия
  const { addBudget: addBudgetFromContext, updateBudget: updateBudgetFromContext } = useBudgets();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BudgetFormData>({
    resolver: zodResolver(budgetSchema),
    // defaultValues теперь зависят от режима (редактирование или добавление)
    // Мы будем устанавливать их в useEffect ниже
  });

  // Сброс и установка значений при открытии/смене режима
  useEffect(() => {
    if (open) {
      reset({
        // Устанавливаем значения в зависимости от budgetToEdit
        name: budgetToEdit?.name || '',
        totalAmount: budgetToEdit?.totalAmount || undefined,
      });
      setSubmitError(null);
    } else {
      reset(); // Сбрасываем при закрытии
    }
  }, [open, budgetToEdit, reset]);

  const onSubmit: SubmitHandler<BudgetFormData> = async (data) => {
    setIsSubmitting(true);
    setSubmitError(null);
    console.log('Submitting budget form:', data);

    try {
      if (budgetToEdit) {
        // Вызываем update из контекста
        const updated = await updateBudgetFromContext(budgetToEdit.id, data.name, data.totalAmount);
        if (!updated) {
          throw new Error('Не удалось обновить бюджет через контекст.');
        }
      } else {
        // Вызываем функцию добавления из контекста
        const newBudget = await addBudgetFromContext(data.name, data.totalAmount);
        if (newBudget) {
          onBudgetSaved(); // Вызываем колбэк (хотя контекст сам обновит список)
          onOpenChange(false); // Закрываем диалог
        } else {
          // Если addBudgetFromContext вернул null (обработал ошибку внутри)
          setSubmitError('Не удалось добавить бюджет. Попробуйте снова.');
          popup.open.ifAvailable({ title: 'Ошибка', message: 'Не удалось добавить бюджет.' });
        }
      }
      onBudgetSaved();
      onOpenChange(false);
    } catch (error) {
      // На случай если addBudgetFromContext пробросит ошибку
      console.error('Failed to save budget:', error);
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      setSubmitError(errorMessage);
      popup.open.ifAvailable({ title: 'Ошибка', message: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {budgetToEdit ? 'Редактировать бюджет' : 'Новый бюджет'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            {/* Название */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="budgetName" className="text-right">
                Название
              </Label>
              <div className="col-span-3">
                <Input
                  id="budgetName"
                  placeholder="Например, Февраль 2024"
                  {...register('name')}
                  className={errors.name ? 'border-destructive' : ''}
                  disabled={isSubmitting}
                />
                {errors.name && (
                  <p className="text-destructive mt-1 text-xs">{errors.name.message}</p>
                )}
              </div>
            </div>
            {/* Сумма */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="totalAmount" className="text-right">
                Общая сумма (₽)
              </Label>
              <div className="col-span-3">
                <Input
                  id="totalAmount"
                  type="number"
                  step="0.01"
                  inputMode="decimal"
                  placeholder="Например, 100000"
                  {...register('totalAmount')}
                  className={errors.totalAmount ? 'border-destructive' : ''}
                  disabled={isSubmitting}
                />
                {errors.totalAmount && (
                  <p className="text-destructive mt-1 text-xs">{errors.totalAmount.message}</p>
                )}
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
              {isSubmitting
                ? budgetToEdit
                  ? 'Сохранение...'
                  : 'Создание...'
                : budgetToEdit
                  ? 'Сохранить изменения'
                  : 'Создать бюджет'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
