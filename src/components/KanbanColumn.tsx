import { useState, useCallback, memo, useMemo } from 'react';
import { useDrop } from 'react-dnd';
import { motion, AnimatePresence } from 'framer-motion';
import { Column, Card as CardType, DragItem } from '../types/kanban';
import { KanbanCard } from './KanbanCard';
import { QuickAddCard } from './QuickAddCard';
import { CardDropZone } from './CardDropZone';
import { ColumnColorPicker, getColumnBackgroundClass, getCardCountBadgeClass } from './ColumnColorPicker';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from './ui/dropdown-menu';
import { MoreHorizontal, Edit3, Trash2 } from 'lucide-react';
import { columnVariants, listContainerVariants, durations } from '../lib/animations';


interface KanbanColumnProps {
  column: Column;
  cards: CardType[];
  index: number;
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
  index,
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
    if (item.columnId === targetColumnId) {
      if (item.position === targetPosition || item.position === targetPosition - 1) {
        return;
      }
      if (item.position < targetPosition) {
        targetPosition = targetPosition - 1;
      }
    }
    onMoveCard(item.id, item.columnId, targetColumnId, targetPosition);
  }, [onMoveCard]);

  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: 'card',
    drop: (item: DragItem, monitor) => {
      if (!monitor.didDrop()) {
        const allColumnCards = cards.filter(card => card.columnId === column.id);
        const targetPosition = allColumnCards.length;
        handleCardDrop(item, column.id, targetPosition);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true }),
      canDrop: monitor.canDrop(),
    }),
  }), [cards, column.id, handleCardDrop]);

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
    <motion.div
      variants={columnVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ delay: index * 0.1 }}
      className={`flex flex-col rounded-xl overflow-hidden transition-all duration-300 ${getColumnBackgroundClass(column.backgroundColor)}`}
      style={{
        width: '320px',
        maxWidth: '320px',
        minWidth: '320px',
      }}
    >
      {/* Column Header */}
      <motion.div
        className="flex items-center justify-between px-4 py-3"
        whileHover={{ backgroundColor: 'rgba(0,0,0,0.02)' }}
        transition={{ duration: durations.micro }}
      >
        <AnimatePresence mode="wait">
          {isEditingTitle ? (
            <motion.div
              key="editing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: durations.fast }}
              className="flex-1 mr-2 min-w-0"
            >
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleSaveTitle}
                className="h-8 w-full font-semibold"
                autoFocus
              />
            </motion.div>
          ) : (
            <motion.div
              key="display"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 flex-1"
            >
              <motion.h3
                className="font-semibold cursor-pointer hover:text-primary transition-colors duration-150"
                onClick={() => setIsEditingTitle(true)}
                whileHover={{ x: 2 }}
              >
                {column.title}
              </motion.h3>
              <motion.span
                className={`text-xs px-2 py-0.5 rounded-full min-w-[22px] text-center font-medium ${getCardCountBadgeClass(column.backgroundColor)}`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                key={sortedCards.length}
              >
                {sortedCards.length}
              </motion.span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-black/5">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
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
      </motion.div>

      {/* Cards Container */}
      <motion.div
        ref={drop}
        className={`
          flex-1 px-3 pb-3 transition-all duration-200 ease-out min-h-[100px]
          ${isOver && canDrop ? 'bg-primary/5 ring-2 ring-inset ring-primary/20' : ''}
        `}
        animate={{
          backgroundColor: isOver && canDrop ? 'rgba(var(--primary), 0.05)' : 'transparent',
        }}
        transition={{ duration: durations.fast }}
      >
        {/* Cards List with stagger animation */}
        <motion.div
          variants={listContainerVariants}
          initial="initial"
          animate="animate"
          className="space-y-2"
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
          <AnimatePresence mode="popLayout">
            {sortedCards.map((card, cardIndex) => (
              <motion.div
                key={card.id}
                layout
                layoutId={`card-container-${card.id}`}
                transition={{
                  layout: {
                    type: 'spring',
                    stiffness: 400,
                    damping: 30,
                  },
                }}
              >
                {/* 卡片前的放置区域 */}
                <CardDropZone
                  columnId={column.id}
                  position={cardIndex}
                  onDrop={handleCardDrop}
                  isFirst={cardIndex === 0}
                />

                <KanbanCard
                  card={card}
                  index={cardIndex}
                  onUpdate={onUpdateCard}
                  onDelete={onDeleteCard}
                  onClick={onCardClick}
                  onDragStart={onDragStart}
                  onDragEnd={onDragEnd}
                />
              </motion.div>
            ))}
          </AnimatePresence>

          {/* 最后一个位置的放置区域（有卡片时） */}
          {sortedCards.length > 0 && (
            <CardDropZone
              columnId={column.id}
              position={sortedCards.length}
              onDrop={handleCardDrop}
              isLast
            />
          )}
        </motion.div>

        {/* Quick Add Card */}
        <motion.div
          className={sortedCards.length > 0 ? "mt-3" : "mt-0"}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: durations.normal }}
        >
          <QuickAddCard
            key={`quick-add-${column.id}`}
            instanceId={column.id}
            onAdd={(title, description) => onCreateCard(column.id, title, description)}
            placeholder="添加新卡片..."
          />
        </motion.div>

        {/* 空列时的拖拽提示区域 */}
        <AnimatePresence>
          {sortedCards.length === 0 && isOver && canDrop && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: durations.fast }}
              className="mt-4 min-h-[150px] rounded-xl flex items-center justify-center bg-primary/5 border-2 border-dashed border-primary/30"
            >
              <motion.div
                className="text-primary/70 font-medium"
                animate={{ y: [0, -5, 0] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                ↓ 放置卡片到此处
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
});
