import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useKanbanStore } from './hooks/useKanbanStore';
import { useProjectStore } from './hooks/useProjectStore';
import { useAutoScroll } from './hooks/useAutoScroll';
import { KanbanColumn } from './components/KanbanColumn';
import { CardDetailsDialog } from './components/CardDetailsDialog';
import { DragPreview } from './components/DragPreview';
import { ProjectSelector } from './components/ProjectSelector';


import { Card as CardType } from './types/kanban';
import { Toaster } from './components/ui/sonner';
import { Button } from './components/ui/button';
import { Plus, Kanban } from 'lucide-react';

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
    resetBoard,
    fixDataConsistency,
  } = useKanbanStore(currentProjectId);

  const [selectedCard, setSelectedCard] = useState<CardType | null>(null);
  const [isCardDialogOpen, setIsCardDialogOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // 滚动容器引用
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // 自动滚动hook - 高性能流畅滚动
  const { startAutoScroll, stopAutoScroll } = useAutoScroll({
    scrollContainer: scrollContainerRef.current,
    threshold: 120, // 触发区域
    maxScrollSpeed: 20, // 最大滚动速度
    enabled: isDragging,
  });

  // 拖拽开始时启用自动滚动
  const handleDragStart = useCallback(() => {
    setIsDragging(true);
    startAutoScroll();
  }, [startAutoScroll]);

  // 拖拽结束时停止自动滚动
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    stopAutoScroll();
  }, [stopAutoScroll]);




  const handleCardClick = useCallback((card: CardType) => {
    setSelectedCard(card);
    setIsCardDialogOpen(true);
  }, []);

  const handleCloseCardDialog = useCallback(() => {
    setIsCardDialogOpen(false);
    setSelectedCard(null);
  }, []);

  // Memoize card counts and sorted columns
  const cardCounts = useMemo(() => {
    return board.columns.reduce((counts, column) => {
      counts[column.id] = board.cards.filter(card => card.columnId === column.id).length;
      return counts;
    }, {} as Record<string, number>);
  }, [board.columns, board.cards]);

  const sortedColumns = useMemo(() => {
    return [...board.columns].sort((a, b) => a.position - b.position);
  }, [board.columns]);

  const selectedCardColumn = useMemo(() => {
    return selectedCard 
      ? board.columns.find(col => col.id === selectedCard.columnId)
      : null;
  }, [selectedCard, board.columns]);

  return (
    <DndProvider backend={HTML5Backend}>
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
                scrollBehavior: 'auto', // 禁用平滑滚动以获得即时响应
                WebkitOverflowScrolling: 'touch', // iOS 流畅滚动
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
                  onMoveCard={moveCard}
                  onUpdateColumn={updateColumn}
                  onDeleteColumn={deleteColumn}
                  onCardClick={handleCardClick}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                />
              ))}
              
              {/* Add Column Button */}
              <div className="flex-shrink-0">
                <div
                  className="w-80 h-[50px] rounded-lg border border-dashed border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 hover:from-primary/8 hover:to-primary/15 transition-all duration-300 cursor-pointer group flex items-center justify-center hover:border-primary/30 hover:shadow-sm"
                  style={{ width: '320px' }}
                  onClick={() => createColumn('新列')}
                >
                  <div className="flex items-center gap-2 text-primary/70 group-hover:text-primary transition-colors duration-200">
                    <div className="w-8 h-8 rounded-full bg-primary/10 group-hover:bg-primary/15 flex items-center justify-center transition-all duration-200 group-hover:scale-105">
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
        
        {/* Drag Preview - Simplified for performance */}
        <DragPreview />


      </div>
    </DndProvider>
  );
}