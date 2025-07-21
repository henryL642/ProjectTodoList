export interface Project {
  id: string
  name: string
  description?: string
  color: string
  icon?: string
  userId: string
  createdAt: Date
  updatedAt: Date
  isArchived: boolean
  todoCount?: number
  completedCount?: number
}

export interface ProjectStats {
  projectId: string
  totalTodos: number
  completedTodos: number
  activeTodos: number
  completionRate: number
  lastActivity: Date
}

export interface ProjectContextType {
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
  getProjectStats: (id: string) => ProjectStats | null
  getAllProjectsStats: () => ProjectStats[]
}

// 預設專案顏色
export const PROJECT_COLORS = [
  '#667eea', // 紫色
  '#4ade80', // 綠色
  '#f87171', // 紅色
  '#fbbf24', // 黃色
  '#60a5fa', // 藍色
  '#f97316', // 橙色
  '#ec4899', // 粉色
  '#8b5cf6', // 深紫色
  '#10b981', // 翠綠色
  '#6366f1', // 靛藍色
] as const

// 預設專案圖標
export const PROJECT_ICONS = [
  '📁', // 文件夾
  '💼', // 公事包
  '🎯', // 目標
  '📚', // 書籍
  '🏠', // 家
  '💡', // 燈泡
  '🚀', // 火箭
  '⭐', // 星星
  '🎨', // 調色板
  '📊', // 圖表
] as const