import { useState, useCallback, useRef } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { Board, Card, Column, Activity, SearchFilters } from '../types/kanban';

// 根据项目ID生成不同的默认数据
const generateDefaultBoard = (projectId: string): Board => {
  const baseDate = new Date();
  
  // 不同项目的示例数据
  const projectData: Record<string, { columns: any[]; cards: any[] }> = {
    'personal-notes': {
      columns: [
        {
          id: `${projectId}-todo`,
          title: '待处理',
          position: 0,
          cardIds: [`${projectId}-card-1`, `${projectId}-card-2`],
          backgroundColor: 'orange',
          createdAt: baseDate,
          updatedAt: baseDate,
        },
        {
          id: `${projectId}-doing`,
          title: '进行中',
          position: 1,
          cardIds: [`${projectId}-card-3`],
          backgroundColor: 'blue',
          createdAt: baseDate,
          updatedAt: baseDate,
        },
        {
          id: `${projectId}-done`,
          title: '已完成',
          position: 2,
          cardIds: [],
          backgroundColor: 'green',
          createdAt: baseDate,
          updatedAt: baseDate,
        },
      ],
      cards: [
        {
          id: `${projectId}-card-1`,
          title: '整理桌面文件',
          description: '清理桌面上散乱的文件，分类整理',
          columnId: `${projectId}-todo`,
          position: 0,
          completed: false,
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        },
        {
          id: `${projectId}-card-2`,
          title: '制定本周计划',
          description: '规划本周的重要事项和目标',
          columnId: `${projectId}-todo`,
          position: 1,
          completed: false,
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        },
        {
          id: `${projectId}-card-3`,
          title: '准备会议材料',
          description: '为明天的会议准备相关资料',
          columnId: `${projectId}-doing`,
          position: 0,
          completed: false,
          createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
        },
      ]
    },
    'work-project': {
      columns: [
        {
          id: `${projectId}-backlog`,
          title: '需求池',
          position: 0,
          cardIds: [`${projectId}-card-1`, `${projectId}-card-2`],
          backgroundColor: 'gray',
          createdAt: baseDate,
          updatedAt: baseDate,
        },
        {
          id: `${projectId}-development`,
          title: '开发中',
          position: 1,
          cardIds: [`${projectId}-card-3`],
          backgroundColor: 'blue',
          createdAt: baseDate,
          updatedAt: baseDate,
        },
        {
          id: `${projectId}-testing`,
          title: '测试中',
          position: 2,
          cardIds: [`${projectId}-card-4`],
          backgroundColor: 'yellow',
          createdAt: baseDate,
          updatedAt: baseDate,
        },
        {
          id: `${projectId}-completed`,
          title: '已完成',
          position: 3,
          cardIds: [`${projectId}-card-5`],
          backgroundColor: 'green',
          createdAt: baseDate,
          updatedAt: baseDate,
        },
      ],
      cards: [
        {
          id: `${projectId}-card-1`,
          title: '用户登录功能',
          description: '实现用户注册、登录、忘记密码功能',
          columnId: `${projectId}-backlog`,
          position: 0,
          completed: false,
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        },
        {
          id: `${projectId}-card-2`,
          title: '数据库设计',
          description: '设计用户表和权限表结构',
          columnId: `${projectId}-backlog`,
          position: 1,
          completed: false,
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        },
        {
          id: `${projectId}-card-3`,
          title: 'API 接口开发',
          description: '开发用户管理相关的 REST API',
          columnId: `${projectId}-development`,
          position: 0,
          completed: false,
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
        },
        {
          id: `${projectId}-card-4`,
          title: '前端页面开发',
          description: '开发登录和注册页面',
          columnId: `${projectId}-testing`,
          position: 0,
          completed: false,
          createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        },
        {
          id: `${projectId}-card-5`,
          title: '项目初始化',
          description: '创建项目结构和基础配置',
          columnId: `${projectId}-completed`,
          position: 0,
          completed: true,
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        },
      ]
    },
    'learning': {
      columns: [
        {
          id: `${projectId}-todo`,
          title: '计划学习',
          position: 0,
          cardIds: [`${projectId}-card-1`, `${projectId}-card-2`],
          backgroundColor: 'purple',
          createdAt: baseDate,
          updatedAt: baseDate,
        },
        {
          id: `${projectId}-learning`,
          title: '学习中',
          position: 1,
          cardIds: [`${projectId}-card-3`],
          backgroundColor: 'blue',
          createdAt: baseDate,
          updatedAt: baseDate,
        },
        {
          id: `${projectId}-review`,
          title: '复习',
          position: 2,
          cardIds: [`${projectId}-card-4`],
          backgroundColor: 'orange',
          createdAt: baseDate,
          updatedAt: baseDate,
        },
        {
          id: `${projectId}-mastered`,
          title: '已掌握',
          position: 3,
          cardIds: [`${projectId}-card-5`],
          backgroundColor: 'green',
          createdAt: baseDate,
          updatedAt: baseDate,
        },
      ],
      cards: [
        {
          id: `${projectId}-card-1`,
          title: 'React Hooks 深入',
          description: '学习 useCallback, useMemo, useRef 等高级 Hooks',
          columnId: `${projectId}-todo`,
          position: 0,
          completed: false,
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        },
        {
          id: `${projectId}-card-2`,
          title: 'TypeScript 进阶',
          description: '学习泛型、装饰器、模块系统',
          columnId: `${projectId}-todo`,
          position: 1,
          completed: false,
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        },
        {
          id: `${projectId}-card-3`,
          title: 'Node.js 基础',
          description: '学习 Node.js 核心模块和 npm 包管理',
          columnId: `${projectId}-learning`,
          position: 0,
          completed: false,
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
        },
        {
          id: `${projectId}-card-4`,
          title: 'CSS Grid 布局',
          description: '复习 Grid 布局的各种应用场景',
          columnId: `${projectId}-review`,
          position: 0,
          completed: false,
          createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        },
        {
          id: `${projectId}-card-5`,
          title: 'JavaScript ES6+',
          description: '掌握了箭头函数、解构赋值、Promise 等特性',
          columnId: `${projectId}-mastered`,
          position: 0,
          completed: true,
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        },
      ]
    }
  };

  // 如果是已知的项目ID，返回对应的示例数据，否则返回空白看板
  const data = projectData[projectId] || {
    columns: [],
    cards: []
  };

  return {
    id: projectId,
    title: '我的看板',
    columns: data.columns,
    cards: data.cards,
    createdAt: baseDate,
    updatedAt: baseDate,
  };
};

export function useKanbanStore(projectId: string) {
  const [board, setBoard] = useLocalStorage<Board>(`kanban-board-${projectId}`, generateDefaultBoard(projectId));
  const [activities, setActivities] = useLocalStorage<Activity[]>(`kanban-activities-${projectId}`, []);
  
  // 防重复调用的缓存
  const lastMoveRef = useRef<string | null>(null);

  // 数据一致性修复函数
  const normalizeBoard = useCallback((board: Board): Board => {
    const normalizedColumns = board.columns.map(column => {
      // 根据实际卡片重新生成 cardIds
      const columnCards = board.cards
        .filter(card => card.columnId === column.id)
        .sort((a, b) => a.position - b.position);
      
      return {
        ...column,
        cardIds: columnCards.map(card => card.id),
      };
    });

    // 重新分配卡片位置，确保连续性
    const normalizedCards = board.cards.map(card => {
      const columnCards = board.cards
        .filter(c => c.columnId === card.columnId)
        .sort((a, b) => a.position - b.position);
      
      const newPosition = columnCards.findIndex(c => c.id === card.id);
      
      return {
        ...card,
        position: newPosition >= 0 ? newPosition : 0,
      };
    });

    return {
      ...board,
      columns: normalizedColumns,
      cards: normalizedCards,
    };
  }, []);
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
  }, [setActivities]);

  const createCard = useCallback((columnId: string, title: string, description?: string) => {
    const column = board.columns.find(col => col.id === columnId);
    if (!column) return;

    // 计算正确的位置：当前列中卡片的最大 position + 1
    const columnCards = board.cards.filter(card => card.columnId === columnId);
    const maxPosition = columnCards.length > 0 ? Math.max(...columnCards.map(card => card.position)) : -1;

    const newCard: Card = {
      id: crypto.randomUUID(),
      title,
      description,
      columnId,
      position: maxPosition + 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updatedColumn = {
      ...column,
      cardIds: [...column.cardIds, newCard.id],
      updatedAt: new Date(),
    };

    setBoard({
      ...board,
      columns: board.columns.map(col => col.id === columnId ? updatedColumn : col),
      cards: [...board.cards, newCard],
      updatedAt: new Date(),
    });

    addActivity({
      type: 'card_created',
      cardId: newCard.id,
      columnId,
      title: `创建了卡片"${title}"`,
    });
  }, [board, setBoard, addActivity]);

  const updateCard = useCallback((cardId: string, updates: Partial<Pick<Card, 'title' | 'description' | 'completed'>>) => {
    const card = board.cards.find(c => c.id === cardId);
    if (!card) return;

    const updatedCard = {
      ...card,
      ...updates,
      updatedAt: new Date(),
    };

    setBoard({
      ...board,
      cards: board.cards.map(c => c.id === cardId ? updatedCard : c),
      updatedAt: new Date(),
    });

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
  }, [board, setBoard, addActivity]);

  const deleteCard = useCallback((cardId: string) => {
    const card = board.cards.find(c => c.id === cardId);
    if (!card) return;

    const column = board.columns.find(col => col.id === card.columnId);
    if (!column) return;

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

    setBoard({
      ...board,
      columns: board.columns.map(col => col.id === card.columnId ? updatedColumn : col),
      cards: updatedCards,
      updatedAt: new Date(),
    });

    addActivity({
      type: 'card_deleted',
      cardId,
      columnId: card.columnId,
      title: `删除了卡片"${card.title}"`,
    });
  }, [board, setBoard, addActivity]);

  const moveCard = useCallback((cardId: string, fromColumnId: string, toColumnId: string, newPosition: number) => {
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
    
    // 批量获取所需数据，减少查找操作
    const card = board.cards.find(c => c.id === cardId);
    if (!card) {
      console.log('❌ Card not found:', cardId);
      return;
    }

    // 简化位置计算
    const targetColumnCards = board.cards.filter(c => c.columnId === toColumnId && c.id !== cardId);
    const finalPosition = Math.max(0, Math.min(newPosition, targetColumnCards.length));
    
    console.log(`📊 Position: target cards=${targetColumnCards.length}, requested=${newPosition}, final=${finalPosition}`);

    // 使用更高效的状态更新
    setBoard(prevBoard => {
      console.log(`📝 State update starting`);
      
      const updatedCards = prevBoard.cards.map(c => {
        if (c.id === cardId) {
          console.log(`🎯 Moving card ${cardId} to column ${toColumnId} position ${finalPosition}`);
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
          // 从源列移除
          return { ...col, cardIds: col.cardIds.filter(id => id !== cardId), updatedAt: new Date() };
        }
        if (col.id === toColumnId) {
          // 添加到目标列或更新同列位置
          const currentCardIds = col.cardIds.filter(id => id !== cardId);
          currentCardIds.splice(finalPosition, 0, cardId);
          return { ...col, cardIds: currentCardIds, updatedAt: new Date() };
        }
        return col;
      });

      const result = {
        ...prevBoard,
        columns: updatedColumns,
        cards: updatedCards,
        updatedAt: new Date(),
      };
      
      console.log(`✅ State updated - moved card:`, {
        cardId,
        newColumnId: toColumnId,
        newPosition: finalPosition,
        targetColumnCards: result.cards.filter(c => c.columnId === toColumnId).sort((a, b) => a.position - b.position).map(c => ({ id: c.id, position: c.position }))
      });
      
      return result;
    });

    // 异步记录活动，避免阻塞UI
    if (fromColumnId !== toColumnId) {
      setTimeout(() => {
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
      }, 0);
    }
    
    console.log(`🏁 moveCard END`);
  }, [board.cards, board.columns, setBoard, addActivity]);

  const createColumn = useCallback((title: string) => {
    const newColumn: Column = {
      id: crypto.randomUUID(),
      title,
      position: board.columns.length,
      cardIds: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setBoard({
      ...board,
      columns: [...board.columns, newColumn],
      updatedAt: new Date(),
    });

    addActivity({
      type: 'column_created',
      columnId: newColumn.id,
      title: `创建了列"${title}"`,
    });
  }, [board, setBoard, addActivity]);

  const updateColumn = useCallback((columnId: string, updates: { title?: string; backgroundColor?: string }) => {
    const column = board.columns.find(col => col.id === columnId);
    if (!column) return;

    const updatedColumn = {
      ...column,
      ...updates,
      updatedAt: new Date(),
    };

    setBoard({
      ...board,
      columns: board.columns.map(col => col.id === columnId ? updatedColumn : col),
      updatedAt: new Date(),
    });

    if (updates.title && updates.title !== column.title) {
      addActivity({
        type: 'column_updated',
        columnId,
        title: `重命名列为"${updates.title}"`,
      });
    }
  }, [board, setBoard, addActivity]);

  const deleteColumn = useCallback((columnId: string) => {
    const column = board.columns.find(col => col.id === columnId);
    if (!column) return;

    // Delete all cards in the column
    const cardsToDelete = board.cards.filter(card => card.columnId === columnId);
    
    setBoard({
      ...board,
      columns: board.columns.filter(col => col.id !== columnId),
      cards: board.cards.filter(card => card.columnId !== columnId),
      updatedAt: new Date(),
    });

    addActivity({
      type: 'column_deleted',
      columnId,
      title: `删除了列"${column.title}"${cardsToDelete.length > 0 ? `及其中的${cardsToDelete.length}张卡片` : ''}`,
    });
  }, [board, setBoard, addActivity]);

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
    const headers = ['标题', '描述', '列', '状态', '创建时间', '更新时间'];
    const rows = board.cards.map(card => {
      const column = board.columns.find(col => col.id === card.columnId);
      return [
        card.title,
        card.description || '',
        column?.title || '',
        card.completed ? '已完成' : '未完成',
        new Date(card.createdAt).toLocaleString('zh-CN'),
        new Date(card.updatedAt).toLocaleString('zh-CN'),
      ];
    });

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field.replace(/"/g, '""')}"`).join(','))
      .join('\n');

    return '\ufeff' + csvContent; // Add BOM for proper UTF-8 encoding
  }, [board]);

  // 提供重置数据的功能
  const resetBoard = useCallback(() => {
    setBoard(normalizeBoard(generateDefaultBoard(projectId)));
    setActivities([]);
  }, [setBoard, setActivities, normalizeBoard, projectId]);

  // 修复数据一致性
  const fixDataConsistency = useCallback(() => {
    setBoard(normalizeBoard(board));
  }, [board, setBoard, normalizeBoard]);

  return {
    board,
    activities,
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
    resetBoard,
    fixDataConsistency,
  };
}