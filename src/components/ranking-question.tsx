'use client';

import { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RankingQuestionProps {
  options: string[];
  categories: string[];
  value: Record<string, string[]>;
  onChange: (value: Record<string, string[]>) => void;
}

interface SortableItemProps {
  id: string;
  children: React.ReactNode;
}

function SortableItem({ id, children }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-3 bg-background border-2 rounded-lg p-4 cursor-move hover:border-primary/50 transition-colors',
        isDragging && 'opacity-50 shadow-lg border-primary'
      )}
      {...attributes}
      {...listeners}
    >
      <GripVertical className="h-5 w-5 text-muted-foreground flex-shrink-0" />
      <span className="text-sm font-medium">{children}</span>
    </div>
  );
}

export function RankingQuestion({ options, categories, value, onChange }: RankingQuestionProps) {
  // Initialize with all options in order if empty
  const [orderedItems, setOrderedItems] = useState<string[]>(() => {
    if (Object.keys(value).length > 0) {
      // Reconstruct order from categories
      return categories.flatMap((cat) => value[cat] || []);
    }
    return [...options];
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Convert ordered list to categorized format
  useEffect(() => {
    const itemsPerCategory = Math.ceil(orderedItems.length / categories.length);
    const categorized: Record<string, string[]> = {};
    
    categories.forEach((cat, idx) => {
      const start = idx * itemsPerCategory;
      const end = start + itemsPerCategory;
      categorized[cat] = orderedItems.slice(start, end);
    });

    onChange(categorized);
  }, [orderedItems, categories, onChange]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = orderedItems.indexOf(active.id as string);
    const newIndex = orderedItems.indexOf(over.id as string);

    setOrderedItems(arrayMove(orderedItems, oldIndex, newIndex));
  };

  // Calculate which category each item belongs to for visual feedback
  const getCategoryForIndex = (index: number): string => {
    const itemsPerCategory = Math.ceil(orderedItems.length / categories.length);
    const categoryIndex = Math.floor(index / itemsPerCategory);
    return categories[Math.min(categoryIndex, categories.length - 1)];
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground space-y-1">
        <p className="font-medium">Drag to reorder from most important to least important</p>
        <div className="flex items-center justify-between text-xs px-2">
          <span className="text-primary font-semibold">↑ {categories[0]}</span>
          <span className="text-muted-foreground">↓ {categories[categories.length - 1]}</span>
        </div>
      </div>

      <div className="relative border-2 border-dashed rounded-lg p-4 bg-muted/20">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={orderedItems} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {orderedItems.map((item, index) => (
                <div key={item}>
                  <SortableItem id={item}>{item}</SortableItem>
                  {/* Show category dividers */}
                  {index < orderedItems.length - 1 &&
                    getCategoryForIndex(index) !== getCategoryForIndex(index + 1) && (
                      <div className="flex items-center gap-2 my-4">
                        <div className="flex-1 border-t-2 border-dashed border-muted-foreground/30" />
                        <span className="text-xs font-semibold text-muted-foreground px-2">
                          {getCategoryForIndex(index + 1)}
                        </span>
                        <div className="flex-1 border-t-2 border-dashed border-muted-foreground/30" />
                      </div>
                    )}
                </div>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}

