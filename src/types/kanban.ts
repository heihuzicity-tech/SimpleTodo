// 优先级类型
export type Priority = 'low' | 'normal' | 'urgent' | 'critical';

// 优先级配置
export const PRIORITY_CONFIG: Record<Priority, {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
}> = {
  low: {
    label: '较低',
    color: 'text-gray-500',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-300',
  },
  normal: {
    label: '普通',
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-300',
  },
  urgent: {
    label: '紧急',
    color: 'text-orange-500',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-300',
  },
  critical: {
    label: '非常紧急',
    color: 'text-red-500',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-300',
  },
};

// 优先级顺序（用于排序和显示）
export const PRIORITY_ORDER: Priority[] = ['low', 'normal', 'urgent', 'critical'];

export interface Card {
  id: string;
  title: string;
  description?: string;
  columnId: string;
  position: number;
  completed?: boolean;
  priority?: Priority;
  createdAt: Date;
  updatedAt: Date;
}

export interface Column {
  id: string;
  title: string;
  position: number;
  cardIds: string[];
  backgroundColor?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Board {
  id: string;
  title: string;
  columns: Column[];
  cards: Card[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Activity {
  id: string;
  type: 'card_created' | 'card_updated' | 'card_moved' | 'card_deleted' | 'card_completed' | 'card_uncompleted' | 'column_created' | 'column_updated' | 'column_deleted';
  cardId?: string;
  columnId?: string;
  fromColumnId?: string;
  toColumnId?: string;
  title: string;
  description?: string;
  timestamp: Date;
}

export interface DragItem {
  type: 'card';
  id: string;
  columnId: string;
  position: number;
  title?: string;
  description?: string;
}

export interface SearchFilters {
  keyword: string;
  columnIds: string[];
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}