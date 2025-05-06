import { Input } from '@/components/ui/input';
import { FieldErrors } from 'react-hook-form';

interface AmountInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  errors?: FieldErrors<any>;
}

export function AmountInput({
  value,
  onChange,
  disabled = false,
  errors,
}: AmountInputProps) {
  return (
    <div>
      <Input
        id="amount"
        type="text"
        inputMode="decimal"
        placeholder="Например, 1 500.50"
        value={value}
        onChange={onChange}
        className={errors?.amount ? 'border-destructive' : ''}
        disabled={disabled}
      />
      {errors?.amount && (
        <p className="text-destructive mt-1 text-xs">{errors.amount.message as string}</p>
      )}
    </div>
  );
} 