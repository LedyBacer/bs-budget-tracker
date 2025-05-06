import { useState, useRef } from 'react';
import { useBudgets } from '@/contexts/BudgetContext';
import { Category } from '@/types';
import { PlusCircle } from 'lucide-react';
import { CategoryForm } from './CategoryForm';
import { CategoryListSkeleton } from '@/components/ui/skeletons';
import { useCategoryData } from '../hooks/useCategoryData';
import { usePagination, VISIBLE_CARDS_COUNT } from '../hooks/useVisibleCards';
import { ExpandableCategoryItem } from './ExpandableCategoryItem';
import { BudgetLimitsWarning } from './BudgetLimitsWarning';
import { calculateTotalLimits, chunkArray } from '../utils/categoryUtils';
import { ActionButton } from '@/components/ui/action-button';

export function CategoryList() {
  const { currentBudget } = useBudgets();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Получаем данные категорий
  const { 
    categoriesWithBalance, 
    isLoading, 
    refetch 
  } = useCategoryData(currentBudget?.id);
  
  // Рассчитываем общую сумму лимитов
  const totalLimits = calculateTotalLimits(categoriesWithBalance);
  
  // Делим категории на чанки для отображения
  const categoryChunks = chunkArray(categoriesWithBalance, VISIBLE_CARDS_COUNT);
  
  // Инициализируем пагинацию
  const { currentPage, goToPage } = usePagination(
    scrollContainerRef, 
    categoryChunks.length
  );

  // Функция для переключения раскрытого элемента
  const handleToggleExpand = (categoryId: string) => {
    setExpandedCategoryId((prevId) => (prevId === categoryId ? null : categoryId));
  };

  // Функция для открытия формы добавления
  const handleAddCategoryClick = () => {
    setCategoryToEdit(null);
    setIsFormOpen(true);
  };

  // Функция для открытия формы редактирования
  const handleEditCategoryClick = (category: Category) => {
    setCategoryToEdit(category);
    setIsFormOpen(true);
  };

  // Колбэк после сохранения категории
  const handleCategorySaved = () => {
    refetch();
  };

  if (!currentBudget) return null;

  if (isLoading && categoriesWithBalance.length === 0) {
    return <CategoryListSkeleton />;
  }

  return (
    <div className="mb-6">
      <div className="mb-3 flex items-center justify-between px-1">
        <h3 className="text-md font-semibold">Категории бюджета:</h3>
        <ActionButton onClick={handleAddCategoryClick} />
      </div>

      {/* Предупреждения о лимитах бюджета */}
      <BudgetLimitsWarning 
        totalLimits={totalLimits}
        budgetTotal={currentBudget.totalAmount}
        hasCategories={categoriesWithBalance.length > 0}
      />

      {categoriesWithBalance.length === 0 && !isLoading ? (
        <div className="text-muted-foreground bg-card rounded-lg border p-4 text-center">
          В этом бюджете еще нет категорий. Нажмите "Добавить".
        </div>
      ) : isLoading && categoriesWithBalance.length === 0 ? (
        <div className="text-muted-foreground p-4 text-center">Загрузка...</div>
      ) : (
        <div className="relative">
          {categoriesWithBalance.length <= 3 ? (
            <div className="flex flex-col gap-2 w-full">
              {categoriesWithBalance.map((category) => (
                <ExpandableCategoryItem
                  key={category.id}
                  category={category}
                  isExpanded={expandedCategoryId === category.id}
                  onToggle={() => handleToggleExpand(category.id)}
                  onEdit={handleEditCategoryClick}
                  onDelete={handleCategorySaved}
                />
              ))}
            </div>
          ) : (
            <>
              <div
                ref={scrollContainerRef}
                className="flex flex-nowrap space-x-4 overflow-x-auto pb-4 w-full snap-x snap-mandatory"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {categoryChunks.map((chunk, chunkIdx) => (
                  <div
                    key={chunkIdx}
                    className="min-w-[320px] max-w-[340px] flex-shrink-0 snap-start flex flex-col gap-2"
                  >
                    {chunk.map((category) => (
                      <ExpandableCategoryItem
                        key={category.id}
                        category={category}
                        isExpanded={expandedCategoryId === category.id}
                        onToggle={() => handleToggleExpand(category.id)}
                        onEdit={handleEditCategoryClick}
                        onDelete={handleCategorySaved}
                      />
                    ))}
                  </div>
                ))}
              </div>
              {/* Пагинация (точки) */}
              <div className="flex justify-center gap-1 mt-2">
                {Array.from({ length: categoryChunks.length }).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToPage(index)}
                    className="h-2 w-2 rounded-full transition-colors duration-200"
                    style={{
                      backgroundColor: index === currentPage ? 'var(--primary)' : 'var(--border)'
                    }}
                    aria-label={`Перейти к странице ${index + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Диалоговое окно формы */}
      {currentBudget && (
        <CategoryForm
          budgetId={currentBudget.id}
          categoryToEdit={categoryToEdit}
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          onCategorySaved={handleCategorySaved}
        />
      )}
    </div>
  );
} 