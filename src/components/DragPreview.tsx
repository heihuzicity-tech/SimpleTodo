import { useDragLayer } from 'react-dnd';
import { Card } from './ui/card';
import { Checkbox } from './ui/checkbox';
import { memo } from 'react';

export const DragPreview = memo(function DragPreview() {
  const { itemType, isDragging, item, currentOffset } = useDragLayer((monitor) => ({
    item: monitor.getItem(),
    itemType: monitor.getItemType(),
    currentOffset: monitor.getClientOffset(),
    isDragging: monitor.isDragging(),
  }));

  if (!isDragging || itemType !== 'card' || !currentOffset) {
    return null;
  }

  const { x, y } = currentOffset;

  return (
    <div
      className="fixed pointer-events-none z-50 will-change-transform"
      style={{
        left: 0,
        top: 0,
        transform: `translate3d(${x + 12}px, ${y + 12}px, 0)`,
        width: '280px',
        backfaceVisibility: 'hidden',
      }}
    >
      <Card className="bg-white border shadow-lg overflow-hidden !rounded-md transform scale-95 opacity-95">
        <div className="flex">
          {/* Checkbox */}
          <div className="flex items-start justify-center px-2.5 py-2.5 pr-1.5">
            <Checkbox
              checked={false}
              disabled
              className="mt-0.5 flex-shrink-0 pointer-events-none"
            />
          </div>

          {/* Content */}
          <div className="flex-1 px-1.5 py-2.5 min-w-0">
            <div className="mb-1.5">
              <h4 className="leading-tight break-words">
                {item?.title || '移动中...'}
              </h4>
            </div>
            
            {item?.description && (
              <p className="text-sm mb-3 leading-relaxed break-words line-clamp-2 text-muted-foreground">
                {item.description}
              </p>
            )}

            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
              移动中...
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
});