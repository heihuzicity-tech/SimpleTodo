import { useState, useCallback, useEffect, useRef } from 'react';
import { Board, Card, Column, Activity, SearchFilters, Priority } from '../types/kanban';
import { kanbanApi } from '../lib/api/kanban';

// 生成空白看板
const generateEmptyBoard = (projectId: string): Board => {
  const now = new Date();
  return {
    id: projectId,
    title: '我的看板',
    columns: [],
    cards: [],
    createdAt: now,
    updatedAt: now,
  };
};

export function useKanbanStore(projectId: string | null) {
  const [board, setBoard] = useState<Board>(generateEmptyBoard(projectId || ''));
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 防重复调用的缓存
  const lastMoveRef = useRef<string | null>(null);

  // 加载看板数据
  useEffect(() => {
    if (!projectId) {
      setBoard(generateEmptyBoard(''));
      setIsLoading(false);
      return;
    }

    const loadBoard = async () => {
      try {
        setIsLoading(true);
        const boardData = await kanbanApi.getBoard(projectId);
        setBoard(boardData);
      } catch (error) {
        console.error('Failed to load board:', error);
        // 如果加载失败，使用空白看板
        setBoard(generateEmptyBoard(projectId));
      } finally {
        setIsLoading(false);
      }
    };

    loadBoard();
  }, [projectId]);

  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    keyword: '',
    columnIds: [],
  });

  const addActivity = useCallback((activity: Omit<Activity, 'id' | 'timestamp'>) => {
    const newActivity: Activity = {
      ...activity,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    };
    setActivities(prev => [newActivity, ...prev.slice(0, 99)]); // Keep only recent 100 activities
  }, []);

  const createCard = useCallback(async (columnId: string, title: string, description?: string) => {
    if (!projectId) return;

    const column = board.columns.find(col => col.id === columnId);
    if (!column) return;

    // 计算正确的位置
    const columnCards = board.cards.filter(card => card.columnId === columnId);
    const maxPosition = columnCards.length > 0 ? Math.max(...columnCards.map(card => card.position)) : -1;

    try {
      const newCard = await kanbanApi.createCard(projectId, {
        title,
        description,
        columnId,
        position: maxPosition + 1,
        priority: 'low' as Priority,
        startDate: new Date(),
      });

      const updatedColumn = {
        ...column,
        cardIds: [...column.cardIds, newCard.id],
        updatedAt: new Date(),
      };

      setBoard(prev => ({
        ...prev,
        columns: prev.columns.map(col => col.id === columnId ? updatedColumn : col),
        cards: [...prev.cards, newCard],
        updatedAt: new Date(),
      }));

      addActivity({
        type: 'card_created',
        cardId: newCard.id,
        columnId,
        title: `创建了卡片"${title}"`,
      });
    } catch (error) {
      console.error('Failed to create card:', error);
    }
  }, [projectId, board, addActivity]);

  const updateCard = useCallback(async (cardId: string, updates: Partial<Pick<Card, 'title' | 'description' | 'completed' | 'priority' | 'startDate' | 'dueDate'>>) => {
    if (!projectId) return;

    const card = board.cards.find(c => c.id === cardId);
    if (!card) return;

    const updatedCard: Card = {
      ...card,
      ...updates,
      updatedAt: new Date(),
    };

    try {
      await kanbanApi.updateCard(projectId, updatedCard);

      setBoard(prev => ({
        ...prev,
        cards: prev.cards.map(c => c.id === cardId ? updatedCard : c),
        updatedAt: new Date(),
      }));

      // 添加不同类型的活动记录
      if ('completed' in updates) {
        addActivity({
          type: updates.completed ? 'card_completed' : 'card_uncompleted',
          cardId,
          columnId: card.columnId,
          title: updates.completed ? `完成了卡片"${updatedCard.title}"` : `取消完成卡片"${updatedCard.title}"`,
        });
      } else {
        addActivity({
          type: 'card_updated',
          cardId,
          columnId: card.columnId,
          title: `更新了卡片"${updatedCard.title}"`,
        });
      }
    } catch (error) {
      console.error('Failed to update card:', error);
    }
  }, [projectId, board, addActivity]);

  const deleteCard = useCallback(async (cardId: string) => {
    if (!projectId) return;

    const card = board.cards.find(c => c.id === cardId);
    if (!card) return;

    const column = board.columns.find(col => col.id === card.columnId);
    if (!column) return;

    try {
      await kanbanApi.deleteCard(projectId, cardId);

      const updatedColumn = {
        ...column,
        cardIds: column.cardIds.filter(id => id !== cardId),
        updatedAt: new Date(),
      };

      // 重新计算剩余卡片的位置
      const updatedCards = board.cards.filter(c => c.id !== cardId);
      const columnCards = updatedCards.filter(c => c.columnId === card.columnId);

      // 重新分配该列中剩余卡片的位置
      columnCards
        .sort((a, b) => a.position - b.position)
        .forEach((c, index) => {
          const cardIndex = updatedCards.findIndex(uc => uc.id === c.id);
          if (cardIndex !== -1) {
            updatedCards[cardIndex] = {
              ...updatedCards[cardIndex],
              position: index,
              updatedAt: new Date(),
            };
          }
        });

      setBoard(prev => ({
        ...prev,
        columns: prev.columns.map(col => col.id === card.columnId ? updatedColumn : col),
        cards: updatedCards,
        updatedAt: new Date(),
      }));

      addActivity({
        type: 'card_deleted',
        cardId,
        columnId: card.columnId,
        title: `删除了卡片"${card.title}"`,
      });
    } catch (error) {
      console.error('Failed to delete card:', error);
    }
  }, [projectId, board, addActivity]);

  const moveCard = useCallback(async (cardId: string, fromColumnId: string, toColumnId: string, newPosition: number) => {
    if (!projectId) return;

    // 防重复调用检查
    const moveKey = `${cardId}-${fromColumnId}-${toColumnId}-${newPosition}`;
    if (lastMoveRef.current === moveKey) {
      console.log(`🚫 Duplicate move call ignored: ${moveKey}`);
      return;
    }
    lastMoveRef.current = moveKey;

    // 清除重复检查（200ms后允许相同操作）
    setTimeout(() => {
      if (lastMoveRef.current === moveKey) {
        lastMoveRef.current = null;
      }
    }, 200);

    console.log(`🚀 moveCard START: ${cardId} from ${fromColumnId} to ${toColumnId} at position ${newPosition}`);

    const card = board.cards.find(c => c.id === cardId);
    if (!card) {
      console.log('❌ Card not found:', cardId);
      return;
    }

    // 简化位置计算
    const targetColumnCards = board.cards.filter(c => c.columnId === toColumnId && c.id !== cardId);
    const finalPosition = Math.max(0, Math.min(newPosition, targetColumnCards.length));

    // 保存旧状态用于回滚
    const previousBoard = board;

    // 🚀 乐观更新：立即更新本地状态，让 UI 即时响应
    setBoard(prevBoard => {
      const updatedCards = prevBoard.cards.map(c => {
        if (c.id === cardId) {
          return { ...c, columnId: toColumnId, position: finalPosition, updatedAt: new Date() };
        }

        // 处理目标列中的其他卡片位置调整
        if (c.columnId === toColumnId && c.id !== cardId) {
          if (fromColumnId === toColumnId) {
            // 同列内移动
            if (card.position < finalPosition && c.position > card.position && c.position <= finalPosition) {
              return { ...c, position: c.position - 1, updatedAt: new Date() };
            }
            if (card.position > finalPosition && c.position >= finalPosition && c.position < card.position) {
              return { ...c, position: c.position + 1, updatedAt: new Date() };
            }
          } else {
            // 跨列移动，目标列中位置 >= finalPosition 的卡片后移
            if (c.position >= finalPosition) {
              return { ...c, position: c.position + 1, updatedAt: new Date() };
            }
          }
        }

        // 处理源列中的卡片位置调整（仅在跨列移动时）
        if (fromColumnId !== toColumnId && c.columnId === fromColumnId && c.position > card.position) {
          return { ...c, position: c.position - 1, updatedAt: new Date() };
        }

        return c;
      });

      // 更新列的 cardIds
      const updatedColumns = prevBoard.columns.map(col => {
        if (col.id === fromColumnId && fromColumnId !== toColumnId) {
          return { ...col, cardIds: col.cardIds.filter(id => id !== cardId), updatedAt: new Date() };
        }
        if (col.id === toColumnId) {
          const currentCardIds = col.cardIds.filter(id => id !== cardId);
          currentCardIds.splice(finalPosition, 0, cardId);
          return { ...col, cardIds: currentCardIds, updatedAt: new Date() };
        }
        return col;
      });

      return {
        ...prevBoard,
        columns: updatedColumns,
        cards: updatedCards,
        updatedAt: new Date(),
      };
    });

    // 记录活动
    if (fromColumnId !== toColumnId) {
      const fromColumn = board.columns.find(col => col.id === fromColumnId);
      const toColumn = board.columns.find(col => col.id === toColumnId);
      if (fromColumn && toColumn) {
        addActivity({
          type: 'card_moved',
          cardId,
          fromColumnId,
          toColumnId,
          title: `将卡片"${card.title}"从"${fromColumn.title}"移动到"${toColumn.title}"`,
        });
      }
    }

    try {
      // 后台调用 API 持久化
      await kanbanApi.moveCard(projectId, {
        cardId,
        fromColumnId,
        toColumnId,
        newPosition: finalPosition,
      });
    } catch (error) {
      console.error('Failed to move card:', error);
      // API 失败时回滚到之前的状态
      setBoard(previousBoard);
    }
  }, [projectId, board, addActivity]);

  const createColumn = useCallback(async (title: string) => {
    if (!projectId) return;

    try {
      const newColumn = await kanbanApi.createColumn(projectId, {
        title,
        position: board.columns.length,
      });

      setBoard(prev => ({
        ...prev,
        columns: [...prev.columns, newColumn],
        updatedAt: new Date(),
      }));

      addActivity({
        type: 'column_created',
        columnId: newColumn.id,
        title: `创建了列"${title}"`,
      });
    } catch (error) {
      console.error('Failed to create column:', error);
    }
  }, [projectId, board, addActivity]);

  const updateColumn = useCallback(async (columnId: string, updates: { title?: string; backgroundColor?: string }) => {
    if (!projectId) return;

    const column = board.columns.find(col => col.id === columnId);
    if (!column) return;

    const updatedColumn: Column = {
      ...column,
      ...updates,
      updatedAt: new Date(),
    };

    try {
      await kanbanApi.updateColumn(projectId, updatedColumn);

      setBoard(prev => ({
        ...prev,
        columns: prev.columns.map(col => col.id === columnId ? updatedColumn : col),
        updatedAt: new Date(),
      }));

      if (updates.title && updates.title !== column.title) {
        addActivity({
          type: 'column_updated',
          columnId,
          title: `重命名列为"${updates.title}"`,
        });
      }
    } catch (error) {
      console.error('Failed to update column:', error);
    }
  }, [projectId, board, addActivity]);

  const deleteColumn = useCallback(async (columnId: string) => {
    if (!projectId) return;

    const column = board.columns.find(col => col.id === columnId);
    if (!column) return;

    // Delete all cards in the column
    const cardsToDelete = board.cards.filter(card => card.columnId === columnId);

    try {
      await kanbanApi.deleteColumn(projectId, columnId);

      setBoard(prev => ({
        ...prev,
        columns: prev.columns.filter(col => col.id !== columnId),
        cards: prev.cards.filter(card => card.columnId !== columnId),
        updatedAt: new Date(),
      }));

      addActivity({
        type: 'column_deleted',
        columnId,
        title: `删除了列"${column.title}"${cardsToDelete.length > 0 ? `及其中的${cardsToDelete.length}张卡片` : ''}`,
      });
    } catch (error) {
      console.error('Failed to delete column:', error);
    }
  }, [projectId, board, addActivity]);

  const getFilteredCards = useCallback(() => {
    let filteredCards = board.cards;

    // Filter by keyword
    if (searchFilters.keyword) {
      const keyword = searchFilters.keyword.toLowerCase();
      filteredCards = filteredCards.filter(card =>
        card.title.toLowerCase().includes(keyword) ||
        (card.description?.toLowerCase().includes(keyword) ?? false)
      );
    }

    // Filter by columns
    if (searchFilters.columnIds.length > 0) {
      filteredCards = filteredCards.filter(card =>
        searchFilters.columnIds.includes(card.columnId)
      );
    }

    return filteredCards;
  }, [board.cards, searchFilters]);

  const exportToJSON = useCallback(() => {
    const data = {
      board,
      activities,
      exportedAt: new Date().toISOString(),
    };
    return JSON.stringify(data, null, 2);
  }, [board, activities]);

  const exportToCSV = useCallback(() => {
    const headers = ['标题', '描述', '列', '状态', '优先级', '开始时间', '截止时间', '创建时间', '更新时间'];
    const rows = board.cards.map(card => {
      const column = board.columns.find(col => col.id === card.columnId);
      return [
        card.title,
        card.description || '',
        column?.title || '',
        card.completed ? '已完成' : '未完成',
        card.priority || '',
        card.startDate ? new Date(card.startDate).toLocaleString('zh-CN') : '',
        card.dueDate ? new Date(card.dueDate).toLocaleString('zh-CN') : '',
        new Date(card.createdAt).toLocaleString('zh-CN'),
        new Date(card.updatedAt).toLocaleString('zh-CN'),
      ];
    });

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    return '\ufeff' + csvContent; // Add BOM for proper UTF-8 encoding
  }, [board]);

  // 重新加载看板数据
  const reloadBoard = useCallback(async () => {
    if (!projectId) return;

    try {
      setIsLoading(true);
      const boardData = await kanbanApi.getBoard(projectId);
      setBoard(boardData);
    } catch (error) {
      console.error('Failed to reload board:', error);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  return {
    board,
    activities,
    isLoading,
    searchFilters,
    setSearchFilters,
    createCard,
    updateCard,
    deleteCard,
    moveCard,
    createColumn,
    updateColumn,
    deleteColumn,
    getFilteredCards,
    exportToJSON,
    exportToCSV,
    reloadBoard,
  };
}
