export interface Card {
  id: string;
  title: string;
  description?: string;
  columnId: string;
  position: number;
  completed?: boolean;
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