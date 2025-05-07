import { useState } from 'react';
import { Trash2, Pencil } from 'lucide-react';
import { HapticButton } from '@/components/ui/haptic-button';
import { Category } from '@/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useCategoriesRedux } from '@/hooks/useCategoriesRedux';

interface CategoryActionsProps {
  category: Category;
  onEdit: (category: Category) => void;
  onDelete: () => void;
}

export function CategoryActions({ category, onEdit, onDelete }: CategoryActionsProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { deleteCategory } = useCategoriesRedux(category.budgetId);
  
  const handleDelete = async () => {
    try {
      await deleteCategory(category.id);
      onDelete();
    } catch (error: any) {
      console.error('Failed to delete category:', error);
      // Показываем ошибку пользователю через popup
      alert(`Ошибка удаления: ${error.message || 'Неизвестная ошибка'}`);
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  return (
    <div className="flex w-full items-stretch gap-1">
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogTrigger asChild>
          <HapticButton
            variant="ghost"
            size="sm"
            className="flex-1 rounded-md border border-border text-destructive hover:text-destructive py-4.5"
            onClick={(e) => {
              e.stopPropagation();
              setIsDeleteDialogOpen(true);
            }}
          >
            <Trash2 className="mr-1 h-4 w-4" />
            Удалить
          </HapticButton>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить категорию?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Все транзакции в этой категории будут удалены.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Удалить</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <HapticButton
        variant="ghost"
        size="sm"
        className="flex-1 rounded-md border border-border py-4.5"
        onClick={(e) => {
          e.stopPropagation();
          onEdit(category);
        }}
      >
        <Pencil className="mr-1 h-4 w-4" />
        Изменить
      </HapticButton>
    </div>
  );
} 