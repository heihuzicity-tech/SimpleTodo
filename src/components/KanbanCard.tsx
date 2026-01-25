/**
 * KanbanCard 组件 - 基于 @dnd-kit + Tailwind CSS 过渡
 * 参考 cc-switch 设计语言重构
 *
 * 修复 Tauri WebView 兼容性:
 * 1. 将 listeners 绑定到整个卡片容器
 * 2. 移除 touch-none（可能导致 WebView 问题）
 * 3. 添加 MouseSensor 支持
 */
import { useState, memo, useCallback } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card as CardType } from '../types/kanban';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Checkbox } from './ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Edit3, Trash2, MoreHorizontal, GripVertical } from 'lucide-react';
import { cn } from '../lib/utils';

interface KanbanCardProps {
  card: CardType;
  onUpdate: (cardId: string, updates: Partial<Pick<CardType, 'title' | 'description' | 'completed'>>) => void;
  onDelete: (cardId: string) => void;
  onClick: (card: CardType) => void;
}

export const KanbanCard = memo(function KanbanCard({
  card,
  onUpdate,
  onDelete,
  onClick,
}: KanbanCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(card.title);
  const [editDescription, setEditDescription] = useState(card.description || '');

  // @dnd-kit sortable hook
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card.id,
    data: {
      type: 'card',
      columnId: card.columnId,
      position: card.position,
    },
    disabled: isEditing,
  });

  // CSS Transform 样式 - 高性能拖拽
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.5 : 1,
  };

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

  // 点击处理 - 需要区分拖拽和点击
  const handleCardClick = useCallback((e: React.MouseEvent) => {
    if (!isEditing && !isDragging) {
      e.preventDefault();
      e.stopPropagation();
      onClick(card);
    }
  }, [isEditing, isDragging, onClick, card]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        // 基础样式 - 移除 touch-none 以兼容 Tauri WebView
        "w-full select-none",
        // 拖拽状态
        isDragging && "cursor-grabbing scale-[1.02] shadow-lg",
        !isDragging && !isEditing && "cursor-grab"
      )}
    >
      <Card
        className={cn(
          // 基础样式 - 参考 cc-switch 卡片设计
          "group relative bg-white border w-full overflow-hidden rounded-lg",
          // 过渡动画 - 使用 Tailwind
          "transition-all duration-200 ease-out",
          // 悬停效果
          !isDragging && "hover:border-gray-300 hover:shadow-md",
          // 拖拽状态
          isDragging && "border-primary/50 ring-2 ring-primary/20 shadow-xl",
          // 编辑状态
          isEditing && "ring-2 ring-primary",
          // 完成状态
          card.completed && "opacity-75 bg-gray-50"
        )}
      >
        <div className="flex">
          {/* 拖拽手柄指示器 */}
          {!isEditing && (
            <div
              className={cn(
                "flex items-center justify-center w-6",
                "opacity-0 group-hover:opacity-60 hover:!opacity-100",
                "transition-opacity duration-150",
                isDragging && "opacity-100"
              )}
            >
              <GripVertical className="w-4 h-4 text-gray-400" />
            </div>
          )}

          {/* Checkbox */}
          {!isEditing && (
            <div
              className="flex items-start justify-center px-2 py-2.5"
              onPointerDown={(e) => e.stopPropagation()}
            >
              <Checkbox
                checked={card.completed || false}
                onCheckedChange={(checked: boolean) => {
                  onUpdate(card.id, { completed: !!checked });
                }}
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
                className={cn(
                  "mt-0.5 flex-shrink-0",
                  "transition-transform duration-150 hover:scale-110"
                )}
              />
            </div>
          )}

          {/* Main Content */}
          <div
            className={cn(
              "flex-1 px-2 py-2.5 min-w-0",
              !isEditing && "cursor-pointer hover:bg-gray-50/50",
              "transition-colors duration-150"
            )}
            onClick={handleCardClick}
            onPointerDown={(e) => {
              // 如果点击的是内容区域且不是编辑模式，允许拖拽传播
              // 但如果是想打开详情，则需要阻止
            }}
          >
            {isEditing ? (
              // 编辑模式
              <div
                className="space-y-2.5 w-full animate-in fade-in duration-200"
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
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
              </div>
            ) : (
              // 显示模式
              <div className="animate-in fade-in duration-150">
                <div className="mb-1.5">
                  <h4 className={cn(
                    "leading-tight break-words transition-all duration-200",
                    card.completed && "line-through text-gray-500"
                  )}>
                    {card.title}
                  </h4>
                </div>

                {/* Status Badge and Actions Row */}
                <div className="flex items-center justify-between mt-2">
                  <span
                    className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium",
                      "transition-all duration-200",
                      card.completed
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    )}
                  >
                    {card.completed ? '✓ 已完成' : '进行中'}
                  </span>

                  {/* Actions Menu - 悬停显示 */}
                  <div
                    className={cn(
                      "transition-opacity duration-150",
                      "opacity-0 group-hover:opacity-100"
                    )}
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 hover:bg-gray-100"
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
                          className="cursor-pointer text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          删除
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
});
