// AI Analysis Types for Project Monitoring System

export interface ProgressMetrics {
  completionRate: number        // 完成率 (0-1)
  velocity: number             // 任務完成速度 (任務/天)
  burndownRate: number         // 燃盡圖斜率
  timeRemaining: number        // 剩餘天數
}

export interface RiskAssessment {
  overallRisk: 'low' | 'medium' | 'high' | 'critical'
  delayProbability: number     // 延遲機率 (0-1)
  riskFactors: string[]        // 風險因素列表
  recommendations: string[]     // AI 建議
}

export interface WorkingPatterns {
  workingHours: { start: number; end: number }
  productiveDay: string[]      // 高效工作日
  taskDifficulty: Record<string, number>
  procrastinationTrend: number // 拖延趨勢
}

export interface ProjectAnalysis {
  id: string
  projectId: string
  userId: string
  analysisDate: Date
  
  // 進度指標
  progressMetrics: ProgressMetrics
  
  // 風險評估
  riskAssessment: RiskAssessment
  
  // 模式識別
  patterns: WorkingPatterns
  
  // 下次分析時間
  nextAnalysis: Date
}

export interface AIRecommendation {
  id: string
  userId: string
  projectId?: string
  type: 'task_priority' | 'schedule_adjustment' | 'break_reminder' | 'health_alert'
  
  priority: 'low' | 'medium' | 'high' | 'urgent'
  title: string
  message: string
  actionable: boolean
  
  // 建議行動
  suggestedActions: {
    type: 'reschedule' | 'add_task' | 'take_break' | 'focus_session'
    parameters: Record<string, any>
  }[]
  
  // 顯示控制
  displayUntil: Date
  dismissed: boolean
  createdAt: Date
}

export interface AIAnalysisConfig {
  userId: string
  
  // 分析設定
  analysisFrequency: 'daily' | 'hourly' | 'realtime'
  riskThreshold: 'conservative' | 'moderate' | 'aggressive'
  recommendationTypes: string[]
  
  // 學習偏好
  learningEnabled: boolean
  adaptToUserBehavior: boolean
  
  // 通知設定
  notificationPreferences: {
    riskAlerts: boolean
    progressUpdates: boolean
    recommendations: boolean
  }
  
  lastUpdated: Date
}

// AI分析狀態
export type AnalysisStatus = 'pending' | 'analyzing' | 'completed' | 'error'

// 歷史數據點
export interface DataPoint {
  date: Date
  value: number
  metadata?: Record<string, any>
}

// 趨勢分析結果
export interface TrendAnalysis {
  direction: 'increasing' | 'decreasing' | 'stable'
  confidence: number // 0-1
  slope: number
  dataPoints: DataPoint[]
}