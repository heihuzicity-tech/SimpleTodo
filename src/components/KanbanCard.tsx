import { useState, useRef, useEffect, memo, useCallback } from 'react';
import { useDrag } from 'react-dnd';
import { getEmptyImage } from 'react-dnd-html5-backend';
import { motion, AnimatePresence } from 'framer-motion';
import { Card as CardType } from '../types/kanban';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Checkbox } from './ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Edit3, Trash2, MoreHorizontal, GripVertical } from 'lucide-react';
import { cardVariants, durations } from '../lib/animations';

interface KanbanCardProps {
  card: CardType;
  index: number;
  onUpdate: (cardId: string, updates: Partial<Pick<CardType, 'title' | 'description' | 'completed'>>) => void;
  onDelete: (cardId: string) => void;
  onClick: (card: CardType) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

export const KanbanCard = memo(function KanbanCard({
  card,
  index,
  onUpdate,
  onDelete,
  onClick,
  onDragStart,
  onDragEnd
}: KanbanCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(card.title);
  const [editDescription, setEditDescription] = useState(card.description || '');
  const cardRef = useRef<HTMLDivElement>(null);
  const [wasDragging, setWasDragging] = useState(false);

  const [{ isDragging, canDrag }, drag, dragPreview] = useDrag(() => ({
    type: 'card',
    item: () => ({
      type: 'card',
      id: card.id,
      columnId: card.columnId,
      position: card.position,
      title: card.title,
      description: card.description,
    }),
    canDrag: !isEditing,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
      canDrag: monitor.canDrag(),
    }),
    end: () => {
      onDragEnd?.();
    },
    isDragging: (monitor) => {
      return monitor.getItem()?.id === card.id;
    },
  }), [isEditing, card.id, card.columnId, card.position, card.title, card.description, onDragEnd]);

  useEffect(() => {
    dragPreview(getEmptyImage(), { captureDraggingState: true });
  }, [dragPreview]);

  useEffect(() => {
    if (isDragging && !wasDragging) {
      setWasDragging(true);
      onDragStart?.();
    } else if (!isDragging && wasDragging) {
      setWasDragging(false);
    }
  }, [isDragging, wasDragging, onDragStart]);

  const handleSave = useCallback(() => {
    if (editTitle.trim()) {
      onUpdate(card.id, {
        title: editTitle.trim(),
        description: editDescription.trim() || undefined,
      });
      setIsEditing(false);
    }
  }, [editTitle, editDescription, onUpdate, card.id]);

  const handleCancel = useCallback(() => {
    setEditTitle(card.title);
    setEditDescription(card.description || '');
    setIsEditing(false);
  }, [card.title, card.description]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  }, [handleSave, handleCancel]);

  const dragRef = drag(cardRef);

  return (
    <motion.div
      ref={dragRef as React.Ref<HTMLDivElement>}
      layout
      layoutId={card.id}
      variants={cardVariants}
      initial="initial"
      animate={isDragging ? "drag" : "animate"}
      exit="exit"
      whileHover={!isDragging && !isEditing ? "hover" : undefined}
      whileTap={!isDragging && !isEditing ? "tap" : undefined}
      transition={{
        layout: {
          type: 'spring',
          stiffness: 500,
          damping: 35,
          mass: 0.8,
        },
      }}
      style={{
        opacity: isDragging ? 0.4 : 1,
        zIndex: isDragging ? 50 : 'auto',
      }}
      className="w-full"
    >
      <Card
        className={`
          group relative bg-white border w-full overflow-hidden rounded-lg
          transition-shadow duration-200
          ${isDragging ?
            'shadow-2xl border-primary/50 ring-2 ring-primary/20' :
            'shadow-sm hover:shadow-md'
          }
          ${isEditing ? 'ring-2 ring-primary shadow-lg' : ''}
          ${card.completed ? 'opacity-75 bg-muted/30' : ''}
        `}
      >
        <div className="flex">
          {/* 拖拽手柄 */}
          {!isEditing && (
            <motion.div
              className={`
                flex items-center justify-center w-6
                ${canDrag ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}
                opacity-0 group-hover:opacity-60 hover:!opacity-100
                transition-opacity duration-150
              `}
              whileHover={{ scale: 1.1 }}
            >
              <GripVertical className="w-4 h-4 text-muted-foreground/50" />
            </motion.div>
          )}

          {/* Checkbox */}
          {!isEditing && (
            <div className="flex items-start justify-center px-2 py-2.5">
              <Checkbox
                checked={card.completed || false}
                onCheckedChange={(checked: boolean) => {
                  onUpdate(card.id, { completed: !!checked });
                }}
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
                className="mt-0.5 flex-shrink-0 transition-transform duration-150 hover:scale-110"
              />
            </div>
          )}

          {/* Main Content */}
          <div
            className={`
              flex-1 px-2 py-2.5 min-w-0
              ${!isEditing ? 'cursor-pointer' : 'cursor-default'}
              ${!isEditing ? 'hover:bg-muted/20' : ''}
              transition-colors duration-150
            `}
            onClick={(e) => {
              if (!isEditing && !isDragging) {
                e.preventDefault();
                e.stopPropagation();
                onClick(card);
              }
            }}
          >
            <AnimatePresence mode="wait">
              {isEditing ? (
                <motion.div
                  key="editing"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: durations.fast }}
                  className="space-y-2.5 w-full"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="卡片标题"
                    className="font-medium w-full"
                    autoFocus
                  />
                  <Textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="描述（可选）"
                    className="min-h-[60px] resize-none w-full"
                  />
                  <div className="flex gap-2 w-full">
                    <Button size="sm" onClick={handleSave} disabled={!editTitle.trim()}>
                      保存
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleCancel}>
                      取消
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="display"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: durations.micro }}
                >
                  <div className="mb-1.5">
                    <h4 className={`
                      leading-tight break-words transition-all duration-200
                      ${card.completed ? 'line-through text-muted-foreground/70' : ''}
                    `}>
                      {card.title}
                    </h4>
                  </div>

                  {card.description && (
                    <p className={`
                      text-sm mb-2 leading-relaxed break-words line-clamp-2
                      transition-all duration-200
                      ${card.completed ? 'text-muted-foreground/50 line-through' : 'text-muted-foreground'}
                    `}>
                      {card.description}
                    </p>
                  )}

                  {/* Status Badge and Actions Row */}
                  <div className="flex items-center justify-between mt-2">
                    <motion.span
                      className={`
                        inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium
                        transition-all duration-200
                        ${card.completed
                          ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                        }
                      `}
                      whileHover={{ scale: 1.05 }}
                    >
                      {card.completed ? '✓ 已完成' : '进行中'}
                    </motion.span>

                    {/* Actions Menu */}
                    <motion.div
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                    >
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 hover:bg-muted/50"
                            onClick={(e: React.MouseEvent) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="w-4 h-4" />
                            <span className="sr-only">操作菜单</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-32">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsEditing(true);
                            }}
                            className="cursor-pointer"
                          >
                            <Edit3 className="w-4 h-4 mr-2" />
                            编辑
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete(card.id);
                            }}
                            className="cursor-pointer text-destructive focus:text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            删除
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </Card>
    </motion.div>
  );
});
