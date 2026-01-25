/**
 * CardDetailsDialog - 任务详情对话框
 * 简洁设计
 */
import { useState, useEffect } from 'react';
import { Card as CardType, PRIORITY_CONFIG, PRIORITY_ORDER } from '../types/kanban';
import { Dialog, DialogContent } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Save, Trash2, Check, Flag } from 'lucide-react';

interface CardDetailsDialogProps {
  card: CardType | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (cardId: string, updates: Partial<Pick<CardType, 'title' | 'description' | 'completed' | 'priority'>>) => void;
  onDelete: (cardId: string) => void;
}

export function CardDetailsDialog({
  card,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
}: CardDetailsDialogProps) {
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (card) {
      setEditTitle(card.title);
      setEditDescription(card.description || '');
      setHasChanges(false);
    }
  }, [card]);

  useEffect(() => {
    if (card) {
      const titleChanged = editTitle !== card.title;
      const descriptionChanged = editDescription !== (card.description || '');
      setHasChanges(titleChanged || descriptionChanged);
    }
  }, [editTitle, editDescription, card]);

  const handleSave = () => {
    if (card && hasChanges && editTitle.trim()) {
      onUpdate(card.id, {
        title: editTitle.trim(),
        description: editDescription.trim() || undefined,
      });
      setHasChanges(false);
    }
  };

  const handleClose = () => {
    setHasChanges(false);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSave();
    } else if (e.key === 'Escape') {
      handleClose();
    }
  };

  if (!card) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg sm:p-8">
        {/* 表单内容 */}
        <div className="space-y-6">
          {/* 标题 */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-600">
              标题
            </label>
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入任务标题"
              className="h-11 border-gray-300"
            />
          </div>

          {/* 描述 */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-600">
              描述
            </label>
            <Textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="添加详细描述..."
              className="min-h-[120px] resize-none border-gray-300"
            />
          </div>

          {/* 优先级 */}
          <div className="flex items-center gap-4 pt-2">
            <span className="text-sm font-medium text-gray-600">
              优先级
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded text-xs font-medium border focus:outline-none"
                  style={{
                    color: PRIORITY_CONFIG[card.priority || 'low'].textColor,
                    backgroundColor: PRIORITY_CONFIG[card.priority || 'low'].bgColor,
                    borderColor: PRIORITY_CONFIG[card.priority || 'low'].borderColor,
                  }}
                >
                  <Flag className="w-3 h-3" />
                  {PRIORITY_CONFIG[card.priority || 'low'].label}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-32">
                {PRIORITY_ORDER.map((priority) => {
                  const config = PRIORITY_CONFIG[priority];
                  const isSelected = (card.priority || 'low') === priority;
                  return (
                    <DropdownMenuItem
                      key={priority}
                      onClick={() => onUpdate(card.id, { priority })}
                      className="cursor-pointer flex items-center justify-between"
                    >
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs border"
                        style={{
                          color: config.textColor,
                          backgroundColor: config.bgColor,
                          borderColor: config.borderColor,
                        }}
                      >
                        {config.label}
                      </span>
                      {isSelected && <Check className="w-4 h-4 text-blue-500" />}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* 底部操作栏 */}
        <div className="flex items-center justify-between pt-6 mt-6 border-t border-gray-200">
          <button
            onClick={() => {
              onDelete(card.id);
              handleClose();
            }}
            className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-red-500 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            删除
          </button>

          <Button
            onClick={handleSave}
            disabled={!hasChanges || !editTitle.trim()}
            size="sm"
            className="gap-2 px-4"
          >
            <Save className="w-4 h-4" />
            保存
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
