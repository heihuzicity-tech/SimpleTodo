/**
 * App 主组件 - 基于 @dnd-kit 重构
 * 参考 cc-switch 设计语言
 *
 * 核心改动:
 * 1. 使用 DndContext 替代 DndProvider
 * 2. 使用 DragOverlay 替代自定义 DragPreview
 * 3. 移除 useAutoScroll (dnd-kit 内置自动滚动)
 */
import { useState, useCallback, useRef, useMemo } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import {
  DndContext,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
  PointerSensor,
  MouseSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable';
import { queryClient } from './lib/query/queryClient';
import { useKanbanStore } from './hooks/useKanbanStore';
import { useProjectStore } from './hooks/useProjectStore';
import { KanbanColumn } from './components/KanbanColumn';
import { CardDetailsDialog } from './components/CardDetailsDialog';
import { DragOverlayCard } from './components/DragOverlayCard';
import { ProjectSelector } from './components/ProjectSelector';

import { Card as CardType } from './types/kanban';
import { Toaster } from './components/ui/sonner';
import { Button } from './components/ui/button';
import { Plus, Kanban } from 'lucide-react';
import { cn } from './lib/utils';

export default function App() {
  const {
    projects,
    currentProject,
    currentProjectId,
    createProject,
    updateProject,
    deleteProject,
    switchProject,
  } = useProjectStore();

  const {
    board,
    activities,
    createCard,
    updateCard,
    deleteCard,
    moveCard,
    createColumn,
    updateColumn,
    deleteColumn,
  } = useKanbanStore(currentProjectId);

  const [selectedCard, setSelectedCard] = useState<CardType | null>(null);
  const [isCardDialogOpen, setIsCardDialogOpen] = useState(false);
  const [activeCard, setActiveCard] = useState<CardType | null>(null);

  // 滚动容器引用
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // @dnd-kit 传感器配置 - 添加 MouseSensor 以兼容 Tauri WebView
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8, // 8px 后才激活拖拽
      },
    }),
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 拖拽开始
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const draggedCard = board.cards.find(card => card.id === active.id);
    if (draggedCard) {
      setActiveCard(draggedCard);
    }
  }, [board.cards]);

  // 拖拽结束
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCard(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // 获取活动卡片信息
    const activeCard = board.cards.find(card => card.id === activeId);
    if (!activeCard) return;

    const activeColumnId = activeCard.columnId;

    // 判断是放置到卡片上还是列上
    let targetColumnId: string;
    let targetPosition: number;

    if (overId.startsWith('column-')) {
      // 放置到列上（空列或列底部）
      targetColumnId = overId.replace('column-', '');
      const targetCards = board.cards.filter(c => c.columnId === targetColumnId);
      targetPosition = targetCards.length;
    } else {
      // 放置到另一个卡片上
      const overCard = board.cards.find(card => card.id === overId);
      if (!overCard) return;

      targetColumnId = overCard.columnId;

      // 计算目标位置
      const targetCards = board.cards
        .filter(c => c.columnId === targetColumnId)
        .sort((a, b) => a.position - b.position);

      const overIndex = targetCards.findIndex(c => c.id === overId);

      if (activeColumnId === targetColumnId) {
        // 同列移动
        const activeIndex = targetCards.findIndex(c => c.id === activeId);
        if (activeIndex < overIndex) {
          targetPosition = overIndex;
        } else {
          targetPosition = overIndex;
        }
      } else {
        // 跨列移动
        targetPosition = overIndex;
      }
    }

    // 执行移动
    if (activeId !== overId || activeColumnId !== targetColumnId) {
      console.log(`🎯 DragEnd: ${activeId} from ${activeColumnId} to ${targetColumnId} at position ${targetPosition}`);
      moveCard(activeId, activeColumnId, targetColumnId, targetPosition);
    }
  }, [board.cards, moveCard]);

  const handleCardClick = useCallback((card: CardType) => {
    setSelectedCard(card);
    setIsCardDialogOpen(true);
  }, []);

  const handleCloseCardDialog = useCallback(() => {
    setIsCardDialogOpen(false);
    setSelectedCard(null);
  }, []);

  // Memoize sorted columns
  const sortedColumns = useMemo(() => {
    return [...board.columns].sort((a, b) => a.position - b.position);
  }, [board.columns]);

  const selectedCardColumn = useMemo(() => {
    return selectedCard
      ? board.columns.find(col => col.id === selectedCard.columnId)
      : null;
  }, [selectedCard, board.columns]);

  return (
    <QueryClientProvider client={queryClient}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="min-h-screen bg-muted/20">
          {/* Header */}
          <header className="border-b border-border bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/80">
            <div className="container mx-auto px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Kanban className="w-6 h-6 text-primary" />
                    <h1 className="text-xl font-semibold">我的看板</h1>
                  </div>
                  <ProjectSelector
                    projects={projects}
                    currentProject={currentProject}
                    onProjectSwitch={switchProject}
                    onProjectCreate={createProject}
                    onProjectUpdate={updateProject}
                    onProjectDelete={deleteProject}
                  />
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="container mx-auto px-4 py-4 h-[calc(100vh-80px)]">
            {sortedColumns.length > 0 ? (
              <div
                ref={scrollContainerRef}
                className="flex gap-6 overflow-x-auto h-full pb-4"
                style={{
                  scrollBehavior: 'auto',
                  WebkitOverflowScrolling: 'touch',
                }}
              >
                {sortedColumns.map((column) => (
                  <KanbanColumn
                    key={column.id}
                    column={column}
                    cards={board.cards}
                    onCreateCard={createCard}
                    onUpdateCard={updateCard}
                    onDeleteCard={deleteCard}
                    onUpdateColumn={updateColumn}
                    onDeleteColumn={deleteColumn}
                    onCardClick={handleCardClick}
                  />
                ))}

                {/* Add Column Button */}
                <div className="flex-shrink-0">
                  <div
                    className={cn(
                      "w-80 h-[50px] rounded-lg",
                      "border border-dashed border-primary/20",
                      "bg-gradient-to-br from-primary/5 to-primary/10",
                      "hover:from-primary/8 hover:to-primary/15",
                      "transition-all duration-300 cursor-pointer group",
                      "flex items-center justify-center",
                      "hover:border-primary/30 hover:shadow-sm"
                    )}
                    style={{ width: '320px' }}
                    onClick={() => createColumn('新列')}
                  >
                    <div className="flex items-center gap-2 text-primary/70 group-hover:text-primary transition-colors duration-200">
                      <div className={cn(
                        "w-8 h-8 rounded-full bg-primary/10 group-hover:bg-primary/15",
                        "flex items-center justify-center",
                        "transition-all duration-200 group-hover:scale-105"
                      )}>
                        <Plus className="w-4 h-4" />
                      </div>
                      <span className="font-medium">添加新列</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
                <Kanban className="w-16 h-16 text-muted-foreground/50" />
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">欢迎使用看板</h3>
                  <p className="text-muted-foreground max-w-sm">
                    开始创建你的第一个列来组织任务和项目
                  </p>
                </div>
                <Button onClick={() => createColumn('待办')} className="gap-2">
                  <Plus className="w-4 h-4" />
                  创建第一列
                </Button>
              </div>
            )}
          </main>

          {/* Card Details Dialog */}
          <CardDetailsDialog
            card={selectedCard}
            isOpen={isCardDialogOpen}
            onClose={handleCloseCardDialog}
            onUpdate={updateCard}
            onDelete={deleteCard}
            activities={activities}
            columnTitle={selectedCardColumn?.title || ''}
          />

          {/* Toast Notifications */}
          <Toaster position="bottom-right" />

          {/* Drag Overlay - @dnd-kit 高性能拖拽预览 */}
          <DragOverlay>
            {activeCard && <DragOverlayCard card={activeCard} />}
          </DragOverlay>
        </div>
      </DndContext>
    </QueryClientProvider>
  );
}
