import React, { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { HapticButton } from '@/components/ui/haptic-button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Category } from '@/types';
import { useScrollToInput } from '@/hooks/useScrollToInput';
import { formatNumberWithSpaces, parseFormattedNumber } from '@/lib/utils';
import { FormField } from './FormField';
import { categorySchema, CategoryFormData } from '../utils/categorySchema';
import { useCategoriesRedux } from '@/hooks/useCategoriesRedux';

interface CategoryFormProps {
  budgetId: string;
  categoryToEdit?: Category | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCategorySaved: () => void;
}

export function CategoryForm({
  budgetId,
  categoryToEdit,
  open,
  onOpenChange,
  onCategorySaved,
}: CategoryFormProps) {
  useScrollToInput({ isOpen: open });
  const { addCategory, updateCategory } = useCategoriesRedux(budgetId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formattedLimit, setFormattedLimit] = useState<string>('');

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema) as any,
    defaultValues: {
      name: categoryToEdit?.name || '',
      limit: categoryToEdit?.limit || undefined,
    },
  });

  // Сбрасываем форму при изменении categoryToEdit или при закрытии/открытии
  useEffect(() => {
    if (open) {
      const initialLimit = categoryToEdit?.limit || undefined;
      setFormattedLimit(initialLimit ? formatNumberWithSpaces(initialLimit) : '');
      reset({
        name: categoryToEdit?.name || '',
        limit: initialLimit,
      });
      setSubmitError(null);
    }
  }, [categoryToEdit, open, reset]);

  const handleLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const formatted = formatNumberWithSpaces(value);
    setFormattedLimit(formatted);
    setValue('limit', parseFormattedNumber(value));
  };

  const onSubmit: SubmitHandler<CategoryFormData> = async (data) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      if (categoryToEdit) {
        await updateCategory(categoryToEdit.id, data.name, data.limit || 0);
      } else {
        await addCategory(data.name, data.limit || 0);
      }
      onCategorySaved();
      onOpenChange(false);
      reset();
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
        <form onSubmit={handleSubmit(onSubmit as any)}>
          <div className="grid gap-4 py-4">
            <FormField
              id="name"
              label="Название"
              error={errors.name?.message}
              disabled={isSubmitting}
              inputProps={register('name')}
            />
            
            <FormField
              id="limit"
              label="Лимит (₽)"
              type="text"
              inputMode="decimal"
              placeholder="Например, 5 000"
              value={formattedLimit}
              onChange={handleLimitChange}
              error={errors.limit?.message}
              disabled={isSubmitting}
            />
            
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