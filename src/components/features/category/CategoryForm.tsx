// src/components/features/category/CategoryForm.tsx
import { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { HapticButton } from '@/components/ui/haptic-button';
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
import { Category } from '@/types';
import * as mockApi from '@/lib/mockData';
import { useBudgets } from '@/contexts/BudgetContext'; // Нам нужен текущий бюджет для валидации

// Схема валидации Zod
const categorySchema = z.object({
  name: z.string().min(1, { message: 'Название категории обязательно' }),
  limit: z.preprocess(
    (val) => (val === '' ? undefined : Number(val)), // Преобразуем пустую строку в undefined, затем в число
    z
      .number({ invalid_type_error: 'Лимит должен быть числом' })
      .positive({ message: 'Лимит должен быть положительным числом' })
      .min(0.01, { message: 'Лимит должен быть больше 0' })
  ),
});

type CategoryFormData = z.infer<typeof categorySchema>;

interface CategoryFormProps {
  budgetId: string;
  categoryToEdit?: Category | null; // Категория для редактирования
  open: boolean;
  onOpenChange: (open: boolean) => void; // Для управления состоянием диалога
  onCategorySaved: () => void; // Колбэк после успешного сохранения
}

export function CategoryForm({
  budgetId,
  categoryToEdit,
  open,
  onOpenChange,
  onCategorySaved,
}: CategoryFormProps) {
  const { currentBudget } = useBudgets(); // Получаем текущий бюджет для проверки лимитов
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      // Устанавливаем значения по умолчанию (для редактирования)
      name: categoryToEdit?.name || '',
      limit: categoryToEdit?.limit || undefined,
    },
  });

  // Сбрасываем форму при изменении categoryToEdit или при закрытии/открытии
  useEffect(() => {
    if (open) {
      reset({
        name: categoryToEdit?.name || '',
        limit: categoryToEdit?.limit || undefined,
      });
      setSubmitError(null); // Сбрасываем ошибку при открытии
    }
  }, [categoryToEdit, open, reset]);

  const onSubmit: SubmitHandler<CategoryFormData> = async (data) => {
    setIsSubmitting(true);
    setSubmitError(null);
    console.log('Submitting category form:', data);

    // --- Валидация суммы лимитов (примерная) ---
    // Это упрощенная проверка, т.к. мы не загружаем все категории сюда
    // В реальном приложении лучше делать на бэкенде или загружать все категории в контекст
    // if (currentBudget) {
    //     const currentCategories = await mockApi.getCategoriesByBudgetId(budgetId);
    //     const otherLimits = currentCategories
    //         .filter(c => c.id !== categoryToEdit?.id) // Исключаем текущую редактируемую
    //         .reduce((sum, c) => sum + c.limit, 0);
    //     if (otherLimits + data.limit > currentBudget.totalAmount) {
    //         setSubmitError(`Сумма лимитов (${formatCurrency(otherLimits + data.limit)}) превысит бюджет (${formatCurrency(currentBudget.totalAmount)})!`);
    //         setIsSubmitting(false);
    //         return;
    //     }
    // }
    // --- Конец валидации ---

    try {
      if (categoryToEdit) {
        // Обновляем категорию
        await mockApi.updateCategory(categoryToEdit.id, data.name, data.limit);
      } else {
        // Добавляем новую
        await mockApi.addCategory(budgetId, data.name, data.limit);
      }
      onCategorySaved(); // Вызываем колбэк для обновления списка
      onOpenChange(false); // Закрываем диалог
      reset(); // Очищаем форму
    } catch (error) {
      console.error('Failed to save category:', error);
      setSubmitError(error instanceof Error ? error.message : 'Не удалось сохранить категорию');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {categoryToEdit ? 'Редактировать категорию' : 'Добавить категорию'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Название
              </Label>
              <div className="col-span-3">
                <Input
                  id="name"
                  {...register('name')}
                  className={errors.name ? 'border-destructive' : ''}
                  disabled={isSubmitting}
                />
                {errors.name && (
                  <p className="text-destructive mt-1 text-xs">{errors.name.message}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="limit" className="text-right">
                Лимит (₽)
              </Label>
              <div className="col-span-3">
                <Input
                  id="limit"
                  type="number"
                  step="0.01"
                  inputMode="decimal"
                  {...register('limit')}
                  className={errors.limit ? 'border-destructive' : ''}
                  disabled={isSubmitting}
                  placeholder="Например, 5000"
                />
                {errors.limit && (
                  <p className="text-destructive mt-1 text-xs">{errors.limit.message}</p>
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
            <HapticButton type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Сохранение...' : 'Сохранить'}
            </HapticButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
