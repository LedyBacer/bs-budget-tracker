import { Plus, Minus } from 'lucide-react';
import { HapticButton } from '@/components/ui/haptic-button';
import { TransactionType } from '@/types';
import { Control, Controller } from 'react-hook-form';

interface TypeSelectorProps {
  control: Control<any>;
  disabled?: boolean;
}

export function TypeSelector({ control, disabled = false }: TypeSelectorProps) {
  return (
    <Controller
      control={control}
      name="type"
      render={({ field }) => (
        <div className="flex w-full gap-2 justify-between">
          <HapticButton
            type="button"
            variant={field.value === 'income' ? 'default' : 'outline'}
            className="max-w-[107px] flex-1 flex items-center justify-center"
            onClick={() => field.onChange('income')}
            disabled={disabled}
          >
            <Plus className={`h-4 w-4 ${field.value === 'income' ? 'text-white' : 'text-primary'}`} />
          </HapticButton>
          <HapticButton
            type="button"
            variant={field.value === 'expense' ? 'default' : 'outline'}
            className="max-w-[107px] flex-1 flex items-center justify-center"
            onClick={() => field.onChange('expense')}
            disabled={disabled}
          >
            <Minus className={`h-4 w-4 ${field.value === 'expense' ? 'text-white' : 'text-primary'}`} />
          </HapticButton>
        </div>
      )}
    />
  );
} 