import { useState, useEffect } from 'react';
import { Card as CardType, PRIORITY_CONFIG, PRIORITY_ORDER } from '../types/kanban';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { ScrollArea } from './ui/scroll-area';
import { Checkbox } from './ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Save, X, Check, Flag } from 'lucide-react';

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
      <DialogContent className="max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col gap-0 p-0">
        <DialogHeader className="space-y-3 p-6 pb-4 border-b">
          <div className="space-y-1">
            <DialogTitle className="text-lg">任务详情</DialogTitle>
            <DialogDescription>
              编辑任务信息
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="space-y-6 p-6 pt-4">
              {/* Card Content */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">标题</label>
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="输入任务标题"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">描述</label>
                  <Textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="输入任务描述"
                    className="min-h-[100px] resize-none"
                  />
                </div>

                {/* 完成状态 - 水平布局 */}
                <div className="flex items-center">
                  <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground w-32 flex-shrink-0">
                    <Check className="w-4 h-4" />
                    状态
                  </label>
                  <div className="flex items-center space-x-2 ml-4">
                    <Checkbox
                      id="completed"
                      checked={card.completed || false}
                      onCheckedChange={(checked) => {
                        onUpdate(card.id, { completed: !!checked });
                      }}
                    />
                    <label
                      htmlFor="completed"
                      className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {card.completed ? '已完成' : '未完成'}
                    </label>
                  </div>
                </div>

                {/* 优先级选择 - 水平布局 */}
                <div className="flex items-center">
                  <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground w-32 flex-shrink-0">
                    <Flag className="w-4 h-4" />
                    优先级
                  </label>
                  <div className="ml-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                      <button
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded border text-sm transition-all duration-150 hover:shadow-sm"
                        style={{
                          color: PRIORITY_CONFIG[card.priority || 'low'].textColor,
                          backgroundColor: PRIORITY_CONFIG[card.priority || 'low'].bgColor,
                          borderColor: PRIORITY_CONFIG[card.priority || 'low'].borderColor,
                        }}
                      >
                        {PRIORITY_CONFIG[card.priority || 'low'].label}
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-40">
                      {PRIORITY_ORDER.map((priority) => {
                        const config = PRIORITY_CONFIG[priority];
                        const isSelected = (card.priority || 'low') === priority;
                        return (
                          <DropdownMenuItem
                            key={priority}
                            onClick={() => {
                              onUpdate(card.id, { priority });
                            }}
                            className="cursor-pointer flex items-center justify-between"
                          >
                            <span
                              className="px-2 py-0.5 rounded border text-xs"
                              style={{
                                color: config.textColor,
                                backgroundColor: config.bgColor,
                                borderColor: config.borderColor,
                              }}
                            >
                              {config.label}
                            </span>
                            {isSelected && <Check className="w-4 h-4 text-gray-500" />}
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between p-6 pt-4 border-t bg-muted/50">
          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              disabled={!hasChanges || !editTitle.trim()}
              size="sm"
              className="gap-2"
            >
              <Save className="w-4 h-4" />
              保存更改
            </Button>
            {hasChanges && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditTitle(card.title);
                  setEditDescription(card.description || '');
                }}
              >
                重置
              </Button>
            )}
          </div>

          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              onDelete(card.id);
              handleClose();
            }}
            className="gap-2"
          >
            <X className="w-4 h-4" />
            删除任务
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}