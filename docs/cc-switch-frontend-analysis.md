# CC-Switch 前端设计语言与动画效果分析

> 分析日期: 2025-01-25
> 参考项目: https://github.com/farion1231/cc-switch (v3.10.2)
> 目的: 为 ZeTodo 桌面应用重构提供设计参考

---

## 目录

1. [整体架构](#1-整体架构)
2. [设计系统](#2-设计系统)
3. [颜色系统](#3-颜色系统)
4. [毛玻璃效果](#4-毛玻璃效果-glassmorphism)
5. [动画系统](#5-动画系统)
6. [组件设计模式](#6-组件设计模式)
7. [数据流架构](#7-数据流架构)
8. [ZeTodo 迁移建议](#8-zetodo-迁移建议)

---

## 1. 整体架构

### 1.1 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| **桌面框架** | Tauri 2.8 | Rust 后端 + WebView 前端 |
| **前端框架** | React 18 + TypeScript | 函数式组件 + Hooks |
| **构建工具** | Vite 7.3 | 快速开发与构建 |
| **UI 组件** | Radix UI + shadcn/ui | 无障碍、可定制 |
| **样式方案** | Tailwind CSS 3.4 | 原子化 CSS |
| **状态管理** | TanStack Query v5 | 服务端状态缓存 |
| **动画库** | Framer Motion | 声明式动画 |
| **拖拽库** | @dnd-kit | 现代拖拽交互 |
| **表单验证** | Zod + react-hook-form | 类型安全验证 |
| **国际化** | react-i18next | 多语言支持 |

### 1.2 四层分离架构

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           App.tsx (主入口)                               │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐  ┌───────────────┐  │
│  │ AppSwitcher │  │ ProviderList │  │ SettingsPage│  │  MCP/Skills   │  │
│  └─────────────┘  └──────────────┘  └─────────────┘  └───────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         Hooks 层 (业务逻辑)                              │
│  ┌──────────────────┐  ┌─────────────┐  ┌───────────────────────────┐   │
│  │useProviderActions│  │  useMcp     │  │ useSettings / useSkills   │   │
│  └──────────────────┘  └─────────────┘  └───────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    TanStack Query 层 (状态缓存与同步)                     │
│  ┌──────────────────────────┐  ┌────────────────────────────────────┐   │
│  │ queries.ts (数据查询)     │  │ mutations.ts (数据变更)             │   │
│  └──────────────────────────┘  └────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         API 封装层 (Tauri IPC)                           │
│  ┌───────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────────┐  │
│  │ providers.ts  │  │ settings.ts│  │  mcp.ts    │  │  prompts.ts    │  │
│  │ invoke("xxx") │  │ invoke()   │  │ invoke()   │  │  invoke()      │  │
│  └───────────────┘  └────────────┘  └────────────┘  └────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
                        ┌───────────────────────┐
                        │   Tauri Rust 后端     │
                        │   (系统API/文件/DB)   │
                        └───────────────────────┘
```

### 1.3 目录结构

```
src/
├── App.tsx                    # 主应用组件
├── main.tsx                   # 入口文件
├── types.ts                   # 全局类型定义
├── types/                     # 分类类型定义
│
├── components/                # UI 组件
│   ├── ui/                    # 基础组件 (shadcn/ui)
│   ├── providers/             # 供应商相关组件
│   │   └── forms/             # 表单组件
│   ├── settings/              # 设置页组件
│   ├── mcp/                   # MCP 管理组件
│   └── common/                # 通用业务组件
│
├── hooks/                     # 自定义 Hooks
│   ├── useProviderActions.ts  # 供应商操作
│   ├── useMcp.ts              # MCP 管理
│   ├── useDragSort.ts         # 拖拽排序
│   └── useSettings.ts         # 设置管理
│
├── lib/                       # 工具库
│   ├── api/                   # Tauri API 封装
│   ├── query/                 # TanStack Query
│   ├── schemas/               # Zod 验证 Schema
│   └── utils.ts               # 通用工具
│
├── utils/                     # 业务工具函数
├── i18n/                      # 国际化
├── config/                    # 静态配置
└── contexts/                  # React Context
```

---

## 2. 设计系统

### 2.1 设计哲学

- **macOS 风格**: 系统蓝色主题、系统字体栈、窗口控制
- **Glassmorphism**: 毛玻璃效果增加层次感
- **微交互动画**: 丰富但不过度的动画反馈
- **深色模式优先**: 完整的暗色主题支持

### 2.2 字体系统

```javascript
fontFamily: {
  sans: [
    "-apple-system",
    "BlinkMacSystemFont",
    "Segoe UI",
    "Roboto",
    "Helvetica Neue",
    "Arial",
    "sans-serif"
  ],
  mono: [
    "ui-monospace",
    "SFMono-Regular",
    "SF Mono",
    "Consolas",
    "Liberation Mono",
    "Menlo",
    "monospace"
  ]
}
```

### 2.3 圆角规范

| Token | 值 | 用途 |
|-------|-----|------|
| `sm` | 0.375rem (6px) | 小按钮、徽章 |
| `md` | 0.5rem (8px) | 输入框、小卡片 |
| `lg` | 0.75rem (12px) | 按钮、对话框 |
| `xl` | 0.875rem (14px) | 卡片、面板 |
| `2xl` | 1rem (16px) | 大型容器 |

### 2.4 阴影规范

```css
shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);

/* 激活状态特殊阴影 */
shadow-blue-500/10   /* 蓝色激活 */
shadow-emerald-500/10  /* 绿色/代理模式 */
```

---

## 3. 颜色系统

### 3.1 CSS 变量定义

```css
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 240 10% 3.9%;
    --card: 0 0% 100%;
    --card-foreground: 240 10% 3.9%;
    --primary: 210 100% 56%;        /* macOS 系统蓝 */
    --primary-foreground: 0 0% 100%;
    --secondary: 240 4.8% 95.9%;
    --muted: 240 4.8% 95.9%;
    --muted-foreground: 240 3.8% 46.1%;
    --destructive: 0 84.2% 60.2%;   /* 红色 */
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

### 3.2 语义颜色

| 颜色 | Hex | HSL | 用途 |
|------|-----|-----|------|
| 🔵 Blue 500 | #0A84FF | 210 100% 56% | 主操作、激活状态、链接 |
| 🔵 Blue 400 | #409CFF | - | hover 状态 |
| 🔵 Blue 600 | #0060DF | - | active 状态 |
| 🟢 Emerald 500 | #10b981 | 160 84% 39% | MCP、代理模式、成功 |
| 🔴 Red 500 | #ef4444 | 0 84% 60% | 删除、错误、危险 |
| 🟡 Amber 500 | #f59e0b | 38 92% 50% | 警告状态 |

### 3.3 灰度系统 (macOS 风格)

```javascript
gray: {
  50:  "#fafafa",
  100: "#f4f4f5",
  200: "#e4e4e7",
  300: "#d4d4d8",
  400: "#a1a1aa",
  500: "#71717a",
  600: "#636366",  // macOS systemGray
  700: "#48484A",
  800: "#3A3A3C",
  900: "#2C2C2E",
  950: "#1C1C1E",
}
```

---

## 4. 毛玻璃效果 (Glassmorphism)

### 4.1 基础毛玻璃

```css
.glass {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.dark .glass {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
```

### 4.2 卡片毛玻璃

```css
.glass-card {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.dark .glass-card {
  background: linear-gradient(
    145deg,
    rgba(255, 255, 255, 0.05) 0%,
    rgba(255, 255, 255, 0.01) 100%
  );
  border: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
}
```

### 4.3 激活状态毛玻璃

```css
.glass-card-active {
  background: rgba(59, 130, 246, 0.08);
  border: 1px solid rgba(59, 130, 246, 0.4);
}

.dark .glass-card-active {
  background: rgba(59, 130, 246, 0.12);
  border: 1px solid rgba(59, 130, 246, 0.3);
}
```

---

## 5. 动画系统

### 5.1 Tailwind 关键帧定义

```javascript
// tailwind.config.cjs
animation: {
  "fade-in": "fadeIn 0.5s ease-out",
  "slide-up": "slideUp 0.5s ease-out",
  "slide-down": "slideDown 0.3s ease-out",
  "slide-in-right": "slideInRight 0.3s ease-out",
  "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
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
  slideDown: {
    "0%": { transform: "translateY(-100%)", opacity: "0" },
    "100%": { transform: "translateY(0)", opacity: "1" },
  },
  slideInRight: {
    "0%": { transform: "translateX(100%)", opacity: "0" },
    "100%": { transform: "translateX(0)", opacity: "1" },
  },
  "accordion-down": {
    from: { height: "0" },
    to: { height: "var(--radix-accordion-content-height)" },
  },
  "accordion-up": {
    from: { height: "var(--radix-accordion-content-height)" },
    to: { height: "0" },
  },
}
```

### 5.2 Framer Motion 动画变体

```typescript
// 搜索面板动画
const searchPanelVariants = {
  initial: { opacity: 0, y: -8, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -8, scale: 0.98 },
  transition: { duration: 0.18, ease: "easeOut" }
};

// 列表项动画
const listItemVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95 },
  transition: { duration: 0.2 }
};
```

### 5.3 Dialog 动画 (Radix UI)

```css
/* Overlay */
data-[state=open]:animate-in
data-[state=closed]:animate-out
data-[state=closed]:fade-out-0
data-[state=open]:fade-in-0

/* Content */
data-[state=open]:animate-in
data-[state=closed]:animate-out
data-[state=closed]:fade-out-0
data-[state=open]:fade-in-0
data-[state=closed]:zoom-out-95
data-[state=open]:zoom-in-95
data-[state=closed]:slide-out-to-left-1/2
data-[state=closed]:slide-out-to-top-[48%]
data-[state=open]:slide-in-from-left-1/2
data-[state=open]:slide-in-from-top-[48%]
```

### 5.4 微交互动画

| 交互类型 | 实现方式 | 效果 |
|----------|----------|------|
| 按钮悬停 | `transition-colors` | 背景色平滑过渡 |
| 卡片悬停 | `transition-all duration-300` | 边框+阴影变化 |
| 图标悬停 | `group-hover:scale-105` | 轻微放大 |
| 拖拽手柄 | `cursor-grab active:cursor-grabbing` | 鼠标样式变化 |
| 拖拽卡片 | `scale-105 z-10 shadow-lg` | 放大+提升+阴影 |
| 手风琴箭头 | `[&[data-state=open]>svg]:rotate-180` | 旋转 180° |
| 悬停显示 | `opacity-0 group-hover:opacity-100` | 淡入显示 |
| 滑动让位 | `group-hover:-translate-x-[var(--actions-width)]` | 向左滑动 |

### 5.5 拖拽排序动画

```typescript
// useDragSort.ts
import { CSS } from "@dnd-kit/utilities";
import { useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";

const sensors = useSensors(
  useSensor(PointerSensor, {
    activationConstraint: { distance: 8 },  // 8px 后才激活
  }),
  useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates,
  }),
);

// 拖拽样式
const style: CSSProperties = {
  transform: CSS.Transform.toString(transform),
  transition,
};

// 拖拽中状态
className={cn(
  dragHandleProps?.isDragging &&
    "cursor-grabbing border-primary shadow-lg scale-105 z-10"
)}
```

### 5.6 动画时长规范

| 类型 | 时长 | 缓动函数 | 用途 |
|------|------|----------|------|
| 微交互 | 150-200ms | `ease-out` | 按钮、图标 |
| 转场 | 200-300ms | `ease-out` | Dialog、Tab |
| 进入 | 300-500ms | `ease-out` | 列表、页面 |
| 拖拽 | 实时 | - | 跟随鼠标 |

---

## 6. 组件设计模式

### 6.1 Button 变体 (CVA)

```typescript
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700",
        destructive: "bg-red-500 text-white hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700",
        outline: "border border-border-default bg-background hover:bg-gray-100 hover:border-border-hover dark:hover:bg-gray-800",
        secondary: "text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800",
        ghost: "text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800",
        mcp: "bg-emerald-500 text-white hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-700",
        link: "text-blue-500 underline-offset-4 hover:underline dark:text-blue-400",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9 p-1.5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);
```

### 6.2 卡片状态系统

```typescript
// 卡片基础
"rounded-xl border border-border p-4 bg-card text-card-foreground"

// 悬停效果
"transition-all duration-300 hover:border-border-active hover:shadow-sm"

// 激活状态 (蓝色 - 普通模式)
isActiveProvider && !isProxyTakeover &&
  "border-blue-500/60 shadow-sm shadow-blue-500/10"

// 激活状态 (绿色 - 代理接管模式)
isActiveProvider && isProxyTakeover &&
  "border-emerald-500/60 shadow-sm shadow-emerald-500/10"

// 拖拽中
isDragging && "scale-105 z-10 border-primary shadow-lg cursor-grabbing"

// 渐变背景叠加
<div className={cn(
  "absolute inset-0 bg-gradient-to-r to-transparent",
  shouldUseGreen && "from-emerald-500/10",
  shouldUseBlue && "from-blue-500/10",
  isActiveProvider ? "opacity-100" : "opacity-0",
)} />
```

### 6.3 悬停显示操作按钮

```typescript
// 容器使用 group
<div className="relative flex items-center group">

  {/* 内容区域 - 悬停时向左滑动 */}
  <div className="transition-transform duration-200
    group-hover:-translate-x-[var(--actions-width)]">
    {/* 用量信息等 */}
  </div>

  {/* 操作按钮 - 悬停时从右侧滑入 */}
  <div className="absolute right-0
    opacity-0 pointer-events-none
    group-hover:opacity-100 group-hover:pointer-events-auto
    translate-x-2 group-hover:translate-x-0
    transition-all duration-200">
    <ProviderActions />
  </div>
</div>
```

### 6.4 Tab 切换器

```typescript
<div className="inline-flex bg-muted rounded-xl p-1 gap-1">
  {apps.map((app) => (
    <button
      className={cn(
        "inline-flex items-center gap-2 px-3 h-8 rounded-md text-sm font-medium transition-all duration-200",
        activeApp === app
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground hover:bg-background/50"
      )}
    >
      <Icon /> {app.name}
    </button>
  ))}
</div>
```

### 6.5 搜索面板动画

```typescript
<AnimatePresence>
  {isSearchOpen && (
    <motion.div
      key="provider-search"
      initial={{ opacity: 0, y: -8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="fixed left-1/2 top-[6.5rem] z-40
        w-[min(90vw,26rem)] -translate-x-1/2
        p-4 border shadow-md rounded-2xl
        border-white/10 bg-background/95 backdrop-blur-md"
    >
      {/* 搜索内容 */}
    </motion.div>
  )}
</AnimatePresence>
```

---

## 7. 数据流架构

### 7.1 API 封装层

```typescript
// lib/api/providers.ts
import { invoke } from "@tauri-apps/api/core";

export const providersApi = {
  async getAll(appId: AppId): Promise<Record<string, Provider>> {
    return await invoke("get_providers", { app: appId });
  },

  async add(provider: Provider, appId: AppId): Promise<boolean> {
    return await invoke("add_provider", { provider, app: appId });
  },

  async switch(id: string, appId: AppId): Promise<boolean> {
    return await invoke("switch_provider", { id, app: appId });
  },

  // 事件监听
  async onSwitched(handler: (event) => void): Promise<UnlistenFn> {
    return await listen("provider-switched", handler);
  },
};
```

### 7.2 TanStack Query 集成

```typescript
// lib/query/queries.ts
export const useProvidersQuery = (appId: AppId) => {
  return useQuery({
    queryKey: ["providers", appId],
    placeholderData: keepPreviousData,
    refetchInterval: isProxyRunning ? 10000 : false,
    queryFn: async () => {
      const providers = await providersApi.getAll(appId);
      const currentId = await providersApi.getCurrent(appId);
      return { providers, currentProviderId: currentId };
    },
  });
};

// lib/query/mutations.ts
export const useAddProviderMutation = (appId: AppId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (provider) => {
      await providersApi.add(provider, appId);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["providers", appId] });
      toast.success("供应商已添加");
    },
    onError: (error) => {
      toast.error(`添加失败: ${error.message}`);
    },
  });
};
```

### 7.3 业务逻辑 Hook

```typescript
// hooks/useProviderActions.ts
export function useProviderActions(activeApp: AppId) {
  const addProviderMutation = useAddProviderMutation(activeApp);
  const switchProviderMutation = useSwitchProviderMutation(activeApp);

  const addProvider = useCallback(async (provider) => {
    await addProviderMutation.mutateAsync(provider);
  }, [addProviderMutation]);

  const switchProvider = useCallback(async (provider) => {
    await switchProviderMutation.mutateAsync(provider.id);
    await syncClaudePlugin(provider);  // 额外业务逻辑
  }, [switchProviderMutation]);

  return {
    addProvider,
    switchProvider,
    isLoading: addProviderMutation.isPending || switchProviderMutation.isPending,
  };
}
```

---

## 8. ZeTodo 迁移建议

### 8.1 技术栈对比

| 特性 | ZeTodo (当前) | CC-Switch | 迁移建议 |
|------|---------------|-----------|----------|
| 状态管理 | LocalStorage + Hooks | TanStack Query + SQLite | ⬆️ 升级 |
| API 封装 | 直接 LocalStorage | 分层封装 + invoke() | ⬆️ 新增 |
| 类型验证 | TypeScript | TypeScript + Zod | ⬆️ 添加 |
| UI 组件 | Radix UI | Radix UI + shadcn | ✅ 一致 |
| 样式 | Tailwind CSS | Tailwind CSS | ✅ 一致 |
| 拖拽 | react-dnd | @dnd-kit | 可选升级 |
| 动画 | 无 | Framer Motion | ⬆️ 添加 |

### 8.2 需要新增的目录

```
src/
├── lib/
│   ├── api/                 # 🆕 Tauri API 封装
│   │   ├── kanban.ts
│   │   ├── projects.ts
│   │   └── index.ts
│   ├── query/               # 🆕 TanStack Query
│   │   ├── queryClient.ts
│   │   ├── queries.ts
│   │   └── mutations.ts
│   └── schemas/             # 🆕 Zod 验证
│       └── kanban.ts
```

### 8.3 设计系统迁移清单

- [ ] 复制 CSS 变量系统 (index.css)
- [ ] 复制 Tailwind 配置扩展
- [ ] 添加毛玻璃效果类
- [ ] 添加 Framer Motion 依赖
- [ ] 迁移到 @dnd-kit (可选)
- [ ] 添加 ThemeProvider
- [ ] 复制 cn() 工具函数
- [ ] 添加按钮变体 (CVA)

### 8.4 动画迁移优先级

1. **高优先级**
   - 卡片悬停效果 (border + shadow)
   - 拖拽反馈动画
   - Dialog 开关动画

2. **中优先级**
   - 列表项入场动画
   - 搜索面板动画
   - Tab 切换动画

3. **低优先级**
   - 毛玻璃效果
   - 渐变叠加效果
   - 悬停显示操作按钮

---

## 附录: 关键代码片段

### A. cn() 工具函数

```typescript
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### B. ThemeProvider

```typescript
export function ThemeProvider({ children, defaultTheme = "system" }) {
  const [theme, setTheme] = useState(defaultTheme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");

    if (theme === "system") {
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.classList.add(isDark ? "dark" : "light");
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
```

### C. QueryClient 配置

```typescript
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,  // 5 分钟
    },
    mutations: {
      retry: false,
    },
  },
});
```

---

> 文档由 Claude 自动生成，基于 cc-switch v3.10.2 源码分析
