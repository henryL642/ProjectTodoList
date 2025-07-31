import { DailyCapacity, WorkingHoursConfig, TimeBreak, PeakHourSlot } from './scheduling'
import { ScheduledSlot, TaskPriority } from './pomodoro-task'

/**
 * 容量管理器介面
 * 負責管理和分配日常番茄鐘容量
 */
export interface CapacityManager {
  // 容量查詢
  getDailyCapacity: (userId: string, date: Date) => Promise<DailyCapacity>
  getWeeklyCapacity: (userId: string, weekStart: Date) => Promise<WeeklyCapacity>
  getMonthlyCapacity: (userId: string, year: number, month: number) => Promise<MonthlyCapacity>
  
  // 容量分配
  allocateCapacity: (request: CapacityAllocationRequest) => Promise<CapacityAllocationResult>
  releaseCapacity: (slotId: string) => Promise<boolean>
  transferCapacity: (fromSlot: string, toSlot: string, amount: number) => Promise<boolean>
  
  // 容量分析
  analyzeCapacityUtilization: (userId: string, dateRange: DateRange) => Promise<CapacityUtilizationAnalysis>
  predictCapacityNeeds: (userId: string, tasks: string[]) => Promise<CapacityPrediction>
  
  // 容量優化
  optimizeCapacityDistribution: (userId: string, dateRange: DateRange) => Promise<CapacityOptimizationResult>
  balanceWorkload: (userId: string, tasks: string[]) => Promise<WorkloadBalanceResult>
}

/**
 * 週容量統計
 */
export interface WeeklyCapacity {
  userId: string
  weekStart: Date
  weekEnd: Date
  
  // 每日容量
  dailyCapacities: DailyCapacity[]
  
  // 週統計
  totalPomodoros: number
  availablePomodoros: number
  usedPomodoros: number
  utilizationRate: number
  
  // 模式分析
  peakDays: string[]           // 高峰日
  lightDays: string[]          // 輕量日
  averageDailyLoad: number     // 平均日負載
  
  // 建議
  recommendations: CapacityRecommendation[]
}

/**
 * 月容量統計
 */
export interface MonthlyCapacity {
  userId: string
  year: number
  month: number
  
  // 週統計
  weeklyCapacities: WeeklyCapacity[]
  
  // 月統計
  totalPomodoros: number
  workingDays: number
  averageDailyCapacity: number
  utilizationTrend: number[]   // 每日利用率趨勢
  
  // 容量分布
  capacityDistribution: {
    light: number              // 輕度工作日數
    medium: number             // 中度工作日數
    heavy: number              // 重度工作日數
    overload: number           // 超載日數
  }
  
  // 效率指標
  efficiencyMetrics: EfficiencyMetrics
}

/**
 * 容量分配請求
 */
export interface CapacityAllocationRequest {
  userId: string
  taskId: string
  subtaskId?: string
  
  // 分配需求
  requiredPomodoros: number
  preferredDate?: Date
  dateRange?: DateRange
  
  // 約束條件
  constraints: AllocationConstraint[]
  
  // 優先級
  priority: TaskPriority
  flexibility: 'rigid' | 'flexible' | 'adaptive'
  
  // 分配偏好
  preferences: {
    preferredTimeSlots: string[] // 偏好時段
    avoidTimeSlots: string[]     // 避免時段
    allowSplitting: boolean      // 允許分割
    minimumBlockSize: number     // 最小連續塊大小
  }
}

/**
 * 分配約束條件
 */
export interface AllocationConstraint {
  type: 'must' | 'should' | 'could'
  description: string
  condition: ConstraintCondition
  penalty?: number             // 違反懲罰
}

/**
 * 約束條件
 */
export interface ConstraintCondition {
  field: string                // 約束字段
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'ge' | 'le' | 'in' | 'between'
  value: any                   // 約束值
}

/**
 * 容量分配結果
 */
export interface CapacityAllocationResult {
  success: boolean
  message: string
  
  // 分配結果
  allocatedSlots: ScheduledSlot[]
  totalAllocated: number
  
  // 分配分析
  allocationStrategy: string
  utilizationImpact: number    // 對整體利用率的影響
  
  // 替代方案
  alternatives: AlternativeAllocation[]
  
  // 警告與建議
  warnings: string[]
  recommendations: string[]
}

/**
 * 替代分配方案
 */
export interface AlternativeAllocation {
  id: string
  description: string
  slots: ScheduledSlot[]
  score: number                // 評分
  tradeoffs: string[]          // 權衡說明
}

/**
 * 容量利用率分析
 */
export interface CapacityUtilizationAnalysis {
  userId: string
  dateRange: DateRange
  
  // 整體統計
  overallUtilization: number   // 整體利用率
  averageDailyUtilization: number
  peakUtilization: number
  minimumUtilization: number
  
  // 時間分布分析
  timeDistribution: {
    morning: number            // 上午利用率
    afternoon: number          // 下午利用率
    evening: number            // 晚上利用率
  }
  
  // 效率分析
  efficiencyPatterns: EfficiencyPattern[]
  
  // 容量健康指標
  healthMetrics: CapacityHealthMetrics
  
  // 改進建議
  improvements: ImprovementSuggestion[]
}

/**
 * 效率模式
 */
export interface EfficiencyPattern {
  type: 'peak' | 'valley' | 'steady' | 'volatile'
  timeSlot: string
  efficiency: number
  consistency: number
  description: string
  factors: string[]            // 影響因子
}

/**
 * 容量健康指標
 */
export interface CapacityHealthMetrics {
  overallHealth: 'excellent' | 'good' | 'fair' | 'poor'
  
  // 分項指標
  workloadBalance: number      // 工作負載平衡 (0-1)
  stressLevel: number         // 壓力水平 (0-1)
  sustainabilityScore: number // 可持續性評分 (0-1)
  burnoutRisk: number         // 倦怠風險 (0-1)
  
  // 警示標誌
  redFlags: string[]
  
  // 積極指標
  strengths: string[]
}

/**
 * 改進建議
 */
export interface ImprovementSuggestion {
  type: 'capacity' | 'efficiency' | 'balance' | 'health'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  expectedImpact: string
  implementationEffort: 'low' | 'medium' | 'high'
  timeframe: string
}

/**
 * 容量預測
 */
export interface CapacityPrediction {
  userId: string
  predictionPeriod: DateRange
  
  // 需求預測
  predictedDemand: DailyDemandPrediction[]
  
  // 容量缺口分析
  capacityGaps: CapacityGap[]
  
  // 風險評估
  risks: CapacityRisk[]
  
  // 建議調整
  recommendations: CapacityAdjustmentRecommendation[]
  
  // 預測準確度
  confidence: number           // 預測信心度 (0-1)
  historicalAccuracy: number   // 歷史準確率
}

/**
 * 日需求預測
 */
export interface DailyDemandPrediction {
  date: Date
  predictedDemand: number      // 預測需求（番茄鐘數）
  currentCapacity: number      // 當前容量
  gap: number                  // 缺口
  confidence: number           // 預測信心度
}

/**
 * 容量缺口
 */
export interface CapacityGap {
  date: Date
  gapSize: number              // 缺口大小
  severity: 'minor' | 'moderate' | 'severe' | 'critical'
  impact: string[]             // 影響描述
  suggestions: string[]        // 解決建議
}

/**
 * 容量風險
 */
export interface CapacityRisk {
  type: 'overload' | 'underutilization' | 'imbalance' | 'dependency'
  probability: number          // 發生機率 (0-1)
  impact: 'low' | 'medium' | 'high' | 'critical'
  description: string
  mitigation: string[]         // 緩解措施
}

/**
 * 容量調整建議
 */
export interface CapacityAdjustmentRecommendation {
  type: 'increase' | 'decrease' | 'redistribute' | 'optimize'
  target: string               // 調整目標
  amount: number               // 調整幅度
  reason: string              // 調整原因
  expectedOutcome: string     // 預期結果
  timeline: string            // 建議時間線
}

/**
 * 容量優化結果
 */
export interface CapacityOptimizationResult {
  optimizationType: 'redistribution' | 'expansion' | 'consolidation' | 'balancing'
  
  // 優化前後對比
  before: CapacitySnapshot
  after: CapacitySnapshot
  
  // 改進指標
  improvements: {
    utilizationImprovement: number  // 利用率提升
    balanceImprovement: number     // 平衡度提升
    efficiencyGain: number         // 效率提升
    stressReduction: number        // 壓力降低
  }
  
  // 實施計劃
  implementationPlan: OptimizationStep[]
  
  // 風險評估
  risks: string[]
  mitigations: string[]
}

/**
 * 容量快照
 */
export interface CapacitySnapshot {
  timestamp: Date
  totalCapacity: number
  utilizedCapacity: number
  utilizationRate: number
  balanceScore: number
  efficiencyScore: number
  healthScore: number
}

/**
 * 優化步驟
 */
export interface OptimizationStep {
  order: number
  title: string
  description: string
  estimatedDuration: number    // 預估持續時間（小時）
  requiredResources: string[]
  expectedBenefit: string
  dependencies: number[]       // 依賴的步驟序號
}

/**
 * 工作負載平衡結果
 */
export interface WorkloadBalanceResult {
  success: boolean
  balanceScore: number         // 平衡評分 (0-1)
  
  // 平衡前後對比
  originalDistribution: WorkloadDistribution
  balancedDistribution: WorkloadDistribution
  
  // 調整詳情
  adjustments: WorkloadAdjustment[]
  
  // 影響分析
  impactAnalysis: {
    affectedTasks: number
    timeShifted: number         // 總計調整時間（分鐘）
    deadlineChanges: number     // 影響截止日期的任務數
  }
  
  // 建議
  recommendations: string[]
}

/**
 * 工作負載分布
 */
export interface WorkloadDistribution {
  daily: { date: string; load: number }[]
  variance: number             // 方差
  standardDeviation: number    // 標準差
  peakLoad: number            // 峰值負載
  minimumLoad: number         // 最小負載
  balanceIndex: number        // 平衡指數 (0-1)
}

/**
 * 工作負載調整
 */
export interface WorkloadAdjustment {
  taskId: string
  subtaskId?: string
  adjustmentType: 'move' | 'split' | 'merge' | 'resize'
  fromDate: Date
  toDate: Date
  fromLoad: number
  toLoad: number
  reason: string
}

/**
 * 日期範圍
 */
export interface DateRange {
  start: Date
  end: Date
}

/**
 * 容量建議
 */
export interface CapacityRecommendation {
  type: 'increase' | 'decrease' | 'redistribute' | 'rest'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  impact: string
  effort: 'low' | 'medium' | 'high'
}

/**
 * 效率指標
 */
export interface EfficiencyMetrics {
  overallEfficiency: number    // 整體效率
  timeToCompletion: number    // 平均完成時間
  interruptionRate: number    // 中斷率
  focusScore: number          // 專注度評分
  qualityScore: number        // 質量評分
  consistencyScore: number    // 一致性評分
}