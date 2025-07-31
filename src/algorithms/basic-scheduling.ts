/**
 * 基礎智慧排程算法實作
 * 提供簡單但功能完整的排程邏輯用於驗證和演示
 */

import type {
  PomodoroTask,
  ScheduledSlot,
  PomodoroSubtask,
  TaskComplexity,
  UserSchedulingPreferences
} from '../types/pomodoro-task'

import type {
  DailyCapacity,
  SchedulingResult,
  DistributionStrategy
} from '../types/scheduling'

import { DefaultValues } from '../types/index'

/**
 * 基礎排程引擎
 * 實作最核心的排程功能
 */
export class BasicSchedulingEngine {
  
  /**
   * 智慧排程任務
   */
  async scheduleTask(
    task: PomodoroTask,
    deadline: Date,
    preferences: Partial<UserSchedulingPreferences> = {},
    availableCapacities: DailyCapacity[] = []
  ): Promise<SchedulingResult> {
    
    try {
      console.log(`🚀 開始排程任務: ${task.text}`)
      console.log(`📅 截止日期: ${deadline.toLocaleDateString()}`)
      console.log(`🍅 預估番茄鐘: ${task.estimatedPomodoros}`)
      
      // 1. 分析任務複雜度
      const complexity = await this.analyzeTaskComplexity(task)
      console.log(`🧠 任務複雜度: ${complexity.category} (${complexity.score.toFixed(2)})`)
      
      // 2. 建議子任務分解
      let subtasks: PomodoroSubtask[] = []
      if (task.estimatedPomodoros > 4 && !task.isSubdivided) {
        subtasks = await this.suggestSubtaskBreakdown(task)
        console.log(`🧩 建議分解為 ${subtasks.length} 個子任務`)
      }
      
      // 3. 計算可用天數
      const availableDays = this.calculateAvailableDays(new Date(), deadline)
      console.log(`📆 可用天數: ${availableDays}`)
      
      // 4. 選擇分配策略
      const strategy = this.selectDistributionStrategy(task, availableDays, preferences)
      console.log(`⚡ 選擇策略: ${strategy.name}`)
      
      // 5. 生成排程時間段
      const scheduledSlots = await this.generateScheduledSlots(
        task,
        strategy,
        availableDays,
        preferences
      )
      console.log(`📋 生成 ${scheduledSlots.length} 個時間段`)
      
      // 6. 驗證排程可行性
      const feasibility = this.validateScheduleFeasibility(scheduledSlots, deadline)
      console.log(`✅ 可行性評分: ${feasibility.toFixed(2)}`)
      
      const result: SchedulingResult = {
        success: true,
        message: `✅ 任務 "${task.text}" 已成功排程到 ${availableDays} 天內完成`,
        scheduledSlots,
        suggestedSubtasks: subtasks,
        strategy,
        complexity,
        estimatedCompletionDate: this.calculateCompletionDate(scheduledSlots),
        confidence: feasibility,
        feasibility,
        riskAssessment: this.assessRisk(task, scheduledSlots, deadline),
        alternatives: [],
        generatedAt: new Date(),
        generatedBy: 'system'
      }
      
      console.log(`🎉 排程完成，信心度: ${(feasibility * 100).toFixed(1)}%`)
      return result
      
    } catch (error) {
      console.error('❌ 排程失敗:', error)
      
      return {
        success: false,
        message: `❌ 排程失敗: ${error instanceof Error ? error.message : '未知錯誤'}`,
        scheduledSlots: [],
        suggestedSubtasks: [],
        strategy: this.getDefaultStrategy(),
        complexity: { score: 0, factors: { estimatedTime: 0, dependencies: 0, skillRequirement: 0, uncertainty: 0 }, category: 'simple', suggestions: [] },
        estimatedCompletionDate: deadline,
        confidence: 0,
        feasibility: 0,
        riskAssessment: { overall: 'critical', factors: [], mitigation: [] },
        alternatives: [],
        generatedAt: new Date(),
        generatedBy: 'system'
      }
    }
  }
  
  /**
   * 分析任務複雜度
   */
  async analyzeTaskComplexity(task: PomodoroTask): Promise<TaskComplexity> {
    // 基於任務大小和描述的簡單複雜度分析
    const sizeScore = Math.min(task.estimatedPomodoros / 20, 1) // 正規化到0-1
    const textComplexityScore = this.analyzeTextComplexity(task.text)
    const dependencyScore = task.subtasks.length > 0 ? 0.8 : 0.2
    
    const factors = {
      estimatedTime: sizeScore,
      dependencies: dependencyScore,
      skillRequirement: textComplexityScore,
      uncertainty: sizeScore * 0.5 // 任務越大，不確定性越高
    }
    
    const overallScore = (factors.estimatedTime + factors.dependencies + 
                         factors.skillRequirement + factors.uncertainty) / 4
    
    let category: 'simple' | 'moderate' | 'complex' | 'expert'
    if (overallScore < 0.3) category = 'simple'
    else if (overallScore < 0.6) category = 'moderate'
    else if (overallScore < 0.8) category = 'complex'
    else category = 'expert'
    
    const suggestions = this.generateComplexitySuggestions(category, overallScore)
    
    return {
      score: overallScore,
      factors,
      category,
      suggestions
    }
  }
  
  /**
   * 建議子任務分解
   */
  async suggestSubtaskBreakdown(task: PomodoroTask): Promise<PomodoroSubtask[]> {
    const subtasks: PomodoroSubtask[] = []
    const totalPomodoros = task.estimatedPomodoros
    
    // 基於任務類型的智慧分解
    if (task.text.includes('設計') || task.text.includes('design')) {
      // 設計任務分解
      subtasks.push(
        this.createSubtask(task.id, '需求分析與研究', Math.ceil(totalPomodoros * 0.2), 1),
        this.createSubtask(task.id, '概念設計與草圖', Math.ceil(totalPomodoros * 0.3), 2),
        this.createSubtask(task.id, '詳細設計與原型', Math.ceil(totalPomodoros * 0.4), 3),
        this.createSubtask(task.id, '設計驗證與調整', Math.ceil(totalPomodoros * 0.1), 4)
      )
    } else if (task.text.includes('開發') || task.text.includes('實作')) {
      // 開發任務分解
      subtasks.push(
        this.createSubtask(task.id, '需求分析與架構設計', Math.ceil(totalPomodoros * 0.25), 1),
        this.createSubtask(task.id, '核心功能開發', Math.ceil(totalPomodoros * 0.5), 2),
        this.createSubtask(task.id, '測試與除錯', Math.ceil(totalPomodoros * 0.2), 3),
        this.createSubtask(task.id, '文檔與部署', Math.ceil(totalPomodoros * 0.05), 4)
      )
    } else {
      // 通用分解策略：按25%-50%-25%比例
      subtasks.push(
        this.createSubtask(task.id, '準備與規劃', Math.ceil(totalPomodoros * 0.25), 1),
        this.createSubtask(task.id, '核心執行', Math.ceil(totalPomodoros * 0.5), 2),
        this.createSubtask(task.id, '檢查與完善', Math.ceil(totalPomodoros * 0.25), 3)
      )
    }
    
    // 確保總數相符
    const allocatedTotal = subtasks.reduce((sum, st) => sum + st.estimatedPomodoros, 0)
    if (allocatedTotal !== totalPomodoros) {
      // 調整最大的子任務
      const largestSubtask = subtasks.reduce((max, current) => 
        current.estimatedPomodoros > max.estimatedPomodoros ? current : max
      )
      largestSubtask.estimatedPomodoros += (totalPomodoros - allocatedTotal)
    }
    
    return subtasks
  }
  
  /**
   * 選擇分配策略
   */
  private selectDistributionStrategy(
    task: PomodoroTask,
    availableDays: number,
    preferences: Partial<UserSchedulingPreferences>
  ): DistributionStrategy {
    
    const dailyCapacity = preferences.maxDailyPomodoros || DefaultValues.DAILY_CAPACITY
    const requiredDays = Math.ceil(task.estimatedPomodoros / dailyCapacity)
    
    // 如果時間充裕，使用均勻分配
    if (availableDays >= requiredDays * 1.5) {
      return {
        type: 'even',
        name: '均勻分配策略',
        description: '將任務平均分配到可用時間，降低每日壓力',
        parameters: {
          bufferPercentage: 15,
          allowSplitting: true,
          minSlotSize: 1,
          maxSlotSize: Math.min(6, dailyCapacity),
          preferMorning: true,
          preferAfternoon: false,
          preferEvening: false
        },
        conditions: {
          minTaskSize: 1,
          maxTaskSize: 50,
          availableDays,
          userExperience: 'intermediate',
          taskType: ['general']
        },
        expectedOutcomes: {
          estimatedCompletionRate: 0.85,
          stressLevel: 'low',
          flexibility: 'high',
          riskLevel: 'low',
          suitability: 0.9
        }
      }
    }
    
    // 如果時間緊迫，使用前置載入
    if (availableDays <= requiredDays * 1.2) {
      return {
        type: 'frontLoaded',
        name: '前置載入策略',
        description: '優先完成大部分工作，為後期保留緩衝時間',
        parameters: {
          frontLoadRatio: 0.7,
          bufferPercentage: 20,
          allowSplitting: true,
          minSlotSize: 2,
          maxSlotSize: dailyCapacity,
          preferMorning: true,
          preferAfternoon: true,
          preferEvening: false
        },
        conditions: {
          minTaskSize: 3,
          maxTaskSize: 50,
          availableDays,
          userExperience: 'intermediate',
          taskType: ['urgent']
        },
        expectedOutcomes: {
          estimatedCompletionRate: 0.75,
          stressLevel: 'medium',
          flexibility: 'medium',
          riskLevel: 'medium',
          suitability: 0.7
        }
      }
    }
    
    // 默認使用均勻分配
    return this.getDefaultStrategy()
  }
  
  /**
   * 生成排程時間段
   */
  private async generateScheduledSlots(
    task: PomodoroTask,
    strategy: DistributionStrategy,
    availableDays: number,
    preferences: Partial<UserSchedulingPreferences>
  ): Promise<ScheduledSlot[]> {
    
    const slots: ScheduledSlot[] = []
    const dailyCapacity = preferences.maxDailyPomodoros || DefaultValues.DAILY_CAPACITY
    const startDate = new Date()
    startDate.setDate(startDate.getDate() + 1) // 從明天開始
    
    let remainingPomodoros = task.estimatedPomodoros
    let currentDay = 0
    
    while (remainingPomodoros > 0 && currentDay < availableDays) {
      const slotDate = new Date(startDate)
      slotDate.setDate(slotDate.getDate() + currentDay)
      
      // 計算當天分配的番茄鐘數量
      let dailyAllocation: number
      
      if (strategy.type === 'even') {
        // 均勻分配
        dailyAllocation = Math.min(
          Math.ceil(remainingPomodoros / (availableDays - currentDay)),
          dailyCapacity
        )
      } else if (strategy.type === 'frontLoaded') {
        // 前置載入：前70%天數承擔更多工作
        const frontDays = Math.ceil(availableDays * 0.7)
        if (currentDay < frontDays) {
          dailyAllocation = Math.min(dailyCapacity, Math.ceil(remainingPomodoros * 0.6 / frontDays))
        } else {
          dailyAllocation = Math.min(
            Math.ceil(remainingPomodoros / (availableDays - currentDay)),
            Math.ceil(dailyCapacity * 0.7)
          )
        }
      } else {
        // 默認均勻分配
        dailyAllocation = Math.min(
          Math.ceil(remainingPomodoros / (availableDays - currentDay)),
          dailyCapacity
        )
      }
      
      if (dailyAllocation > 0) {
        // 計算開始和結束時間
        const workingHours = preferences.preferredWorkingHours || DefaultValues.WORKING_HOURS
        const startTime = workingHours.start
        const endTime = this.calculateEndTime(startTime, dailyAllocation)
        
        const slot: ScheduledSlot = {
          id: `slot-${task.id}-${currentDay + 1}`,
          taskId: task.id,
          userId: task.userId || 'default-user',
          date: slotDate,
          startTime,
          endTime,
          pomodoroCount: dailyAllocation,
          status: 'scheduled',
          completedPomodoros: 0,
          isFlexible: strategy.parameters.allowSplitting || true,
          priority: (task.priority as any) || 'medium',
          autoGenerated: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
        
        slots.push(slot)
        remainingPomodoros -= dailyAllocation
      }
      
      currentDay++
    }
    
    return slots
  }
  
  /**
   * 輔助方法
   */
  
  private calculateAvailableDays(startDate: Date, endDate: Date): number {
    const timeDiff = endDate.getTime() - startDate.getTime()
    return Math.ceil(timeDiff / (1000 * 3600 * 24))
  }
  
  private analyzeTextComplexity(text: string): number {
    // 簡單的文本複雜度分析
    const complexWords = ['設計', '開發', '架構', '優化', '分析', '系統']
    const hasComplexWords = complexWords.some(word => text.includes(word))
    const lengthScore = Math.min(text.length / 50, 1)
    
    return hasComplexWords ? Math.max(0.6, lengthScore) : lengthScore * 0.5
  }
  
  private generateComplexitySuggestions(category: string, score: number): string[] {
    const suggestions: string[] = []
    
    if (category === 'complex' || category === 'expert') {
      suggestions.push('建議分解為多個子任務')
      suggestions.push('預留額外的緩衝時間')
    }
    
    if (score > 0.7) {
      suggestions.push('考慮在精神狀態最佳的時段執行')
    }
    
    if (category === 'simple') {
      suggestions.push('可以與其他任務批量處理')
    }
    
    return suggestions
  }
  
  private createSubtask(
    parentTaskId: string,
    name: string,
    estimatedPomodoros: number,
    order: number
  ): PomodoroSubtask {
    return {
      id: `subtask-${parentTaskId}-${order}`,
      parentTaskId,
      name,
      estimatedPomodoros,
      completedPomodoros: 0,
      scheduledSlots: [],
      priority: 'medium',
      status: 'pending',
      progress: 0,
      order,
      dependencies: order > 1 ? [`subtask-${parentTaskId}-${order - 1}`] : [],
      createdAt: new Date(),
      updatedAt: new Date()
    }
  }
  
  private calculateEndTime(startTime: string, pomodoroCount: number): string {
    const [hours, minutes] = startTime.split(':').map(Number)
    const startMinutes = hours * 60 + minutes
    
    // 計算持續時間：25分鐘工作 + 5分鐘休息（最後一個番茄鐘不需要休息）
    const workMinutes = pomodoroCount * 25
    const breakMinutes = Math.max(0, pomodoroCount - 1) * 5
    const totalMinutes = workMinutes + breakMinutes
    
    const endMinutes = startMinutes + totalMinutes
    const endHours = Math.floor(endMinutes / 60)
    const endMins = endMinutes % 60
    
    return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`
  }
  
  private validateScheduleFeasibility(slots: ScheduledSlot[], deadline: Date): number {
    if (slots.length === 0) return 0
    
    const lastSlot = slots[slots.length - 1]
    const completionDate = lastSlot.date
    
    if (completionDate <= deadline) {
      // 在截止日期前完成，評分較高
      const timeBuffer = deadline.getTime() - completionDate.getTime()
      const bufferDays = timeBuffer / (1000 * 3600 * 24)
      
      if (bufferDays >= 1) return 0.95 // 有充分緩衝時間
      if (bufferDays >= 0.5) return 0.85 // 有半天緩衝
      return 0.75 // 剛好趕上
    } else {
      // 超過截止日期，評分較低
      return 0.3
    }
  }
  
  private calculateCompletionDate(slots: ScheduledSlot[]): Date {
    if (slots.length === 0) return new Date()
    
    const lastSlot = slots[slots.length - 1]
    const completionDate = new Date(lastSlot.date)
    
    // 加上最後一個時間段的持續時間
    const [hours, minutes] = lastSlot.endTime.split(':').map(Number)
    completionDate.setHours(hours, minutes, 0, 0)
    
    return completionDate
  }
  
  private assessRisk(task: PomodoroTask, slots: ScheduledSlot[], deadline: Date): any {
    const factors = []
    let overallRisk: 'low' | 'medium' | 'high' | 'critical' = 'low'
    
    // 檢查時間緊迫性
    const completionDate = this.calculateCompletionDate(slots)
    if (completionDate > deadline) {
      factors.push({
        type: 'tight_deadline' as const,
        severity: 'high' as const,
        probability: 0.8,
        impact: '可能無法按時完成',
        description: '排程超出截止日期'
      })
      overallRisk = 'high'
    } else if ((deadline.getTime() - completionDate.getTime()) < 24 * 60 * 60 * 1000) {
      factors.push({
        type: 'tight_deadline' as const,
        severity: 'medium' as const,
        probability: 0.4,
        impact: '時間緊迫，需要嚴格執行',
        description: '缺乏緩衝時間'
      })
      overallRisk = 'medium'
    }
    
    // 檢查任務複雜度
    if (task.estimatedPomodoros > 15) {
      factors.push({
        type: 'high_complexity' as const,
        severity: 'medium' as const,
        probability: 0.3,
        impact: '可能需要額外時間',
        description: '任務規模較大'
      })
    }
    
    const mitigation = [
      '定期檢查進度並調整排程',
      '保持任務分解的靈活性',
      '在高效時段安排重要工作'
    ]
    
    return {
      overall: overallRisk,
      factors,
      mitigation
    }
  }
  
  private getDefaultStrategy(): DistributionStrategy {
    return {
      type: 'even',
      name: '預設均勻分配',
      description: '標準的均勻時間分配策略',
      parameters: {
        bufferPercentage: 10,
        allowSplitting: true,
        minSlotSize: 1,
        maxSlotSize: 6,
        preferMorning: false,
        preferAfternoon: false,
        preferEvening: false
      },
      conditions: {
        minTaskSize: 1,
        maxTaskSize: 20,
        availableDays: 7,
        userExperience: 'beginner',
        taskType: ['general']
      },
      expectedOutcomes: {
        estimatedCompletionRate: 0.8,
        stressLevel: 'medium',
        flexibility: 'medium',
        riskLevel: 'medium',
        suitability: 0.7
      }
    }
  }
}