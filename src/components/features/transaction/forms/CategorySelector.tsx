import { Control, Controller, FieldErrors } from 'react-hook-form';
import { Category } from '@/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CategorySelectorProps {
  control: Control<any>;
  categories: Category[];
  isLoading: boolean;
  disabled?: boolean;
  errors?: FieldErrors<any>;
}

export function CategorySelector({
  control,
  categories,
  isLoading,
  disabled = false,
  errors,
}: CategorySelectorProps) {
  return (
    <Controller
      control={control}
      name="categoryId"
      render={({ field }) => (
        <>
          <Select
            onValueChange={field.onChange}
            value={field.value}
            disabled={disabled || isLoading}
          >
            <SelectTrigger className={errors?.categoryId ? 'border-destructive' : ''}>
              <SelectValue
                placeholder={
                  isLoading ? 'Загрузка...' : 'Выберите категорию...'
                }
              />
            </SelectTrigger>
            <SelectContent position="popper">
              {isLoading && (
                <SelectItem value="loading" disabled>
                  Загрузка...
                </SelectItem>
              )}
              {!isLoading && categories.length === 0 && (
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
          {errors?.categoryId && (
            <p className="text-destructive mt-1 text-xs">{errors.categoryId.message as string}</p>
          )}
        </>
      )}
    />
  );
} 