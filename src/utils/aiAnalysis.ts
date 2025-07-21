import type { Todo } from '../types/todo'
import type { Project } from '../types/project'
import type { 
  ProjectAnalysis, 
  ProgressMetrics, 
  RiskAssessment, 
  WorkingPatterns,
  AIRecommendation,
  DataPoint
} from '../types/ai'

/**
 * AI 進度分析器
 * 基於用戶任務完成數據分析專案進度和風險
 */
export class ProgressAnalyzer {
  /**
   * 計算專案完成率趨勢
   */
  analyzeCompletionTrend(project: Project, todos: Todo[]): ProgressMetrics {
    const totalTasks = todos.length
    const completedTasks = todos.filter(t => t.completed).length
    const currentRate = totalTasks > 0 ? completedTasks / totalTasks : 0
    
    // 基於歷史數據計算速度
    const historicalData = this.getHistoricalProgress(project.id)
    const velocity = this.calculateVelocity(historicalData, todos)
    
    // 預測完成時間
    const remainingTasks = totalTasks - completedTasks
    const estimatedDaysToComplete = velocity > 0 ? remainingTasks / velocity : Infinity
    
    return {
      completionRate: currentRate,
      velocity,
      burndownRate: this.calculateBurndownRate(historicalData),
      timeRemaining: estimatedDaysToComplete
    }
  }

  /**
   * 獲取歷史進度數據
   */
  private getHistoricalProgress(projectId: string): DataPoint[] {
    const key = `project_progress_${projectId}`
    const stored = localStorage.getItem(key)
    
    if (!stored) return []
    
    try {
      const data = JSON.parse(stored)
      return data.map((point: any) => ({
        ...point,
        date: new Date(point.date)
      }))
    } catch {
      return []
    }
  }

  /**
   * 計算任務完成速度 (任務/天)
   */
  private calculateVelocity(historicalData: DataPoint[], todos: Todo[]): number {
    if (historicalData.length < 2) {
      // 如果沒有足夠歷史數據，基於創建時間估算
      return this.estimateInitialVelocity(todos)
    }

    // 計算最近7天的平均速度
    const recentData = historicalData
      .filter(point => {
        const daysDiff = (Date.now() - point.date.getTime()) / (1000 * 60 * 60 * 24)
        return daysDiff <= 7
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime())

    if (recentData.length < 2) {
      return this.estimateInitialVelocity(todos)
    }

    const firstPoint = recentData[0]
    const lastPoint = recentData[recentData.length - 1]
    const daysDiff = (lastPoint.date.getTime() - firstPoint.date.getTime()) / (1000 * 60 * 60 * 24)
    const tasksDiff = lastPoint.value - firstPoint.value

    return daysDiff > 0 ? tasksDiff / daysDiff : 0
  }

  /**
   * 估算初始速度（基於任務創建時間分布）
   */
  private estimateInitialVelocity(todos: Todo[]): number {
    const completedTodos = todos.filter(t => t.completed)
    
    if (completedTodos.length === 0) return 0.5 // 預設每日0.5個任務

    // 計算完成任務的時間跨度
    const completionDates = completedTodos.map(t => t.createdAt.getTime())
    const oldestDate = Math.min(...completionDates)
    const newestDate = Math.max(...completionDates)
    
    const daySpan = Math.max(1, (newestDate - oldestDate) / (1000 * 60 * 60 * 24))
    
    return completedTodos.length / daySpan
  }

  /**
   * 計算燃盡圖斜率
   */
  private calculateBurndownRate(historicalData: DataPoint[]): number {
    if (historicalData.length < 2) return 0

    const sortedData = historicalData.sort((a, b) => a.date.getTime() - b.date.getTime())
    const firstPoint = sortedData[0]
    const lastPoint = sortedData[sortedData.length - 1]
    
    const timeDiff = lastPoint.date.getTime() - firstPoint.date.getTime()
    const valueDiff = lastPoint.value - firstPoint.value
    
    return timeDiff > 0 ? valueDiff / (timeDiff / (1000 * 60 * 60 * 24)) : 0
  }

  /**
   * 識別工作模式
   */
  identifyWorkingPatterns(userId: string, todos: Todo[]): WorkingPatterns {
    const activityData = this.getUserActivityData(userId, todos)
    
    return {
      workingHours: this.findOptimalWorkingHours(activityData),
      productiveDay: this.identifyProductiveDays(activityData),
      taskDifficulty: this.analyzeTaskComplexity(todos),
      procrastinationTrend: this.calculateProcrastinationScore(todos)
    }
  }

  /**
   * 獲取用戶活動數據
   */
  private getUserActivityData(userId: string, todos: Todo[]): DataPoint[] {
    // 基於完成任務的時間分析活動模式
    return todos
      .filter(t => t.completed && t.userId === userId)
      .map(t => ({
        date: t.createdAt,
        value: 1,
        metadata: { hour: t.createdAt.getHours(), day: t.createdAt.getDay() }
      }))
  }

  /**
   * 找出最佳工作時間
   */
  private findOptimalWorkingHours(activityData: DataPoint[]): { start: number; end: number } {
    const hourlyActivity = new Array(24).fill(0)
    
    activityData.forEach(point => {
      const hour = point.metadata?.hour
      if (typeof hour === 'number') {
        hourlyActivity[hour]++
      }
    })

    // 找出活動最頻繁的時間段
    const maxActivity = Math.max(...hourlyActivity)
    const threshold = maxActivity * 0.6 // 60% 閾值

    let start = 9 // 預設早上9點
    let end = 17   // 預設下午5點

    for (let i = 0; i < 24; i++) {
      if (hourlyActivity[i] >= threshold) {
        start = i
        break
      }
    }

    for (let i = 23; i >= 0; i--) {
      if (hourlyActivity[i] >= threshold) {
        end = i + 1
        break
      }
    }

    return { start, end }
  }

  /**
   * 識別高效工作日
   */
  private identifyProductiveDays(activityData: DataPoint[]): string[] {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const dailyActivity = new Array(7).fill(0)
    
    activityData.forEach(point => {
      const day = point.metadata?.day
      if (typeof day === 'number') {
        dailyActivity[day]++
      }
    })

    const avgActivity = dailyActivity.reduce((sum, count) => sum + count, 0) / 7
    
    return dayNames.filter((_, index) => dailyActivity[index] > avgActivity)
  }

  /**
   * 分析任務複雜度
   */
  private analyzeTaskComplexity(todos: Todo[]): Record<string, number> {
    const complexity: Record<string, number> = {}
    
    todos.forEach(todo => {
      // 基於任務文字長度和關鍵字判斷複雜度
      let score = 0.3 // 基礎分數
      
      const text = todo.text.toLowerCase()
      const length = text.length
      
      // 長度影響
      if (length > 100) score += 0.3
      else if (length > 50) score += 0.2
      else if (length > 20) score += 0.1
      
      // 複雜關鍵字
      const complexKeywords = ['implement', 'design', 'analyze', 'optimize', 'refactor', '設計', '分析', '優化', '重構']
      const simpleKeywords = ['fix', 'update', 'add', '修復', '更新', '添加']
      
      const hasComplex = complexKeywords.some(keyword => text.includes(keyword))
      const hasSimple = simpleKeywords.some(keyword => text.includes(keyword))
      
      if (hasComplex) score += 0.4
      else if (hasSimple) score -= 0.2
      
      complexity[todo.id] = Math.max(0, Math.min(1, score))
    })
    
    return complexity
  }

  /**
   * 計算拖延趨勢分數
   */
  private calculateProcrastinationScore(todos: Todo[]): number {
    if (todos.length === 0) return 0

    const now = Date.now()
    const dayMs = 1000 * 60 * 60 * 24
    
    let procrastinationEvents = 0
    let totalTasks = 0
    
    todos.forEach(todo => {
      const ageInDays = (now - todo.createdAt.getTime()) / dayMs
      
      // 超過3天未完成的任務算作拖延
      if (!todo.completed && ageInDays > 3) {
        procrastinationEvents++
      }
      
      if (ageInDays <= 14) { // 只考慮最近14天的任務
        totalTasks++
      }
    })
    
    return totalTasks > 0 ? procrastinationEvents / totalTasks : 0
  }

  /**
   * 保存進度數據點
   */
  saveProgressDataPoint(projectId: string, completedCount: number): void {
    const key = `project_progress_${projectId}`
    const existingData = this.getHistoricalProgress(projectId)
    
    const newDataPoint: DataPoint = {
      date: new Date(),
      value: completedCount
    }
    
    existingData.push(newDataPoint)
    
    // 只保留最近30天的數據
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000)
    const filteredData = existingData.filter(point => 
      point.date.getTime() > thirtyDaysAgo
    )
    
    localStorage.setItem(key, JSON.stringify(filteredData))
  }
}

/**
 * 風險評估器
 */
export class RiskAssessmentAnalyzer {
  /**
   * 評估專案延遲風險
   */
  assessDelayRisk(
    progressMetrics: ProgressMetrics, 
    project: Project, 
    patterns: WorkingPatterns
  ): RiskAssessment {
    const factors: string[] = []
    let riskScore = 0
    
    // 時間因素
    const daysUntilDeadline = this.getDaysUntilDeadline(project)
    const estimatedTimeNeeded = progressMetrics.timeRemaining
    
    if (estimatedTimeNeeded > daysUntilDeadline && daysUntilDeadline > 0) {
      riskScore += 0.4
      factors.push('時間不足')
    }
    
    // 速度因素
    if (progressMetrics.velocity < 0.5) {
      riskScore += 0.3
      factors.push('完成速度過慢')
    }
    
    // 拖延因素
    if (patterns.procrastinationTrend > 0.7) {
      riskScore += 0.2
      factors.push('拖延趨勢增加')
    }
    
    // 進度因素
    if (progressMetrics.completionRate < 0.3 && daysUntilDeadline < 7) {
      riskScore += 0.1
      factors.push('進度嚴重落後')
    }
    
    return {
      overallRisk: this.determineRiskLevel(riskScore),
      delayProbability: Math.min(1, riskScore),
      riskFactors: factors,
      recommendations: this.generateRecommendations(riskScore, factors)
    }
  }

  /**
   * 計算距離截止日期的天數
   */
  private getDaysUntilDeadline(_project: Project): number {
    // 假設專案有截止日期字段，如果沒有就返回30天
    // 這裡需要根據實際的 Project 類型來調整
    const deadline = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 預設30天
    const now = new Date()
    
    return Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  }

  /**
   * 確定風險等級
   */
  private determineRiskLevel(riskScore: number): 'low' | 'medium' | 'high' | 'critical' {
    if (riskScore >= 0.8) return 'critical'
    if (riskScore >= 0.6) return 'high'
    if (riskScore >= 0.3) return 'medium'
    return 'low'
  }

  /**
   * 生成 AI 建議
   */
  private generateRecommendations(riskScore: number, factors: string[]): string[] {
    const recommendations: string[] = []
    
    if (riskScore >= 0.6) {
      recommendations.push('建議重新評估專案範圍和時程')
      recommendations.push('考慮將大任務分解為更小的可管理任務')
    }
    
    if (factors.includes('時間不足')) {
      recommendations.push('優先處理關鍵路徑上的任務')
      recommendations.push('考慮延後非核心功能的開發')
    }
    
    if (factors.includes('完成速度過慢')) {
      recommendations.push('使用番茄鐘技巧提升專注力')
      recommendations.push('減少多任務處理，專注單一任務')
    }
    
    if (factors.includes('拖延趨勢增加')) {
      recommendations.push('設定短期里程碑增加成就感')
      recommendations.push('建立每日例行工作習慣')
    }
    
    if (recommendations.length === 0) {
      recommendations.push('目前進度良好，保持現有工作節奏')
    }
    
    return recommendations
  }
}

/**
 * AI 建議生成器
 */
export class RecommendationEngine {
  /**
   * 基於分析結果生成建議
   */
  generateRecommendations(
    analysis: ProjectAnalysis,
    project: Project,
    todos: Todo[]
  ): AIRecommendation[] {
    const recommendations: AIRecommendation[] = []
    
    // 基於風險等級生成建議
    if (analysis.riskAssessment.overallRisk === 'high' || analysis.riskAssessment.overallRisk === 'critical') {
      recommendations.push(this.createUrgentRecommendation(analysis, project))
    }
    
    // 基於工作模式生成建議
    if (analysis.patterns.procrastinationTrend > 0.5) {
      recommendations.push(this.createFocusRecommendation(analysis))
    }
    
    // 基於任務負載生成建議
    const incompleteTasks = todos.filter(t => !t.completed).length
    if (incompleteTasks > 10) {
      recommendations.push(this.createTaskManagementRecommendation(incompleteTasks))
    }
    
    return recommendations.filter(Boolean)
  }

  private createUrgentRecommendation(_analysis: ProjectAnalysis, project: Project): AIRecommendation {
    return {
      id: crypto.randomUUID(),
      userId: project.userId,
      projectId: project.id,
      type: 'schedule_adjustment',
      priority: 'urgent',
      title: '⚠️ 專案進度警告',
      message: `專案「${project.name}」面臨延遲風險，建議立即調整工作計劃`,
      actionable: true,
      suggestedActions: [
        {
          type: 'reschedule',
          parameters: { priority: 'high', focusMode: true }
        }
      ],
      displayUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      dismissed: false,
      createdAt: new Date()
    }
  }

  private createFocusRecommendation(analysis: ProjectAnalysis): AIRecommendation {
    return {
      id: crypto.randomUUID(),
      userId: analysis.userId,
      projectId: analysis.projectId,
      type: 'task_priority',
      priority: 'medium',
      title: '🎯 專注力提升建議',
      message: '檢測到拖延趨勢，建議使用番茄鐘技巧提升專注力',
      actionable: true,
      suggestedActions: [
        {
          type: 'focus_session',
          parameters: { duration: 25, breakAfter: true }
        }
      ],
      displayUntil: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      dismissed: false,
      createdAt: new Date()
    }
  }

  private createTaskManagementRecommendation(taskCount: number): AIRecommendation {
    return {
      id: crypto.randomUUID(),
      userId: '',
      type: 'task_priority',
      priority: 'medium',
      title: '📋 任務管理建議',
      message: `目前有 ${taskCount} 個未完成任務，建議優先處理重要任務`,
      actionable: true,
      suggestedActions: [
        {
          type: 'add_task',
          parameters: { action: 'prioritize', count: taskCount }
        }
      ],
      displayUntil: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      dismissed: false,
      createdAt: new Date()
    }
  }
}