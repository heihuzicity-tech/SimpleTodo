# ZeTodo 桌面应用重构计划

> 分支: `feature/tauri-desktop-refactor`
> 创建日期: 2025-01-25
> 参考项目: [cc-switch](https://github.com/farion1231/cc-switch)

---

## 📋 目录

1. [项目概述](#1-项目概述)
2. [当前架构分析](#2-当前架构分析)
3. [目标架构设计](#3-目标架构设计)
4. [重构阶段规划](#4-重构阶段规划)
5. [详细任务清单](#5-详细任务清单)
6. [文件变更清单](#6-文件变更清单)
7. [风险评估与应对](#7-风险评估与应对)

---

## 1. 项目概述

### 1.1 重构目标

将 ZeTodo 从纯 Web 应用重构为 **Tauri 跨平台桌面应用**，并对齐 cc-switch 的:
- ✅ 四层分离架构 (UI → Hooks → Query → API)
- ✅ 设计系统 (macOS 风格 + Glassmorphism + 微交互动画)
- ✅ 数据持久化 (LocalStorage → SQLite)
- ✅ 状态管理 (TanStack Query)

### 1.2 预期成果

| 功能 | 当前 | 目标 |
|------|------|------|
| 运行环境 | 浏览器 | Windows/macOS/Linux 桌面 |
| 数据存储 | LocalStorage | SQLite + JSON |
| 状态管理 | Custom Hooks | TanStack Query |
| 拖拽库 | react-dnd | @dnd-kit (可选) |
| 动画 | 基础 CSS | Framer Motion |
| 主题 | 固定 | Light/Dark/System |
| 系统集成 | 无 | 托盘图标、全局快捷键 |

### 1.3 技术栈对比

| 技术 | 当前 | 目标 |
|------|------|------|
| 桌面框架 | - | Tauri 2.x |
| 后端语言 | - | Rust |
| 前端框架 | React 18.3.1 | React 18.3.1 (保持) |
| 类型系统 | TypeScript | TypeScript (保持) |
| 构建工具 | Vite | Vite (保持) |
| UI 组件 | Radix UI | Radix UI + shadcn/ui (增强) |
| 样式 | Tailwind CSS | Tailwind CSS (保持) |
| 状态管理 | useLocalStorage | TanStack Query v5 |
| 数据验证 | - | Zod |
| 拖拽 | react-dnd | @dnd-kit (可选升级) |
| 动画 | - | Framer Motion |
| 国际化 | - | react-i18next (可选) |

---

## 2. 当前架构分析

### 2.1 目录结构

```
src/
├── App.tsx                    # 主应用 (207行)
├── main.tsx                   # 入口
├── index.css                  # 全局样式
├── components/                # UI 组件 (18个业务组件 + 48个UI组件)
│   ├── KanbanColumn.tsx       # 看板列
│   ├── KanbanCard*.tsx        # 卡片组件 (3个版本)
│   ├── ProjectSelector.tsx    # 项目选择
│   ├── CardDetailsDialog.tsx  # 卡片详情
│   └── ui/                    # shadcn/ui 基础组件
├── hooks/                     # 自定义 Hooks (5个)
│   ├── useKanbanStore.ts      # 看板状态 (718行) ⚠️ 过大
│   ├── useProjectStore.ts     # 项目状态
│   ├── useLocalStorage.ts     # 本地存储
│   ├── useAutoScroll.ts       # 自动滚动
│   └── useThrottle.ts         # 节流
└── types/
    └── kanban.ts              # 类型定义 (63行)
```

### 2.2 当前数据模型

```typescript
// types/kanban.ts
interface Card {
  id: string;
  title: string;
  description?: string;
  columnId: string;
  position: number;
  completed?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface Column {
  id: string;
  title: string;
  position: number;
  cardIds: string[];
  backgroundColor?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Board {
  id: string;
  title: string;
  columns: Column[];
  cards: Card[];
  createdAt: Date;
  updatedAt: Date;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Activity {
  id: string;
  type: 'card_created' | 'card_updated' | 'card_moved' | ...;
  cardId?: string;
  columnId?: string;
  title: string;
  timestamp: Date;
}
```

### 2.3 存在的问题

| 问题 | 描述 | 影响 |
|------|------|------|
| 🔴 Hook 过大 | `useKanbanStore.ts` 718行，职责过重 | 难以维护、测试困难 |
| 🔴 无 API 层 | 直接操作 LocalStorage | 无法迁移到 SQLite |
| 🟡 无缓存策略 | 每次操作直接写入 | 性能问题 |
| 🟡 无类型验证 | 运行时无数据验证 | 数据一致性风险 |
| 🟡 动画简陋 | 仅基础 CSS transition | 用户体验一般 |
| 🟢 组件化良好 | 组件拆分合理 | 迁移成本低 |

---

## 3. 目标架构设计

### 3.1 四层分离架构

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           App.tsx (主入口)                               │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐  │
│  │ ProjectSwitcher │  │  KanbanBoard    │  │  SettingsDialog         │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         Hooks 层 (业务逻辑)                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐  │
│  │ useKanbanActions│  │ useProjectActions│ │ useSettings             │  │
│  │ (卡片/列操作)    │  │  (项目操作)      │  │ (设置管理)              │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    TanStack Query 层 (状态缓存与同步)                     │
│  ┌──────────────────────────┐  ┌────────────────────────────────────┐   │
│  │ queries.ts               │  │ mutations.ts                       │   │
│  │ - useBoardQuery          │  │ - useCreateCardMutation            │   │
│  │ - useProjectsQuery       │  │ - useMoveCardMutation              │   │
│  │ - useActivitiesQuery     │  │ - useCreateColumnMutation          │   │
│  └──────────────────────────┘  └────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         API 封装层 (Tauri IPC)                           │
│  ┌───────────────┐  ┌────────────────┐  ┌────────────────────────────┐  │
│  │ kanban.ts     │  │ projects.ts    │  │ settings.ts                │  │
│  │ invoke("xxx") │  │ invoke("xxx")  │  │ invoke("xxx")              │  │
│  └───────────────┘  └────────────────┘  └────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         Tauri Rust 后端                                  │
│  ┌───────────────┐  ┌────────────────┐  ┌────────────────────────────┐  │
│  │ commands/     │  │ services/      │  │ db/                        │  │
│  │ (API 入口)    │  │ (业务逻辑)      │  │ (SQLite)                   │  │
│  └───────────────┘  └────────────────┘  └────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.2 目标目录结构

```
zetodo/
├── src/                           # 前端 (React + TypeScript)
│   ├── App.tsx                    # 主应用
│   ├── main.tsx                   # 入口
│   ├── index.css                  # 全局样式 (升级 CSS 变量)
│   │
│   ├── components/                # UI 组件
│   │   ├── ui/                    # 基础组件 (保持)
│   │   ├── kanban/                # 🆕 看板相关组件
│   │   │   ├── KanbanBoard.tsx
│   │   │   ├── KanbanColumn.tsx
│   │   │   ├── KanbanCard.tsx
│   │   │   └── CardDetailsDialog.tsx
│   │   ├── projects/              # 🆕 项目相关组件
│   │   │   ├── ProjectSelector.tsx
│   │   │   └── ProjectDialog.tsx
│   │   ├── settings/              # 🆕 设置相关组件
│   │   │   ├── SettingsDialog.tsx
│   │   │   └── ThemeSettings.tsx
│   │   └── common/                # 🆕 通用组件
│   │       ├── EmptyState.tsx
│   │       └── ConfirmDialog.tsx
│   │
│   ├── hooks/                     # 自定义 Hooks (拆分)
│   │   ├── useKanbanActions.ts    # 🆕 看板操作 (从 useKanbanStore 拆分)
│   │   ├── useProjectActions.ts   # 🆕 项目操作 (从 useProjectStore 拆分)
│   │   ├── useDragSort.ts         # 🆕 拖拽排序
│   │   ├── useAutoScroll.ts       # 保持
│   │   └── useTheme.ts            # 🆕 主题管理
│   │
│   ├── lib/                       # 🆕 工具库
│   │   ├── api/                   # 🆕 Tauri API 封装
│   │   │   ├── index.ts
│   │   │   ├── kanban.ts
│   │   │   ├── projects.ts
│   │   │   └── settings.ts
│   │   ├── query/                 # 🆕 TanStack Query
│   │   │   ├── queryClient.ts
│   │   │   ├── queries.ts
│   │   │   └── mutations.ts
│   │   ├── schemas/               # 🆕 Zod 验证
│   │   │   └── kanban.ts
│   │   └── utils.ts               # 🆕 工具函数 (cn 等)
│   │
│   ├── contexts/                  # 🆕 React Context
│   │   └── ThemeContext.tsx
│   │
│   ├── types/                     # 类型定义 (扩展)
│   │   ├── kanban.ts
│   │   ├── project.ts             # 🆕
│   │   └── settings.ts            # 🆕
│   │
│   └── styles/                    # 样式文件
│       └── globals.css
│
├── src-tauri/                     # 🆕 Rust 后端
│   ├── src/
│   │   ├── main.rs                # 入口
│   │   ├── lib.rs                 # 库入口
│   │   ├── commands/              # Tauri 命令
│   │   │   ├── mod.rs
│   │   │   ├── kanban.rs
│   │   │   ├── projects.rs
│   │   │   └── settings.rs
│   │   ├── services/              # 业务逻辑
│   │   │   ├── mod.rs
│   │   │   ├── kanban.rs
│   │   │   └── projects.rs
│   │   ├── db/                    # 数据库
│   │   │   ├── mod.rs
│   │   │   ├── schema.rs
│   │   │   └── migrations/
│   │   └── models/                # 数据模型
│   │       └── mod.rs
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   └── icons/
│
├── docs/                          # 文档
│   ├── cc-switch-frontend-analysis.md
│   ├── cc-switch-design-system.json
│   └── REFACTOR_PLAN.md           # 本文件
│
├── package.json
├── vite.config.ts
├── tailwind.config.js             # 升级配置
└── tsconfig.json
```

---

## 4. 重构阶段规划

### Phase 0: 准备阶段 (1天)
> 目标: 搭建基础设施，确保开发环境就绪

- [ ] 创建重构分支 ✅ `feature/tauri-desktop-refactor`
- [ ] 安装 Tauri CLI 和 Rust 工具链
- [ ] 初始化 Tauri 项目结构
- [ ] 配置 Tauri 开发环境
- [ ] 验证 `npm run tauri dev` 可正常运行

### Phase 1: 架构重构 (3天)
> 目标: 建立四层分离架构，不改变现有功能

#### 1.1 创建 API 封装层 (0.5天)
- [ ] 创建 `src/lib/api/` 目录
- [ ] 实现 `kanban.ts` - 暂时使用 LocalStorage 模拟
- [ ] 实现 `projects.ts`
- [ ] 实现 `settings.ts`
- [ ] 统一导出 `index.ts`

#### 1.2 集成 TanStack Query (1天)
- [ ] 安装 `@tanstack/react-query`
- [ ] 创建 `src/lib/query/queryClient.ts`
- [ ] 实现 `queries.ts` - 看板/项目/活动查询
- [ ] 实现 `mutations.ts` - 卡片/列/项目变更
- [ ] 在 `App.tsx` 中添加 `QueryClientProvider`

#### 1.3 拆分业务 Hooks (1天)
- [ ] 从 `useKanbanStore.ts` 拆分出 `useKanbanActions.ts`
- [ ] 从 `useProjectStore.ts` 拆分出 `useProjectActions.ts`
- [ ] 创建 `useDragSort.ts`
- [ ] 移除对 `useLocalStorage` 的直接依赖

#### 1.4 添加 Zod 验证 (0.5天)
- [ ] 安装 `zod`
- [ ] 创建 `src/lib/schemas/kanban.ts`
- [ ] 为 Card, Column, Board 添加 schema
- [ ] 在 API 层添加数据验证

### Phase 2: Tauri 后端开发 (3天)
> 目标: 实现 Rust 后端，替换 LocalStorage

#### 2.1 数据库设计 (0.5天)
- [ ] 设计 SQLite 表结构
- [ ] 创建 `src-tauri/src/db/schema.rs`
- [ ] 实现数据库初始化和迁移

#### 2.2 实现 Tauri Commands (1.5天)
- [ ] 实现 `get_board` / `save_board`
- [ ] 实现 `get_projects` / `create_project` / `delete_project`
- [ ] 实现 `create_card` / `update_card` / `delete_card` / `move_card`
- [ ] 实现 `create_column` / `update_column` / `delete_column`
- [ ] 实现 `get_activities`
- [ ] 实现 `get_settings` / `save_settings`

#### 2.3 前端 API 层对接 (1天)
- [ ] 将 `lib/api/*.ts` 从 LocalStorage 切换到 `invoke()`
- [ ] 添加错误处理和 Toast 通知
- [ ] 验证所有功能正常工作

### Phase 3: UI 设计升级 (2天)
> 目标: 对齐 cc-switch 设计系统

#### 3.1 主题系统 (0.5天)
- [ ] 升级 `index.css` CSS 变量 (参考 cc-switch)
- [ ] 升级 `tailwind.config.js` 配置
- [ ] 创建 `ThemeContext.tsx` 和 `useTheme.ts`
- [ ] 实现 Light/Dark/System 主题切换

#### 3.2 按钮变体升级 (0.5天)
- [ ] 安装 `class-variance-authority`
- [ ] 升级 `components/ui/button.tsx` 添加变体
- [ ] 添加 `default`, `destructive`, `outline`, `secondary`, `ghost` 变体

#### 3.3 添加动画效果 (1天)
- [ ] 安装 `framer-motion`
- [ ] 为 Dialog 添加 zoom + slide 动画
- [ ] 为列表项添加入场动画
- [ ] 为卡片悬停添加效果 (border + shadow + scale)
- [ ] 为拖拽添加反馈动画

### Phase 4: 拖拽升级 (可选，1天)
> 目标: 从 react-dnd 迁移到 @dnd-kit

- [ ] 安装 `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`
- [ ] 创建 `useDragSort.ts` hook
- [ ] 重写 `KanbanColumn.tsx` 拖拽逻辑
- [ ] 重写 `KanbanCard.tsx` 拖拽逻辑
- [ ] 移除 `react-dnd` 依赖

### Phase 5: 桌面特性 (1天)
> 目标: 添加桌面应用特性

- [ ] 配置系统托盘图标
- [ ] 添加托盘菜单 (显示/隐藏/退出)
- [ ] 配置全局快捷键 (可选)
- [ ] 配置自动更新 (可选)
- [ ] 配置窗口状态持久化

### Phase 6: 测试与优化 (1天)
> 目标: 确保质量，准备发布

- [ ] 添加关键 Hooks 单元测试
- [ ] 端到端测试 (手动)
- [ ] 性能优化 (React DevTools 分析)
- [ ] 构建各平台安装包
- [ ] 更新 README.md

---

## 5. 详细任务清单

### 5.1 新增依赖

```bash
# TanStack Query
npm install @tanstack/react-query

# Zod 验证
npm install zod @hookform/resolvers

# 动画
npm install framer-motion

# 按钮变体
npm install class-variance-authority

# 拖拽 (可选升级)
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities

# Tauri
npm install @tauri-apps/api @tauri-apps/cli
```

### 5.2 Rust 依赖 (Cargo.toml)

```toml
[dependencies]
tauri = { version = "2", features = ["tray-icon"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
rusqlite = { version = "0.31", features = ["bundled"] }
chrono = { version = "0.4", features = ["serde"] }
uuid = { version = "1", features = ["v4", "serde"] }
thiserror = "2.0"
tokio = { version = "1", features = ["macros", "rt-multi-thread"] }
```

### 5.3 新增文件清单

| 路径 | 描述 | 优先级 |
|------|------|--------|
| `src/lib/api/index.ts` | API 层入口 | P0 |
| `src/lib/api/kanban.ts` | 看板 API | P0 |
| `src/lib/api/projects.ts` | 项目 API | P0 |
| `src/lib/api/settings.ts` | 设置 API | P1 |
| `src/lib/query/queryClient.ts` | Query 客户端 | P0 |
| `src/lib/query/queries.ts` | 查询定义 | P0 |
| `src/lib/query/mutations.ts` | 变更定义 | P0 |
| `src/lib/schemas/kanban.ts` | Zod Schema | P1 |
| `src/lib/utils.ts` | 工具函数 | P0 |
| `src/hooks/useKanbanActions.ts` | 看板操作 Hook | P0 |
| `src/hooks/useProjectActions.ts` | 项目操作 Hook | P0 |
| `src/hooks/useDragSort.ts` | 拖拽 Hook | P1 |
| `src/contexts/ThemeContext.tsx` | 主题 Context | P1 |
| `src-tauri/` | Rust 后端目录 | P0 |

### 5.4 修改文件清单

| 路径 | 修改内容 | 优先级 |
|------|----------|--------|
| `package.json` | 添加依赖和脚本 | P0 |
| `vite.config.ts` | Tauri 集成配置 | P0 |
| `tailwind.config.js` | 升级颜色/动画配置 | P1 |
| `src/index.css` | 添加 CSS 变量 | P1 |
| `src/App.tsx` | 添加 QueryClientProvider, ThemeProvider | P0 |
| `src/components/ui/button.tsx` | 添加 CVA 变体 | P1 |
| `src/components/ui/dialog.tsx` | 添加动画 | P2 |
| `src/hooks/useKanbanStore.ts` | 拆分/重构 | P0 |
| `src/hooks/useProjectStore.ts` | 拆分/重构 | P0 |

---

## 6. 文件变更清单

### 6.1 CSS 变量升级 (index.css)

```css
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 240 10% 3.9%;
    --card: 0 0% 100%;
    --card-foreground: 240 10% 3.9%;
    --primary: 210 100% 56%;
    --primary-foreground: 0 0% 100%;
    --secondary: 240 4.8% 95.9%;
    --muted: 240 4.8% 95.9%;
    --muted-foreground: 240 3.8% 46.1%;
    --destructive: 0 84.2% 60.2%;
    --border: 240 5.9% 90%;
    --ring: 210 100% 56%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 240 5% 12%;
    --foreground: 0 0% 98%;
    --card: 240 5% 16%;
    --primary: 210 100% 54%;
    --secondary: 240 5% 18%;
    --muted: 240 5% 18%;
    --muted-foreground: 240 5% 64.9%;
    --destructive: 0 62.8% 30.6%;
    --border: 240 5% 24%;
    --ring: 210 100% 54%;
  }
}
```

### 6.2 Tailwind 配置升级

```javascript
// tailwind.config.js
module.exports = {
  darkMode: ["selector", "class"],
  theme: {
    extend: {
      animation: {
        "fade-in": "fadeIn 0.5s ease-out",
        "slide-up": "slideUp 0.5s ease-out",
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
    },
  },
};
```

---

## 7. 风险评估与应对

### 7.1 风险矩阵

| 风险 | 概率 | 影响 | 应对措施 |
|------|------|------|----------|
| Rust 学习曲线 | 中 | 高 | 使用简单的 CRUD 模式，参考 cc-switch 实现 |
| 数据迁移丢失 | 低 | 高 | 实现 LocalStorage → SQLite 迁移工具 |
| 拖拽功能回归 | 中 | 中 | 保留 react-dnd 作为备选，逐步迁移 |
| 构建/打包问题 | 中 | 中 | 使用 GitHub Actions CI，多平台测试 |
| 性能下降 | 低 | 中 | 使用 React DevTools 性能分析 |

### 7.2 回退策略

1. **保留原有分支**: `master` 分支保持不变
2. **增量提交**: 每个 Phase 完成后提交，便于回退
3. **功能开关**: 使用环境变量控制新特性启用
4. **LocalStorage 兼容**: API 层支持两种后端切换

---

## 8. 里程碑检查点

| 里程碑 | 预计完成 | 验收标准 |
|--------|----------|----------|
| M0: 环境就绪 | Day 1 | `npm run tauri dev` 可运行 |
| M1: 架构完成 | Day 4 | 四层分离，TanStack Query 集成 |
| M2: 后端完成 | Day 7 | SQLite 持久化，所有功能可用 |
| M3: UI 升级 | Day 9 | 主题切换，动画效果完整 |
| M4: 发布就绪 | Day 11 | 各平台安装包可用 |

---

## 附录: 快速命令

```bash
# 安装 Rust (如未安装)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# 安装 Tauri CLI
npm install -D @tauri-apps/cli

# 初始化 Tauri
npm run tauri init

# 开发模式
npm run tauri dev

# 构建
npm run tauri build
```

---

> 文档由 Claude 自动生成
> 最后更新: 2025-01-25
