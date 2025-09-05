import { useState, useCallback, memo, useMemo } from 'react';
import { useDrop } from 'react-dnd';
import { Column, Card as CardType, DragItem } from '../types/kanban';
import { KanbanCardUltraSimple as KanbanCard } from './KanbanCardUltraSimple';
import { QuickAddCard } from './QuickAddCard';
import { CardDropZone } from './CardDropZone';
import { ColumnColorPicker, getColumnBackgroundClass, getCardCountBadgeClass } from './ColumnColorPicker';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from './ui/dropdown-menu';
import { MoreHorizontal, Edit3, Trash2 } from 'lucide-react';


interface KanbanColumnProps {
  column: Column;
  cards: CardType[];
  onCreateCard: (columnId: string, title: string, description?: string) => void;
  onUpdateCard: (cardId: string, updates: Partial<Pick<CardType, 'title' | 'description' | 'completed'>>) => void;
  onDeleteCard: (cardId: string) => void;
  onMoveCard: (cardId: string, fromColumnId: string, toColumnId: string, newPosition: number) => void;
  onUpdateColumn: (columnId: string, updates: { title?: string; backgroundColor?: string }) => void;
  onDeleteColumn: (columnId: string) => void;
  onCardClick: (card: CardType) => void;
  filteredCardIds?: string[];
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

export const KanbanColumn = memo(function KanbanColumn({
  column,
  cards,
  onCreateCard,
  onUpdateCard,
  onDeleteCard,
  onMoveCard,
  onUpdateColumn,
  onDeleteColumn,
  onCardClick,
  filteredCardIds,
  onDragStart,
  onDragEnd,
}: KanbanColumnProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState(column.title);

  const handleCardDrop = useCallback((item: DragItem, targetColumnId: string, targetPosition: number) => {
    // 避免无效的移动
    if (item.columnId === targetColumnId) {
      if (item.position === targetPosition || item.position === targetPosition - 1) {
        return;
      }
      if (item.position < targetPosition) {
        targetPosition = targetPosition - 1;
      }
    }
    
    // 直接调用，减少延迟
    onMoveCard(item.id, item.columnId, targetColumnId, targetPosition);
  }, [onMoveCard]);

  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: 'card',
    drop: (item: DragItem, monitor) => {
      if (!monitor.didDrop()) {
        // 默认放到列的最后 - 使用该列的所有卡片数量作为位置
        const allColumnCards = cards.filter(card => card.columnId === column.id);
        const targetPosition = allColumnCards.length;
        console.log(`🔄 COLUMN FALLBACK: Card ${item.id} -> Column ${column.id} Position ${targetPosition}`);
        handleCardDrop(item, column.id, targetPosition);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true }),
      canDrop: monitor.canDrop(),
    }),
  }), [cards, column.id, handleCardDrop]);

  // Filter and sort cards for this column (memoized)
  const sortedCards = useMemo(() => {
    const columnCards = cards.filter(card => card.columnId === column.id);
    const filteredCards = filteredCardIds 
      ? columnCards.filter(card => filteredCardIds.includes(card.id))
      : columnCards;
    
    return filteredCards.sort((a, b) => a.position - b.position);
  }, [cards, column.id, filteredCardIds]);

  const handleSaveTitle = useCallback(() => {
    if (editTitle.trim() && editTitle.trim() !== column.title) {
      onUpdateColumn(column.id, { title: editTitle.trim() });
    }
    setIsEditingTitle(false);
  }, [editTitle, column.title, column.id, onUpdateColumn]);

  const handleColorChange = useCallback((backgroundColor: string | undefined) => {
    onUpdateColumn(column.id, { backgroundColor });
  }, [column.id, onUpdateColumn]);

  const handleCancelEdit = useCallback(() => {
    setEditTitle(column.title);
    setIsEditingTitle(false);
  }, [column.title]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveTitle();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  }, [handleSaveTitle, handleCancelEdit]);

  return (
    <div
      className={`flex flex-col rounded-lg overflow-hidden transition-colors duration-200 ${getColumnBackgroundClass(column.backgroundColor)}`}
      style={{ 
        width: '320px',
        maxWidth: '320px',
        minWidth: '320px',
        willChange: 'auto',
        backfaceVisibility: 'hidden',
        transform: 'translateZ(0)',
      }}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between px-3 py-[8px] px-[12px] py-[6px]">
        {isEditingTitle ? (
          <div className="flex-1 mr-2 min-w-0">
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleSaveTitle}
              className="h-7 w-full max-w-full"
              style={{ width: '100%', maxWidth: '100%' }}
              autoFocus
            />
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-1">
            <h3 
              className="cursor-pointer hover:text-primary transition-colors"
              onClick={() => setIsEditingTitle(true)}
            >
              {column.title}
            </h3>
            <span className={`text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center transition-all duration-200 ${
              getCardCountBadgeClass(column.backgroundColor)
            }`}>
              {sortedCards.length}
            </span>
          </div>
        )}

        <div className="flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                <MoreHorizontal className="w-3.5 h-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsEditingTitle(true)}>
                <Edit3 className="w-4 h-4 mr-2" />
                重命名
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <ColumnColorPicker
                currentColor={column.backgroundColor}
                onColorChange={handleColorChange}
              />
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDeleteColumn(column.id)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                删除列
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Cards Container */}
      <div
        ref={drop}
        className={`
          px-3 pb-3 transition-colors duration-200 ease-out
          ${isOver && canDrop ? 'bg-primary/5' : ''}
        `}
      >

        
        {/* 第一个位置的放置区域（空列时） */}
        {sortedCards.length === 0 && (
          <CardDropZone
            columnId={column.id}
            position={0}
            onDrop={handleCardDrop}
            isFirst
            isLast
          />
        )}

        {/* 渲染所有卡片 */}
        {sortedCards.map((card, index) => (
          <div key={card.id}>
            {/* 卡片前的放置区域 */}
            <CardDropZone
              columnId={column.id}
              position={index}
              onDrop={handleCardDrop}
              isFirst={index === 0}
            />
            
            <div className="mb-2">
              <KanbanCard
                card={card}
                onUpdate={onUpdateCard}
                onClick={onCardClick}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
              />
            </div>
          </div>
        ))}
        
        {/* 最后一个位置的放置区域（有卡片时） */}
        {sortedCards.length > 0 && (
          <CardDropZone
            columnId={column.id}
            position={sortedCards.length}
            onDrop={handleCardDrop}
            isLast
          />
        )}

        {/* Quick Add Card - 紧跟在最后一个卡片后面 */}
        <div className={sortedCards.length > 0 ? "mt-2" : "mt-0"}>
          <QuickAddCard
            key={`quick-add-${column.id}`}
            instanceId={column.id}
            onAdd={(title, description) => onCreateCard(column.id, title, description)}
            placeholder="添加新卡片..."
          />
        </div>

        {/* 空列时的拖拽提示区域 */}
        {sortedCards.length === 0 && (
          <div
            className={`
              mt-4 min-h-[200px] transition-colors duration-200 ease-out rounded-lg flex items-center justify-center
              ${isOver && canDrop ? 'bg-primary/8 border-2 border-dashed border-primary/40' : 'border-2 border-dashed border-transparent'}
            `}
          >
            {isOver && canDrop && (
              <div className="text-primary/70 font-medium animate-in fade-in-50 duration-300">
                在此处放置第一张卡片
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});