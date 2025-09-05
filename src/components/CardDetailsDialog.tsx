import { useState, useEffect } from 'react';
import { Card as CardType, Activity } from '../types/kanban';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Checkbox } from './ui/checkbox';
import { Save, X, Clock, Activity as ActivityIcon, Check } from 'lucide-react';

interface CardDetailsDialogProps {
  card: CardType | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (cardId: string, updates: Partial<Pick<CardType, 'title' | 'description' | 'completed'>>) => void;
  onDelete: (cardId: string) => void;
  activities: Activity[];
  columnTitle: string;
}

export function CardDetailsDialog({
  card,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  activities,
  columnTitle,
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

  // Filter activities for this card
  const cardActivities = card
    ? activities.filter(activity => activity.cardId === card.id)
    : [];

  if (!card) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col gap-0 p-0">
        <DialogHeader className="space-y-3 p-6 pb-4 border-b">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <DialogTitle className="text-lg">任务详情</DialogTitle>
              <DialogDescription>
                编辑任务信息并查看活动记录
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{columnTitle}</Badge>
              <div className={`
                inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs border transition-colors duration-200
                ${card.completed 
                  ? 'bg-green-50 text-green-700 border-green-200' 
                  : 'bg-blue-50 text-blue-700 border-blue-200'
                }
              `}>
                {card.completed ? (
                  <>
                    <Check className="w-3 h-3" />
                    已完成
                  </>
                ) : (
                  <>
                    <Clock className="w-3 h-3" />
                    未完成
                  </>
                )}
              </div>
            </div>
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

                <div className="space-y-2">
                  <label className="text-sm font-medium">完成状态</label>
                  <div className="flex items-center space-x-2">
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
                      标记为已完成
                    </label>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Card Metadata */}
              <div className="space-y-3">
                <h4 className="flex items-center gap-2 text-sm font-medium">
                  <Clock className="w-4 h-4" />
                  时间信息
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">创建时间</span>
                    <div className="text-xs">{new Date(card.createdAt).toLocaleString('zh-CN')}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">更新时间</span>
                    <div className="text-xs">{new Date(card.updatedAt).toLocaleString('zh-CN')}</div>
                  </div>
                </div>
              </div>

              {cardActivities.length > 0 && (
                <>
                  <Separator />

                  {/* Activity Log */}
                  <div className="space-y-3">
                    <h4 className="flex items-center gap-2 text-sm font-medium">
                      <ActivityIcon className="w-4 h-4" />
                      最近活动
                    </h4>
                    
                    <div className="space-y-2">
                      {cardActivities.slice(0, 3).map((activity) => (
                        <div
                          key={activity.id}
                          className="flex gap-2 p-2 bg-muted/30 rounded text-sm"
                        >
                          <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm">{activity.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(activity.timestamp).toLocaleString('zh-CN')}
                            </p>
                          </div>
                        </div>
                      ))}
                      {cardActivities.length > 3 && (
                        <p className="text-xs text-muted-foreground text-center">
                          还有 {cardActivities.length - 3} 条活动记录
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}
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