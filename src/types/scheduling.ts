// 基本類型定義 - 避免循環依賴
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
export type DistributionStrategyType = 
  | 'even'          // 均勻分配
  | 'frontLoaded'   // 前置載入
  | 'backLoaded'    // 後置載入
  | 'concentrated'  // 集中式
  | 'adaptive'      // 自適應

/**
 * 日容量配置
 * 管理每日的番茄鐘容量和時間段分配
 */
export interface DailyCapacity {
  id: string
  userId: string
  date: Date
  
  // 容量設定
  totalPomodoros: number        // 日總容量 (預設12)
  availablePomodoros: number    // 可用容量
  usedPomodoros: number        // 已使用容量
  reservedPomodoros: number    // 預留容量
  
  // 時間段配置
  workingHours: WorkingHoursConfig
  
  // 彈性設定
  allowOvertime: boolean        // 是否允許加班
  maxOvertimePomodoros: number  // 最大加班番茄鐘數
  overtimeRate: number         // 加班效率係數
  
  // 狀態
  isFlexible: boolean          // 是否為彈性日
  isHoliday: boolean          // 是否為假日
  
  // 統計
  utilizationRate: number      // 利用率
  
  // 元數據
  createdAt: Date
  updatedAt: Date
}

/**
 * 工作時間配置
 */
export interface WorkingHoursConfig {
  start: string                // 開始時間 (HH:mm)
  end: string                 // 結束時間 (HH:mm)
  timezone: string            // 時區
  
  // 休息時間段
  breaks: TimeBreak[]
  
  // 高效時段
  peakHours: PeakHourSlot[]
  
  // 彈性設定
  allowEarlyStart: boolean     // 允許提早開始
  allowLateEnd: boolean       // 允許延後結束
  maxEarlyMinutes: number     // 最大提早分鐘數
  maxLateMinutes: number      // 最大延後分鐘數
}

/**
 * 休息時間段
 */
export interface TimeBreak {
  id: string
  start: string               // 開始時間 (HH:mm)
  end: string                // 結束時間 (HH:mm)
  type: BreakType
  isFlexible: boolean        // 是否可調整
  description?: string
}

/**
 * 休息類型
 */
export type BreakType = 
  | 'lunch'          // 午餐
  | 'meeting'        // 會議
  | 'personal'       // 個人事務
  | 'commute'        // 通勤
  | 'exercise'       // 運動
  | 'other'          // 其他

/**
 * 高效時段
 */
export interface PeakHourSlot {
  start: string              // 開始時間 (HH:mm)
  end: string               // 結束時間 (HH:mm)
  efficiency: number        // 效率係數 (0.5-2.0)
  description: string       // 描述
}

/**
 * 分配策略配置
 */
export interface DistributionStrategy {
  type: DistributionStrategyType
  name: string
  description: string
  
  // 策略參數
  parameters: StrategyParameters
  
  // 適用條件
  conditions: StrategyConditions
  
  // 效果預測
  expectedOutcomes: StrategyOutcomes
}

/**
 * 策略參數
 */
export interface StrategyParameters {
  // 分配比例
  frontLoadRatio?: number     // 前置載入比例 (0-1)
  backLoadRatio?: number     // 後置載入比例 (0-1)
  concentrationDays?: number // 集中工作天數
  
  // 時間偏好
  preferMorning: boolean     // 偏好上午
  preferAfternoon: boolean   // 偏好下午
  preferEvening: boolean     // 偏好晚上
  
  // 彈性設定
  bufferPercentage: number   // 緩衝時間百分比
  allowSplitting: boolean    // 允許任務分割
  minSlotSize: number       // 最小時間段大小
  maxSlotSize: number       // 最大時間段大小
}

/**
 * 策略適用條件
 */
export interface StrategyConditions {
  minTaskSize: number        // 最小任務大小
  maxTaskSize: number        // 最大任務大小
  availableDays: number     // 可用天數
  userExperience: 'beginner' | 'intermediate' | 'expert'
  taskType: string[]        // 適用任務類型
}

/**
 * 策略預期效果
 */
export interface StrategyOutcomes {
  estimatedCompletionRate: number  // 預估完成率
  stressLevel: 'low' | 'medium' | 'high'
  flexibility: 'low' | 'medium' | 'high'
  riskLevel: 'low' | 'medium' | 'high'
  suitability: number       // 適合度評分 (0-1)
}

/**
 * 排程結果
 */
export interface SchedulingResult {
  success: boolean
  message: string
  
  // 生成的排程
  scheduledSlots: import('./pomodoro-task').ScheduledSlot[]
  suggestedSubtasks: import('./pomodoro-task').PomodoroSubtask[]
  
  // 分析結果
  strategy: DistributionStrategy
  complexity: import('./pomodoro-task').TaskComplexity
  estimatedCompletionDate: Date
  
  // 質量指標
  confidence: number         // 信心度 (0-1)
  feasibility: number       // 可行性 (0-1)
  riskAssessment: RiskAssessment
  
  // 替代方案
  alternatives: AlternativeSchedule[]
  
  // 元數據
  generatedAt: Date
  generatedBy: 'user' | 'system'
}

/**
 * 風險評估
 */
export interface RiskAssessment {
  overall: 'low' | 'medium' | 'high' | 'critical'
  factors: RiskFactor[]
  mitigation: string[]       // 風險緩解建議
}

/**
 * 風險因子
 */
export interface RiskFactor {
  type: RiskType
  severity: 'low' | 'medium' | 'high'
  probability: number        // 發生機率 (0-1)
  impact: string
  description: string
}

/**
 * 風險類型
 */
export type RiskType = 
  | 'tight_deadline'     // 截止日期緊迫
  | 'high_complexity'    // 複雜度過高
  | 'capacity_shortage'  // 容量不足
  | 'dependency_risk'    // 依賴風險
  | 'external_factors'   // 外部因素
  | 'skill_gap'         // 技能差距

/**
 * 替代排程方案
 */
export interface AlternativeSchedule {
  id: string
  name: string
  description: string
  
  // 排程內容
  slots: ScheduledSlot[]
  strategy: DistributionStrategy
  
  // 比較指標
  completionTime: Date
  workload: number          // 工作負載
  flexibility: number       // 靈活性
  riskLevel: number        // 風險等級
  
  // 權衡分析
  pros: string[]
  cons: string[]
  recommendation: string
}

/**
 * 排程優化配置
 */
export interface OptimizationConfig {
  // 優化目標
  objectives: OptimizationObjective[]
  
  // 約束條件
  constraints: OptimizationConstraint[]
  
  // 優化參數
  parameters: {
    maxIterations: number     // 最大迭代次數
    convergenceThreshold: number // 收斂閾值
    timeLimit: number        // 時間限制（秒）
  }
  
  // 權重設定
  weights: {
    completionTime: number   // 完成時間權重
    workloadBalance: number  // 工作負載平衡權重
    userPreference: number   // 用戶偏好權重
    riskMinimization: number // 風險最小化權重
  }
}

/**
 * 優化目標
 */
export interface OptimizationObjective {
  type: 'minimize' | 'maximize'
  metric: 'completion_time' | 'workload_variance' | 'user_satisfaction' | 'risk_score'
  weight: number
  priority: number
}

/**
 * 優化約束
 */
export interface OptimizationConstraint {
  type: 'hard' | 'soft'     // 硬約束 vs 軟約束
  description: string
  condition: string         // 約束條件表達式
  penalty?: number         // 違反懲罰（軟約束用）
}

/**
 * 排程會話
 * 用於管理一次完整的排程過程
 */
export interface SchedulingSession {
  id: string
  userId: string
  
  // 會話配置
  config: {
    taskIds: string[]        // 參與排程的任務ID
    dateRange: {
      start: Date
      end: Date
    }
    preferences: UserSchedulingPreferences
    constraints: OptimizationConstraint[]
  }
  
  // 會話狀態
  status: 'initializing' | 'analyzing' | 'scheduling' | 'optimizing' | 'completed' | 'failed'
  progress: number          // 進度百分比
  
  // 結果
  results?: SchedulingResult[]
  selectedResult?: string   // 選中的結果ID
  
  // 歷史記錄
  iterations: SchedulingIteration[]
  
  // 元數據
  startedAt: Date
  completedAt?: Date
  duration?: number         // 會話持續時間（毫秒）
}

/**
 * 排程迭代記錄
 */
export interface SchedulingIteration {
  id: string
  sessionId: string
  iteration: number
  
  // 迭代輸入
  input: {
    tasks: string[]
    constraints: OptimizationConstraint[]
    strategy: DistributionStrategy
  }
  
  // 迭代結果
  output: {
    slots: ScheduledSlot[]
    score: number
    improvements: string[]
  }
  
  // 性能指標
  performance: {
    executionTime: number    // 執行時間（毫秒）
    memoryUsage: number     // 記憶體使用（KB）
    complexity: number      // 計算複雜度
  }
  
  // 元數據
  timestamp: Date
}

/**
 * 排程事件監聽
 */
export interface SchedulingEvent {
  type: SchedulingEventType
  data: any
  timestamp: Date
  source: string
}

/**
 * 排程事件類型
 */
export type SchedulingEventType = 
  | 'session_started'       // 會話開始
  | 'task_analyzed'        // 任務分析完成
  | 'schedule_generated'   // 排程生成
  | 'optimization_complete' // 優化完成
  | 'conflict_detected'    // 衝突檢測
  | 'resolution_applied'   // 解決方案應用
  | 'session_completed'    // 會話完成
  | 'error_occurred'       // 錯誤發生

/**
 * 排程Context類型定義
 */
export interface SchedulingContextType {
  // 狀態
  currentSession: SchedulingSession | null
  scheduledSlots: ScheduledSlot[]
  dailyCapacities: Map<string, DailyCapacity>
  isScheduling: boolean
  
  // 核心功能
  scheduleTask: (taskId: string, deadline: Date, preferences?: Partial<UserSchedulingPreferences>) => Promise<SchedulingResult>
  rescheduleTask: (taskId: string, changes: any) => Promise<SchedulingResult>
  optimizeSchedule: (sessionId: string, config: OptimizationConfig) => Promise<SchedulingResult>
  
  // 容量管理
  getDailyCapacity: (date: Date) => DailyCapacity | null
  updateDailyCapacity: (date: Date, updates: Partial<DailyCapacity>) => Promise<boolean>
  calculateCapacityUtilization: (dateRange: { start: Date; end: Date }) => number
  
  // 時間段管理
  updateScheduledSlot: (slotId: string, updates: Partial<ScheduledSlot>) => Promise<boolean>
  moveScheduledSlot: (slotId: string, newDate: Date, newStartTime: string) => Promise<boolean>
  deleteScheduledSlot: (slotId: string) => Promise<boolean>
  
  // 衝突處理
  detectConflicts: (slots: ScheduledSlot[]) => Promise<SchedulingConflict[]>
  resolveConflict: (conflictId: string, resolutionId: string) => Promise<boolean>
  
  // 統計與分析
  getSchedulingStats: (dateRange: { start: Date; end: Date }) => Promise<SchedulingStats>
  analyzeSchedulingPatterns: (userId: string) => Promise<any>
  
  // 事件監聽
  addEventListener: (type: SchedulingEventType, listener: (event: SchedulingEvent) => void) => void
  removeEventListener: (type: SchedulingEventType, listener: (event: SchedulingEvent) => void) => void
}