import { useState, useRef, useEffect } from 'react';
import { useDrop } from 'react-dnd';
import { DragItem } from '../types/kanban';

interface CardDropZoneProps {
  columnId: string;
  position: number;
  onDrop: (item: DragItem, columnId: string, position: number) => void;
  isFirst?: boolean;
  isLast?: boolean;
}

export function CardDropZone({ columnId, position, onDrop, isFirst, isLast }: CardDropZoneProps) {
  const [isActive, setIsActive] = useState(false);
  const stableTimeoutRef = useRef<NodeJS.Timeout>();

  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: 'card',
    drop: (item: DragItem, monitor) => {
      // 只有在当前 drop zone 上直接放置时才处理
      if (monitor.isOver({ shallow: true }) && !monitor.didDrop()) {
        console.log(`🎯 DROP: Card ${item.id} -> Column ${columnId} Position ${position}`);
        onDrop(item, columnId, position);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true }),
      canDrop: monitor.canDrop(),
    }),
    hover: (item, monitor) => {
      // 优化的激活机制，减少不必要的状态更新
      if (monitor.isOver({ shallow: true }) && monitor.canDrop() && !isActive) {
        if (stableTimeoutRef.current) {
          clearTimeout(stableTimeoutRef.current);
        }
        stableTimeoutRef.current = setTimeout(() => {
          setIsActive(true);
        }, 30); // 减少到30ms，提高响应性
      }
    },
  }), [columnId, position, onDrop]);

  // 当不再悬停时立即重置状态
  useEffect(() => {
    if (!isOver || !canDrop) {
      if (stableTimeoutRef.current) {
        clearTimeout(stableTimeoutRef.current);
      }
      setIsActive(false);
    }
    
    return () => {
      if (stableTimeoutRef.current) {
        clearTimeout(stableTimeoutRef.current);
      }
    };
  }, [isOver, canDrop]);

  // 为第一个放置区域提供更大的基础高度
  const getBaseHeight = () => {
    if (isFirst) return 'h-3'; // 12px，比之前的4px大
    if (isLast) return 'h-2';  // 8px
    return 'h-1.5'; // 6px，中间区域保持不变
  };

  const baseHeight = getBaseHeight();

  return (
    <div
      ref={drop}
      className={`
        transition-all duration-150 ease-out
        ${isActive ? 'h-6 my-0.5' : baseHeight}
        ${isActive ? 'opacity-100' : 'opacity-0'}
        -mx-1.5 px-1.5 relative
      `}
      style={{ 
        contain: 'layout style',
        backfaceVisibility: 'hidden',
        transform: 'translateZ(0)',
        willChange: isActive ? 'height, margin, opacity' : 'auto',
      }}
    >
      {isActive && (
        <div className="w-full h-full bg-primary/15 border-2 border-dashed border-primary/60 rounded-md flex items-center justify-center animate-in fade-in-50 duration-100">
          <div className="text-xs text-primary/80 font-medium">
            {isFirst ? '放置到顶部' : isLast ? '放置到底部' : '在此处放置'}
          </div>
        </div>
      )}
    </div>
  );
}