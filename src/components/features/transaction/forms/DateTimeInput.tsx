import { Control, Controller, FieldErrors } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { formatDateForInput } from '../utils/formHelpers';

interface DateTimeInputProps {
  control: Control<any>;
  disabled?: boolean;
  errors?: FieldErrors<any>;
}

export function DateTimeInput({
  control,
  disabled = false,
  errors,
}: DateTimeInputProps) {
  return (
    <Controller
      control={control}
      name="createdAt"
      render={({ field }) => (
        <div>
          <Input
            id="createdAt"
            type="datetime-local"
            value={formatDateForInput(field.value)}
            onChange={(e) => {
              try {
                const dateValue = e.target.value ? new Date(e.target.value) : undefined;
                if (dateValue && !isNaN(dateValue.getTime())) {
                  field.onChange(dateValue);
                } else if (!e.target.value) {
                  field.onChange(undefined);
                } else {
                  console.warn('Invalid date input detected:', e.target.value);
                }
              } catch (error) {
                console.error('Error parsing date input:', e.target.value, error);
              }
            }}
            onBlur={field.onBlur}
            ref={field.ref}
            className={`${errors?.createdAt ? 'border-destructive' : ''} [&::-webkit-calendar-picker-indicator]:bg-[var(--primary)] [&::-webkit-calendar-picker-indicator]:p-1 [&::-webkit-calendar-picker-indicator]:rounded [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:hover:opacity-80 [&::-webkit-datetime-edit]:text-[var(--foreground)] [&::-webkit-datetime-edit-fields-wrapper]:text-[var(--foreground)] [&::-webkit-datetime-edit-text]:text-[var(--foreground)] [&::-webkit-datetime-edit-month-field]:text-[var(--foreground)] [&::-webkit-datetime-edit-day-field]:text-[var(--foreground)] [&::-webkit-datetime-edit-year-field]:text-[var(--foreground)] [&::-webkit-datetime-edit-hour-field]:text-[var(--foreground)] [&::-webkit-datetime-edit-minute-field]:text-[var(--foreground)] [&::-webkit-datetime-edit-ampm-field]:text-[var(--foreground)]`}
            disabled={disabled}
          />
          {errors?.createdAt && (
            <p className="text-destructive mt-1 text-xs">{errors.createdAt.message as string}</p>
          )}
        </div>
      )}
    />
  );
} 