import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface QuickAddCardProps {
  onAdd: (title: string, description?: string) => void;
  placeholder?: string;
  instanceId?: string;
}

export function QuickAddCard({ onAdd, placeholder = "输入卡片标题...", instanceId }: QuickAddCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = () => {
    if (title.trim()) {
      onAdd(title.trim(), description.trim() || undefined);
      setTitle('');
      setDescription('');
      setIsExpanded(false);
    }
  };

  const handleCancel = () => {
    setTitle('');
    setDescription('');
    setIsExpanded(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSubmit();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (!isExpanded) {
    return (
      <motion.div
        key={`collapsed-${instanceId}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
      >
        <Button
          variant="ghost"
          className="w-full h-auto p-2 justify-start text-muted-foreground border-2 border-dashed border-border hover:border-primary/30 transition-colors"
          onClick={() => setIsExpanded(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          {placeholder}
        </Button>
      </motion.div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`expanded-${instanceId}`}
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ 
          duration: 0.2,
          ease: [0.2, 0.8, 0.2, 1],
        }}
        className="bg-white border border-border rounded-lg p-2.5 shadow-sm w-full max-w-full overflow-hidden"
      >
        <div className="space-y-2.5 w-full max-w-full">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="卡片标题"
            className="w-full max-w-full"
            style={{ width: '100%', maxWidth: '100%' }}
            autoFocus
          />
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="描述（可选）"
            className="min-h-[50px] resize-none w-full max-w-full"
            style={{ width: '100%', maxWidth: '100%' }}
          />
          <div className="flex gap-2 w-full max-w-full">
            <Button 
              size="sm" 
              onClick={handleSubmit}
              disabled={!title.trim()}
            >
              添加卡片
            </Button>
            <Button 
              size="sm" 
              variant="ghost"
              onClick={handleCancel}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}