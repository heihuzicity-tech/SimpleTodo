import { useDragLayer } from 'react-dnd';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from './ui/card';
import { Checkbox } from './ui/checkbox';
import { GripVertical } from 'lucide-react';
import { memo, useRef, useEffect, useState } from 'react';
import { dragPreviewVariants } from '../lib/animations';

export const DragPreview = memo(function DragPreview() {
  const { itemType, isDragging, item, currentOffset, initialOffset } = useDragLayer((monitor) => ({
    item: monitor.getItem(),
    itemType: monitor.getItemType(),
    currentOffset: monitor.getClientOffset(),
    initialOffset: monitor.getInitialClientOffset(),
    isDragging: monitor.isDragging(),
  }));

  // 平滑插值位置
  const [smoothOffset, setSmoothOffset] = useState({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);
  const targetOffset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (currentOffset) {
      targetOffset.current = { x: currentOffset.x, y: currentOffset.y };
    }
  }, [currentOffset]);

  useEffect(() => {
    if (!isDragging) {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      return;
    }

    const animate = () => {
      setSmoothOffset(prev => ({
        x: prev.x + (targetOffset.current.x - prev.x) * 0.3,
        y: prev.y + (targetOffset.current.y - prev.y) * 0.3,
      }));
      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [isDragging]);

  // 初始化位置
  useEffect(() => {
    if (initialOffset && isDragging) {
      setSmoothOffset({ x: initialOffset.x, y: initialOffset.y });
      targetOffset.current = { x: initialOffset.x, y: initialOffset.y };
    }
  }, [initialOffset, isDragging]);

  if (!isDragging || itemType !== 'card' || !currentOffset) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed pointer-events-none z-[9999]"
        style={{
          left: 0,
          top: 0,
          transform: `translate3d(${smoothOffset.x - 140}px, ${smoothOffset.y - 30}px, 0)`,
          width: '280px',
        }}
        variants={dragPreviewVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <motion.div
          animate={{
            rotate: [0, 1.5, -1, 0.5, 0],
            scale: [1, 1.02, 1.01, 1],
          }}
          transition={{
            duration: 0.4,
            ease: 'easeOut',
          }}
        >
          <Card className="bg-white/95 backdrop-blur-sm border-2 border-primary/30 shadow-2xl overflow-hidden rounded-lg">
            {/* 顶部拖拽指示条 */}
            <div className="h-1 bg-gradient-to-r from-primary/50 via-primary to-primary/50" />

            <div className="flex p-3">
              {/* 拖拽图标 */}
              <div className="flex items-center justify-center w-6 mr-2">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  <GripVertical className="w-4 h-4 text-primary/60" />
                </motion.div>
              </div>

              {/* Checkbox */}
              <div className="flex items-start justify-center px-2">
                <Checkbox
                  checked={false}
                  disabled
                  className="mt-0.5 flex-shrink-0 pointer-events-none opacity-50"
                />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="mb-1.5">
                  <h4 className="leading-tight break-words font-medium text-foreground">
                    {item?.title || '移动中...'}
                  </h4>
                </div>

                {item?.description && (
                  <p className="text-sm leading-relaxed break-words line-clamp-1 text-muted-foreground">
                    {item.description}
                  </p>
                )}

                <div className="flex items-center gap-2 mt-2">
                  <motion.span
                    className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-primary/10 text-primary"
                    animate={{ opacity: [0.7, 1, 0.7] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    ↕ 拖拽中...
                  </motion.span>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
});
