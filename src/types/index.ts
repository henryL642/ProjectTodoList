// 智慧番茄鐘排程系統類型定義
// 統一導出入口點

// 基礎類型 - 重新導出現有類型
export type { Todo, FilterType } from './todo'
export type { User } from './user'
export type { Project, ProjectStats, ProjectContextType, PROJECT_COLORS, PROJECT_ICONS } from './project'
export type { PomodoroSettings, PomodoroStats, HealthReminders, PomodoroState } from './pomodoro'

// 新增的智慧排程類型
export type { 
  PomodoroTask, 
  ScheduledSlot, 
  PomodoroSubtask,
  ScheduledSlotStatus,
  SubtaskStatus,
  TaskComplexity,
  UserSchedulingPreferences,
  SchedulingStats,
  SchedulingConflict,
  ConflictResolution
} from './pomodoro-task'

export type {
  TaskPriority,
  DistributionStrategyType,
  DailyCapacity,
  WorkingHoursConfig,
  TimeBreak,
  BreakType,
  PeakHourSlot,
  DistributionStrategy,
  SchedulingResult,
  RiskAssessment,
  AlternativeSchedule,
  OptimizationConfig,
  SchedulingSession,
  SchedulingContextType
} from './scheduling'

export type {
  CapacityManager,
  WeeklyCapacity,
  MonthlyCapacity,
  CapacityAllocationRequest,
  CapacityAllocationResult,
  CapacityUtilizationAnalysis
} from './capacity-management'

// 預設值常量
export const DefaultValues = {
  DAILY_CAPACITY: 12,
  POMODORO_DURATION: 25,
  SHORT_BREAK_DURATION: 5,
  LONG_BREAK_DURATION: 15,
  SESSIONS_UNTIL_LONG_BREAK: 4,
  
  WORKING_HOURS: {
    start: '09:00',
    end: '18:00',
    timezone: 'Asia/Taipei'
  },
  
  DISTRIBUTION_STRATEGY: 'even' as DistributionStrategyType,
  
  TASK_PRIORITIES: {
    low: 1,
    medium: 2,
    high: 3,
    urgent: 4
  },
  
  OPTIMIZATION_WEIGHTS: {
    completionTime: 0.3,
    workloadBalance: 0.25,
    userPreference: 0.25,
    riskMinimization: 0.2
  }
} as const

/**
 * 智慧番茄鐘排程系統的主要類型組合
 */
export interface SmartPomodoroSystem {
  // 核心組件類型
  tasks: import('./pomodoro-task').PomodoroTask[]
  scheduledSlots: import('./pomodoro-task').ScheduledSlot[]
  dailyCapacities: import('./scheduling').DailyCapacity[]
  
  // 算法引擎類型
  schedulingEngine: import('./algorithm-interfaces').SmartSchedulingEngine
  conflictDetection: import('./algorithm-interfaces').ConflictDetectionEngine
  optimizationEngine: import('./algorithm-interfaces').OptimizationEngine
  
  // 管理器類型
  capacityManager: import('./capacity-management').CapacityManager
  
  // 用戶配置類型
  userPreferences: import('./pomodoro-task').UserSchedulingPreferences
}

/**
 * 系統狀態快照類型
 * 用於保存和恢復系統狀態
 */
export interface SystemSnapshot {
  timestamp: Date
  version: string
  data: {
    tasks: import('./pomodoro-task').PomodoroTask[]
    slots: import('./pomodoro-task').ScheduledSlot[]
    capacities: import('./scheduling').DailyCapacity[]
    preferences: import('./pomodoro-task').UserSchedulingPreferences
    statistics: import('./pomodoro-task').SchedulingStats
  }
  metadata: {
    userId: string
    source: 'manual' | 'automatic' | 'migration'
    description?: string
  }
}

/**
 * 類型守衛函數
 * 用於運行時類型檢查
 */
export const TypeGuards = {
  isPomodoroTask: (obj: any): obj is import('./pomodoro-task').PomodoroTask => {
    return obj !== null && obj !== undefined && 
           typeof obj.id === 'string' &&
           typeof obj.text === 'string' &&
           typeof obj.estimatedPomodoros === 'number' &&
           typeof obj.completedPomodoros === 'number' &&
           typeof obj.isAutoScheduled === 'boolean' &&
           Array.isArray(obj.scheduledSlots) &&
           Array.isArray(obj.subtasks)
  },

  isScheduledSlot: (obj: any): obj is import('./pomodoro-task').ScheduledSlot => {
    return obj &&
           typeof obj.id === 'string' &&
           typeof obj.taskId === 'string' &&
           obj.date instanceof Date &&
           typeof obj.startTime === 'string' &&
           typeof obj.pomodoroCount === 'number' &&
           ['scheduled', 'in_progress', 'completed', 'skipped', 'cancelled', 'overdue'].includes(obj.status)
  },

  isDailyCapacity: (obj: any): obj is import('./scheduling').DailyCapacity => {
    return obj &&
           typeof obj.id === 'string' &&
           typeof obj.userId === 'string' &&
           obj.date instanceof Date &&
           typeof obj.totalPomodoros === 'number' &&
           typeof obj.availablePomodoros === 'number' &&
           typeof obj.usedPomodoros === 'number'
  },

  isSchedulingResult: (obj: any): obj is import('./scheduling').SchedulingResult => {
    return obj &&
           typeof obj.success === 'boolean' &&
           typeof obj.message === 'string' &&
           Array.isArray(obj.scheduledSlots) &&
           Array.isArray(obj.suggestedSubtasks) &&
           typeof obj.confidence === 'number'
  }
}

/**
 * 常用類型別名
 * 簡化常用類型的使用
 */
export type Task = import('./pomodoro-task').PomodoroTask
export type Slot = import('./pomodoro-task').ScheduledSlot
export type Subtask = import('./pomodoro-task').PomodoroSubtask
export type Capacity = import('./scheduling').DailyCapacity
export type Strategy = import('./scheduling').DistributionStrategy
export type Conflict = import('./pomodoro-task').SchedulingConflict
export type Resolution = import('./pomodoro-task').ConflictResolution
export type Preferences = import('./pomodoro-task').UserSchedulingPreferences
export type Stats = import('./pomodoro-task').SchedulingStats


/**
 * 錯誤類型定義
 * 系統特定的錯誤類型
 */
export class SchedulingError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, any>
  ) {
    super(message)
    this.name = 'SchedulingError'
  }
}

export class CapacityError extends Error {
  constructor(
    message: string,
    public requiredCapacity: number,
    public availableCapacity: number,
    public date: Date
  ) {
    super(message)
    this.name = 'CapacityError'
  }
}

export class ConflictError extends Error {
  constructor(
    message: string,
    public conflicts: import('./pomodoro-task').SchedulingConflict[]
  ) {
    super(message)
    this.name = 'ConflictError'
  }
}

/**
 * 系統版本信息
 */
export const VERSION_INFO = {
  SMART_SCHEDULING_VERSION: '1.0.0',
  TYPE_DEFINITIONS_VERSION: '1.0.0',
  COMPATIBLE_APP_VERSION: '>=0.0.0',
  MIGRATION_REQUIRED: false
} as const