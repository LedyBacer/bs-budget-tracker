import React from 'react';
import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BudgetFormData } from './BudgetFormValidation';

interface BudgetFormFieldsProps {
  register: UseFormRegister<BudgetFormData>;
  errors: FieldErrors<BudgetFormData>;
  formattedAmount: string;
  handleAmountChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isSubmitting: boolean;
}

export function BudgetFormFields({
  register,
  errors,
  formattedAmount,
  handleAmountChange,
  isSubmitting,
}: BudgetFormFieldsProps) {
  return (
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
            type="text"
            inputMode="decimal"
            placeholder="Например, 100 000"
            value={formattedAmount}
            onChange={handleAmountChange}
            className={errors.totalAmount ? 'border-destructive' : ''}
            disabled={isSubmitting}
          />
          {errors.totalAmount && (
            <p className="text-destructive mt-1 text-xs">{errors.totalAmount.message}</p>
          )}
        </div>
      </div>
    </div>
  );
} 