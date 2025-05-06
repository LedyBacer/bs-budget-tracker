import { ExpandableItem } from '@/components/ui/expandable-item';
import { mediumHaptic } from '@/lib/utils';
import { CategoryCard } from './CategoryCard';
import { CategoryActions } from './CategoryActions';
import { CategoryWithBalance } from '../utils/categoryUtils';
import { Category } from '@/types';

interface ExpandableCategoryItemProps {
  category: CategoryWithBalance;
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: (category: Category) => void;
  onDelete: () => void;
}

export function ExpandableCategoryItem({
  category,
  isExpanded,
  onToggle,
  onEdit,
  onDelete,
}: ExpandableCategoryItemProps) {
  const handleToggle = () => {
    mediumHaptic();
    onToggle();
  };

  return (
    <ExpandableItem
      isExpanded={isExpanded}
      onToggle={handleToggle}
      actions={<CategoryActions
        category={category}
        onEdit={onEdit}
        onDelete={onDelete}
      />}
    >
      <CategoryCard 
        category={category}
        isExpanded={isExpanded}
      />
    </ExpandableItem>
  );
} 