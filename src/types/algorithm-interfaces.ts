import { 
  PomodoroTask, 
  ScheduledSlot, 
  PomodoroSubtask, 
  TaskComplexity, 
  UserSchedulingPreferences,
  DistributionStrategyType,
  SchedulingConflict,
  ConflictResolution
} from './pomodoro-task'

import { 
  DailyCapacity,
  SchedulingResult,
  DistributionStrategy,
  OptimizationConfig,
  SchedulingSession,
  AlternativeSchedule
} from './scheduling'

import { 
  CapacityAllocationRequest,
  CapacityAllocationResult,
  CapacityUtilizationAnalysis
} from './capacity-management'

/**
 * 智慧排程引擎介面
 * 核心排程算法的統一介面
 */
export interface SmartSchedulingEngine {
  // 主要排程功能
  scheduleTask: (params: TaskSchedulingParams) => Promise<SchedulingResult>
  rescheduleTask: (params: ReschedulingParams) => Promise<SchedulingResult>
  batchScheduleTasks: (params: BatchSchedulingParams) => Promise<BatchSchedulingResult>
  
  // 任務分解
  analyzeTaskComplexity: (task: PomodoroTask) => Promise<TaskComplexity>
  suggestSubtaskBreakdown: (task: PomodoroTask) => Promise<PomodoroSubtask[]>
  optimizeSubtaskSequence: (subtasks: PomodoroSubtask[]) => Promise<PomodoroSubtask[]>
  
  // 策略選擇
  selectOptimalStrategy: (params: StrategySelectionParams) => Promise<DistributionStrategy>
  evaluateStrategies: (task: PomodoroTask, strategies: DistributionStrategy[]) => Promise<StrategyEvaluation[]>
  
  // 衝突處理
  detectConflicts: (slots: ScheduledSlot[]) => Promise<SchedulingConflict[]>
  generateResolutions: (conflicts: SchedulingConflict[]) => Promise<ConflictResolution[]>
  applyResolution: (conflictId: string, resolutionId: string) => Promise<boolean>
  
  // 優化功能
  optimizeSchedule: (sessionId: string, config: OptimizationConfig) => Promise<SchedulingResult>
  validateScheduleFeasibility: (slots: ScheduledSlot[]) => Promise<FeasibilityResult>
}

/**
 * 任務排程參數
 */
export interface TaskSchedulingParams {
  task: PomodoroTask
  deadline: Date
  preferences?: Partial<UserSchedulingPreferences>
  constraints?: SchedulingConstraint[]
  availableCapacity?: DailyCapacity[]
  existingSlots?: ScheduledSlot[]
}

/**
 * 重新排程參數
 */
export interface ReschedulingParams {
  taskId: string
  changes: Partial<PomodoroTask>
  strategy?: 'minimal' | 'optimal' | 'user_guided'
  preserveConstraints?: boolean
  affectedTasksOnly?: boolean
}

/**
 * 批量排程參數
 */
export interface BatchSchedulingParams {
  tasks: PomodoroTask[]
  globalDeadline?: Date
  prioritization?: 'deadline' | 'priority' | 'complexity' | 'dependency'
  balanceWorkload?: boolean
  preferences?: UserSchedulingPreferences
}

/**
 * 批量排程結果
 */
export interface BatchSchedulingResult {
  success: boolean
  results: Map<string, SchedulingResult>
  overallSchedule: ScheduledSlot[]
  conflicts: SchedulingConflict[]
  statistics: BatchSchedulingStatistics
  recommendations: string[]
}

/**
 * 批量排程統計
 */
export interface BatchSchedulingStatistics {
  totalTasks: number
  successfullyScheduled: number
  failed: number
  totalPomodoros: number
  averageTaskSize: number
  schedulingDuration: number
  utilizationRate: number
}

/**
 * 策略選擇參數
 */
export interface StrategySelectionParams {
  task: PomodoroTask
  userPreferences: UserSchedulingPreferences
  availableTime: number
  complexity: TaskComplexity
  constraints: SchedulingConstraint[]
}

/**
 * 策略評估結果
 */
export interface StrategyEvaluation {
  strategy: DistributionStrategy
  score: number
  pros: string[]
  cons: string[]
  riskLevel: 'low' | 'medium' | 'high'
  suitabilityScore: number
  predictedOutcome: StrategyOutcome
}

/**
 * 策略結果預測
 */
export interface StrategyOutcome {
  estimatedCompletionRate: number
  workloadDistribution: number[]
  stressLevel: number
  flexibilityScore: number
  riskFactors: string[]
}

/**
 * 排程約束
 */
export interface SchedulingConstraint {
  id: string
  type: ConstraintType
  severity: 'hard' | 'soft'
  description: string
  condition: ConstraintCondition
  penalty?: number
  priority?: number
}

/**
 * 約束類型
 */
export type ConstraintType = 
  | 'time_window'       // 時間窗口約束
  | 'resource_limit'    // 資源限制約束
  | 'dependency'        // 依賴約束
  | 'capacity'          // 容量約束
  | 'preference'        // 偏好約束
  | 'business_rule'     // 業務規則約束

/**
 * 約束條件
 */
export interface ConstraintCondition {
  field: string
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'ge' | 'le' | 'in' | 'between' | 'overlaps'
  value: any
  context?: Record<string, any>
}

/**
 * 可行性結果
 */
export interface FeasibilityResult {
  feasible: boolean
  score: number
  violations: ConstraintViolation[]
  suggestions: FeasibilitySuggestion[]
  alternativeOptions: AlternativeSchedule[]
}

/**
 * 約束違反
 */
export interface ConstraintViolation {
  constraintId: string
  severity: 'warning' | 'error' | 'critical'
  description: string
  affectedSlots: string[]
  suggestedFixes: string[]
}

/**
 * 可行性建議
 */
export interface FeasibilitySuggestion {
  type: 'constraint_relaxation' | 'schedule_adjustment' | 'resource_allocation'
  description: string
  impact: string
  effort: 'low' | 'medium' | 'high'
}

/**
 * 分配策略算法介面
 */
export interface DistributionAlgorithm {
  // 算法標識
  name: string
  type: DistributionStrategyType
  version: string
  
  // 核心功能
  calculate: (params: DistributionCalculationParams) => Promise<DistributionResult>
  validate: (result: DistributionResult) => Promise<ValidationResult>
  optimize: (result: DistributionResult, config: OptimizationConfig) => Promise<DistributionResult>
  
  // 算法特性
  getCapabilities: () => AlgorithmCapabilities
  getPerformanceProfile: () => PerformanceProfile
}

/**
 * 分配計算參數
 */
export interface DistributionCalculationParams {
  totalPomodoros: number
  availableDays: number
  dailyCapacity: number
  constraints: SchedulingConstraint[]
  preferences: UserSchedulingPreferences
  taskComplexity: TaskComplexity
  existingSchedule?: ScheduledSlot[]
}

/**
 * 分配結果
 */
export interface DistributionResult {
  strategy: DistributionStrategy
  distribution: DailyAllocation[]
  score: number
  confidence: number
  metadata: {
    algorithm: string
    version: string
    executionTime: number
    iterations?: number
  }
}

/**
 * 日分配
 */
export interface DailyAllocation {
  day: number
  date: Date
  pomodoros: number
  timeSlots: TimeSlotAllocation[]
  confidence: number
  flexibility: 'low' | 'medium' | 'high'
  riskFactors: string[]
}

/**
 * 時段分配
 */
export interface TimeSlotAllocation {
  startTime: string
  endTime: string
  pomodoros: number
  subtaskId?: string
  priority: TaskPriority
  confidence: number
}

/**
 * 驗證結果
 */
export interface ValidationResult {
  valid: boolean
  score: number
  issues: ValidationIssue[]
  suggestions: string[]
}

/**
 * 驗證問題
 */
export interface ValidationIssue {
  type: 'error' | 'warning' | 'info'
  code: string
  description: string
  severity: number
  affectedElements: string[]
  suggestedFixes: string[]
}

/**
 * 算法能力
 */
export interface AlgorithmCapabilities {
  supportedStrategies: DistributionStrategyType[]
  maxTaskSize: number
  minTaskSize: number
  supportsBatchProcessing: boolean
  supportsRealTimeOptimization: boolean
  supportsConstraints: ConstraintType[]
  memoryRequirement: 'low' | 'medium' | 'high'
  computationalComplexity: 'O(n)' | 'O(n log n)' | 'O(n²)' | 'O(n³)'
}

/**
 * 性能配置
 */
export interface PerformanceProfile {
  averageExecutionTime: number
  worstCaseExecutionTime: number
  memoryUsage: number
  accuracyRate: number
  stabilityScore: number
  scalabilityLimit: number
}

/**
 * 衝突檢測引擎介面
 */
export interface ConflictDetectionEngine {
  // 衝突檢測
  detectTimeOverlaps: (slots: ScheduledSlot[]) => Promise<SchedulingConflict[]>
  detectCapacityExceeded: (slots: ScheduledSlot[], capacities: DailyCapacity[]) => Promise<SchedulingConflict[]>
  detectDependencyViolations: (subtasks: PomodoroSubtask[]) => Promise<SchedulingConflict[]>
  detectDeadlineConflicts: (tasks: PomodoroTask[]) => Promise<SchedulingConflict[]>
  
  // 衝突分析
  analyzeConflictSeverity: (conflict: SchedulingConflict) => Promise<ConflictSeverityAnalysis>
  predictConflictImpact: (conflict: SchedulingConflict) => Promise<ConflictImpactPrediction>
  
  // 衝突預防
  validateBeforeScheduling: (proposedSlots: ScheduledSlot[]) => Promise<ConflictPreventionResult>
  suggestConflictPrevention: (task: PomodoroTask) => Promise<PreventionSuggestion[]>
}

/**
 * 衝突嚴重度分析
 */
export interface ConflictSeverityAnalysis {
  severity: 'low' | 'medium' | 'high' | 'critical'
  urgency: number
  impactScope: string[]
  cascadingEffects: string[]
  resolutionComplexity: 'simple' | 'moderate' | 'complex' | 'expert'
}

/**
 * 衝突影響預測
 */
export interface ConflictImpactPrediction {
  affectedTasks: number
  delayedDeadlines: number
  capacityOverrun: number
  userSatisfactionImpact: number
  systemStabilityImpact: number
  recommendedAction: 'resolve_immediately' | 'schedule_resolution' | 'monitor' | 'ignore'
}

/**
 * 衝突預防結果
 */
export interface ConflictPreventionResult {
  safe: boolean
  potentialConflicts: PotentialConflict[]
  preventionActions: PreventionAction[]
  riskScore: number
}

/**
 * 潛在衝突
 */
export interface PotentialConflict {
  type: ConflictType
  probability: number
  description: string
  triggerConditions: string[]
  preventionStrategies: string[]
}

/**
 * 預防行動
 */
export interface PreventionAction {
  type: 'adjust_timing' | 'modify_capacity' | 'change_strategy' | 'add_buffer'
  description: string
  effort: 'low' | 'medium' | 'high'
  effectiveness: number
}

/**
 * 預防建議
 */
export interface PreventionSuggestion {
  title: string
  description: string
  benefit: string
  implementation: string
  priority: 'high' | 'medium' | 'low'
}

/**
 * 優化引擎介面
 */
export interface OptimizationEngine {
  // 優化功能
  optimizeForCompletion: (session: SchedulingSession) => Promise<OptimizationResult>
  optimizeForBalance: (session: SchedulingSession) => Promise<OptimizationResult>
  optimizeForEfficiency: (session: SchedulingSession) => Promise<OptimizationResult>
  customOptimization: (session: SchedulingSession, objectives: OptimizationObjective[]) => Promise<OptimizationResult>
  
  // 優化分析
  analyzeCurrentSchedule: (slots: ScheduledSlot[]) => Promise<ScheduleAnalysis>
  identifyOptimizationOpportunities: (schedule: ScheduledSlot[]) => Promise<OptimizationOpportunity[]>
  predictOptimizationImpact: (opportunity: OptimizationOpportunity) => Promise<OptimizationImpact>
}

/**
 * 優化目標
 */
export interface OptimizationObjective {
  type: 'minimize_completion_time' | 'maximize_utilization' | 'balance_workload' | 'minimize_conflicts'
  weight: number
  constraints: SchedulingConstraint[]
  priority: number
}

/**
 * 優化結果
 */
export interface OptimizationResult {
  success: boolean
  improvementScore: number
  optimizedSchedule: ScheduledSlot[]
  changes: ScheduleChange[]
  metrics: OptimizationMetrics
  tradeoffs: Tradeoff[]
}

/**
 * 優化指標
 */
export interface OptimizationMetrics {
  executionTime: number
  iterationsCount: number
  convergenceScore: number
  stabilityScore: number
  qualityImprovement: number
  efficiencyGain: number
}

/**
 * 權衡分析
 */
export interface Tradeoff {
  aspect: string
  before: number
  after: number
  change: number
  significance: 'minor' | 'moderate' | 'major'
  description: string
}

/**
 * 排程分析
 */
export interface ScheduleAnalysis {
  overallScore: number
  strengths: string[]
  weaknesses: string[]
  riskFactors: string[]
  efficiency: EfficiencyAnalysis
  balance: BalanceAnalysis
  feasibility: FeasibilityAnalysis
}

/**
 * 效率分析
 */
export interface EfficiencyAnalysis {
  utilizationRate: number
  wasteTimePercentage: number
  fragmentationScore: number
  batchingEfficiency: number
}

/**
 * 平衡分析
 */
export interface BalanceAnalysis {
  workloadVariance: number
  timeDistributionBalance: number
  capacityBalance: number
  stressLevel: number
}

/**
 * 可行性分析
 */
export interface FeasibilityAnalysis {
  completionProbability: number
  riskLevel: number
  criticalPath: string[]
  bufferTime: number
}

/**
 * 優化機會
 */
export interface OptimizationOpportunity {
  id: string
  type: 'timing_adjustment' | 'capacity_reallocation' | 'task_reordering' | 'strategy_change'
  description: string
  expectedBenefit: number
  implementationCost: number
  riskLevel: number
  priority: number
}

/**
 * 優化影響
 */
export interface OptimizationImpact {
  benefitScore: number
  costScore: number
  riskScore: number
  netValue: number
  affectedElements: string[]
  sideEffects: string[]
}

/**
 * 排程變更
 */
export interface ScheduleChange {
  id: string
  type: 'slot_moved' | 'slot_resized' | 'slot_split' | 'slot_merged' | 'slot_deleted' | 'slot_created'
  description: string
  before?: any
  after?: any
  reason: string
  impact: number
}