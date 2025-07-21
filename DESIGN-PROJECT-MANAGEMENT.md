# 專案管理功能設計文檔

## 📋 功能概述

專案管理功能允許用戶創建和管理多個專案，並將待辦事項組織到不同的專案中，實現更好的任務分類和管理。

## 🎯 核心需求

1. **新增專案** - 用戶可以創建新的專案
2. **專案列表** - 查看所有進行中的專案
3. **待辦事項關聯** - 將待辦事項附加到特定專案
4. **專案切換** - 在不同專案間切換查看
5. **專案統計** - 顯示每個專案的進度和統計信息

## 🏗️ 系統架構設計

### 數據模型

```typescript
// 專案類型定義
interface Project {
  id: string
  name: string
  description?: string
  color: string // 用於視覺區分
  icon?: string // 專案圖標
  userId: string // 所屬用戶
  createdAt: Date
  updatedAt: Date
  isArchived: boolean // 歸檔狀態
  todoCount?: number // 待辦事項數量
  completedCount?: number // 已完成數量
}

// 擴展現有的 Todo 類型
interface Todo {
  id: string
  text: string
  completed: boolean
  createdAt: Date
  userId?: string
  projectId?: string // 新增：關聯的專案ID
  priority?: 'low' | 'medium' | 'high' // 新增：優先級
  dueDate?: Date // 新增：截止日期
}

// 專案統計
interface ProjectStats {
  projectId: string
  totalTodos: number
  completedTodos: number
  activeTodos: number
  completionRate: number
  lastActivity: Date
}
```

### 組件架構

```
┌─────────────────────────────────────────┐
│              App.tsx                    │
├─────────────────────────────────────────┤
│         ProjectProvider                 │ ← 專案狀態管理
├─────────────────────────────────────────┤
│     ProjectSelector Component           │ ← 專案選擇器
├─────────────────────────────────────────┤
│     ProjectDashboard Component          │ ← 專案儀表板
├─────────────────────────────────────────┤
│      Enhanced Todo Components           │ ← 支援專案的Todo組件
└─────────────────────────────────────────┘
```

## 🧩 核心組件設計

### 1. ProjectContext - 專案狀態管理

```typescript
interface ProjectContextType {
  projects: Project[]
  currentProject: Project | null
  isLoading: boolean
  error: string | null
  
  // 專案操作
  createProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Project>
  updateProject: (id: string, updates: Partial<Project>) => Promise<boolean>
  deleteProject: (id: string) => Promise<boolean>
  archiveProject: (id: string) => Promise<boolean>
  selectProject: (id: string | null) => void
  
  // 統計相關
  getProjectStats: (id: string) => ProjectStats
  getAllProjectsStats: () => ProjectStats[]
}
```

### 2. ProjectSelector - 專案選擇器組件

```typescript
interface ProjectSelectorProps {
  onProjectChange?: (project: Project | null) => void
  showAllOption?: boolean
  showCreateButton?: boolean
}

// 功能特性：
// - 下拉選單顯示所有專案
// - 顯示每個專案的待辦事項數量
// - 快速創建新專案按鈕
// - 專案顏色標識
```

### 3. ProjectDashboard - 專案儀表板

```typescript
interface ProjectDashboardProps {
  projects: Project[]
  onProjectSelect: (project: Project) => void
  onProjectEdit: (project: Project) => void
  onProjectDelete: (project: Project) => void
}

// 功能特性：
// - 網格/列表視圖切換
// - 專案卡片顯示統計信息
// - 進度條顯示完成率
// - 最近活動時間
// - 快速操作按鈕
```

### 4. ProjectForm - 專案表單組件

```typescript
interface ProjectFormProps {
  project?: Project // 編輯模式
  onSubmit: (project: Partial<Project>) => void
  onCancel: () => void
}

// 表單字段：
// - 專案名稱（必填）
// - 專案描述（選填）
// - 專案顏色（顏色選擇器）
// - 專案圖標（圖標選擇器）
```

## 🔄 狀態管理設計

### useProjects Hook

```typescript
export const useProjects = () => {
  const { user } = useUser()
  const [projects, setProjects] = useLocalStorage<Project[]>('projects', [])
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null)
  
  // 過濾當前用戶的專案
  const userProjects = useMemo(() => {
    if (!user) return []
    return projects.filter(project => project.userId === user.id && !project.isArchived)
  }, [projects, user])
  
  // CRUD 操作
  const createProject = useCallback((projectData) => {
    // 實現創建邏輯
  }, [user, setProjects])
  
  // ... 其他操作
  
  return {
    projects: userProjects,
    currentProject,
    createProject,
    updateProject,
    deleteProject,
    selectProject,
    // ...
  }
}
```

### 整合 useTodos Hook

```typescript
export const useTodos = () => {
  const { user } = useUser()
  const { currentProject } = useProjects() // 新增
  const [allTodos, setAllTodos] = useLocalStorage<Todo[]>('todos', [])
  
  // 根據當前專案過濾待辦事項
  const filteredTodos = useMemo(() => {
    let todos = allTodos.filter(todo => todo.userId === user?.id)
    
    // 如果選擇了特定專案，只顯示該專案的待辦事項
    if (currentProject) {
      todos = todos.filter(todo => todo.projectId === currentProject.id)
    }
    
    return todos
  }, [allTodos, user, currentProject])
  
  // 修改 addTodo 以支援專案
  const addTodo = useCallback((text: string, projectId?: string) => {
    const newTodo: Todo = {
      id: crypto.randomUUID(),
      text,
      completed: false,
      createdAt: new Date(),
      userId: user?.id,
      projectId: projectId || currentProject?.id, // 使用當前專案或指定專案
    }
    setAllTodos(prev => [...prev, newTodo])
  }, [user, currentProject, setAllTodos])
  
  // ... 其他邏輯
}
```

## 🎨 UI/UX 設計

### 視覺設計原則

1. **顏色編碼** - 每個專案有獨特的顏色標識
2. **圖標系統** - 使用圖標快速識別專案類型
3. **進度可視化** - 環形圖或進度條顯示完成率
4. **響應式布局** - 適配不同屏幕尺寸

### 交互流程

```
用戶登錄
  ↓
專案儀表板（默認視圖）
  ├─ 查看所有專案
  ├─ 創建新專案
  └─ 選擇專案
      ↓
  專案內待辦事項視圖
    ├─ 添加待辦事項（自動關聯當前專案）
    ├─ 管理待辦事項
    └─ 切換到其他專案
```

### 專案選擇器設計

```typescript
// 下拉選單項目結構
interface ProjectOption {
  id: string
  name: string
  color: string
  todoCount: number
  completedCount: number
}

// 顯示格式
// 🔵 工作專案 (5/12)
// 🟢 個人專案 (3/8)
// 🟡 學習計劃 (10/15)
// ➕ 創建新專案...
```

## 🧪 測試策略

### 單元測試

1. **Project 類型測試**
   - 創建專案驗證
   - 更新專案邏輯
   - 刪除/歸檔邏輯

2. **useProjects Hook 測試**
   - CRUD 操作
   - 用戶隔離
   - 狀態更新

3. **組件測試**
   - ProjectSelector 交互
   - ProjectDashboard 渲染
   - ProjectForm 驗證

### 集成測試

1. **專案創建流程**
   - 表單提交 → 列表更新 → 選擇新專案

2. **待辦事項關聯**
   - 創建待辦事項 → 自動關聯專案 → 正確過濾顯示

3. **專案切換**
   - 切換專案 → 待辦事項列表更新 → 統計信息更新

## 🚀 實施計劃

### 第一階段：基礎架構（2-3天）
1. ✅ 創建專案類型定義
2. ✅ 實現 ProjectContext
3. ✅ 創建 useProjects Hook
4. ✅ 更新 Todo 類型支援專案

### 第二階段：核心功能（3-4天）
5. ✅ 實現專案 CRUD 功能
6. ✅ 創建 ProjectSelector 組件
7. ✅ 整合 useTodos 支援專案過濾
8. ✅ 更新 TodoInput 支援專案關聯

### 第三階段：UI 完善（2-3天）
9. ✅ 創建 ProjectDashboard
10. ✅ 實現專案統計功能
11. ✅ 添加專案顏色和圖標
12. ✅ 響應式設計優化

### 第四階段：測試與優化（1-2天）
13. ✅ 編寫完整測試套件
14. ✅ 性能優化
15. ✅ 用戶體驗改進

## 🔮 未來擴展

1. **專案模板** - 預設專案結構和待辦事項
2. **專案分享** - 與其他用戶共享專案
3. **專案標籤** - 更細緻的分類系統
4. **專案時間線** - 甘特圖視圖
5. **專案導出** - 導出為 PDF 或其他格式

## 📝 技術決策

1. **狀態管理** - 繼續使用 Context API + LocalStorage
2. **路由** - 考慮添加 React Router 支援專案 URL
3. **動畫** - 使用現有的魔法 UI 系統
4. **圖標庫** - 可以整合 react-icons 或自定義 SVG
5. **顏色選擇** - 預設調色板 + 自定義顏色

這個設計提供了完整的專案管理功能，同時保持了與現有系統的良好整合。