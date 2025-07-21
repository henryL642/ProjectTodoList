import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { 
  ProjectAnalysis, 
  AIRecommendation, 
  AIAnalysisConfig 
} from '../types/ai'
import type { Project } from '../types/project'
import type { Todo } from '../types/todo'
import { ProgressAnalyzer, RiskAssessmentAnalyzer, RecommendationEngine } from '../utils/aiAnalysis'
import { useLocalStorage } from '../hooks/useLocalStorage'

interface AIContextType {
  // 分析結果
  analyses: ProjectAnalysis[]
  recommendations: AIRecommendation[]
  
  // 配置
  config: AIAnalysisConfig | null
  
  // 分析方法
  analyzeProject: (project: Project, todos: Todo[]) => Promise<ProjectAnalysis>
  updateAnalysis: (projectId: string) => Promise<void>
  
  // 建議管理
  dismissRecommendation: (id: string) => void
  getActiveRecommendations: () => AIRecommendation[]
  getProjectRecommendations: (projectId: string) => AIRecommendation[]
  
  // 配置管理
  updateConfig: (config: Partial<AIAnalysisConfig>) => void
  
  // 統計方法
  getProjectRisk: (projectId: string) => 'low' | 'medium' | 'high' | 'critical' | null
  getOverallProductivity: () => number
}

const AIContext = createContext<AIContextType | undefined>(undefined)

export const useAI = () => {
  const context = useContext(AIContext)
  if (context === undefined) {
    throw new Error('useAI must be used within an AIProvider')
  }
  return context
}

interface AIProviderProps {
  children: React.ReactNode
  userId: string
}

export const AIProvider: React.FC<AIProviderProps> = ({ children, userId }) => {
  const [analyses, setAnalyses] = useLocalStorage<ProjectAnalysis[]>(`ai_analyses_${userId}`, [])
  const [recommendations, setRecommendations] = useLocalStorage<AIRecommendation[]>(
    `ai_recommendations_${userId}`, 
    []
  )
  const [config, setConfig] = useLocalStorage<AIAnalysisConfig | null>(
    `ai_config_${userId}`, 
    null
  )
  
  const [progressAnalyzer] = useState(() => new ProgressAnalyzer())
  const [riskAssessment] = useState(() => new RiskAssessmentAnalyzer())
  const [recommendationEngine] = useState(() => new RecommendationEngine())

  // 初始化配置
  useEffect(() => {
    if (!config && userId) {
      const defaultConfig: AIAnalysisConfig = {
        userId,
        analysisFrequency: 'daily',
        riskThreshold: 'moderate',
        recommendationTypes: ['task_priority', 'schedule_adjustment', 'break_reminder'],
        learningEnabled: true,
        adaptToUserBehavior: true,
        notificationPreferences: {
          riskAlerts: true,
          progressUpdates: true,
          recommendations: true
        },
        lastUpdated: new Date()
      }
      setConfig(defaultConfig)
    }
  }, [userId, config, setConfig])

  /**
   * 分析專案
   */
  const analyzeProject = useCallback(async (
    project: Project, 
    todos: Todo[]
  ): Promise<ProjectAnalysis> => {
    try {
      // 進度分析
      const progressMetrics = progressAnalyzer.analyzeCompletionTrend(project, todos)
      
      // 工作模式識別
      const patterns = progressAnalyzer.identifyWorkingPatterns(userId, todos)
      
      // 風險評估
      const riskAssessment_ = riskAssessment.assessDelayRisk(progressMetrics, project, patterns)
      
      // 保存進度數據點
      const completedCount = todos.filter(t => t.completed).length
      progressAnalyzer.saveProgressDataPoint(project.id, completedCount)
      
      const analysis: ProjectAnalysis = {
        id: crypto.randomUUID(),
        projectId: project.id,
        userId,
        analysisDate: new Date(),
        progressMetrics,
        riskAssessment: riskAssessment_,
        patterns,
        nextAnalysis: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24小時後
      }
      
      // 更新分析記錄
      setAnalyses(prev => {
        const filtered = prev.filter(a => a.projectId !== project.id)
        return [...filtered, analysis]
      })
      
      // 生成建議
      const newRecommendations = recommendationEngine.generateRecommendations(
        analysis, 
        project, 
        todos
      )
      
      if (newRecommendations.length > 0) {
        setRecommendations(prev => {
          // 移除舊的專案建議
          const filtered = prev.filter(r => r.projectId !== project.id)
          return [...filtered, ...newRecommendations]
        })
      }
      
      return analysis
    } catch (error) {
      console.error('AI analysis failed:', error)
      throw error
    }
  }, [userId, progressAnalyzer, riskAssessment, recommendationEngine, setAnalyses, setRecommendations])

  /**
   * 更新專案分析
   */
  const updateAnalysis = useCallback(async (projectId: string) => {
    // 這裡需要獲取專案和待辦事項數據
    // 實際實現時需要注入這些依賴
    console.log('Updating analysis for project:', projectId)
  }, [])

  /**
   * 忽略建議
   */
  const dismissRecommendation = useCallback((id: string) => {
    setRecommendations(prev => 
      prev.map(r => r.id === id ? { ...r, dismissed: true } : r)
    )
  }, [setRecommendations])

  /**
   * 獲取活動建議
   */
  const getActiveRecommendations = useCallback((): AIRecommendation[] => {
    const now = new Date()
    return recommendations.filter(r => 
      !r.dismissed && 
      r.displayUntil > now
    ).sort((a, b) => {
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })
  }, [recommendations])

  /**
   * 獲取專案建議
   */
  const getProjectRecommendations = useCallback((projectId: string): AIRecommendation[] => {
    return getActiveRecommendations().filter(r => r.projectId === projectId)
  }, [getActiveRecommendations])

  /**
   * 更新配置
   */
  const updateConfig = useCallback((updates: Partial<AIAnalysisConfig>) => {
    if (!config) return
    
    const updatedConfig = {
      ...config,
      ...updates,
      lastUpdated: new Date()
    }
    setConfig(updatedConfig)
  }, [config, setConfig])

  /**
   * 獲取專案風險等級
   */
  const getProjectRisk = useCallback((projectId: string): 'low' | 'medium' | 'high' | 'critical' | null => {
    const analysis = analyses.find(a => a.projectId === projectId)
    return analysis?.riskAssessment.overallRisk || null
  }, [analyses])

  /**
   * 獲取整體生產力分數
   */
  const getOverallProductivity = useCallback((): number => {
    if (analyses.length === 0) return 0.5
    
    const avgVelocity = analyses.reduce(
      (sum, analysis) => sum + analysis.progressMetrics.velocity, 
      0
    ) / analyses.length
    
    const avgCompletionRate = analyses.reduce(
      (sum, analysis) => sum + analysis.progressMetrics.completionRate, 
      0
    ) / analyses.length
    
    const avgProcrastination = analyses.reduce(
      (sum, analysis) => sum + analysis.patterns.procrastinationTrend, 
      0
    ) / analyses.length
    
    // 綜合計算生產力分數 (0-1)
    const productivityScore = (
      (avgVelocity * 0.4) + 
      (avgCompletionRate * 0.4) + 
      ((1 - avgProcrastination) * 0.2)
    )
    
    return Math.max(0, Math.min(1, productivityScore))
  }, [analyses])

  // 自動分析定時器
  useEffect(() => {
    if (!config || config.analysisFrequency === 'realtime') return
    
    const getInterval = () => {
      switch (config.analysisFrequency) {
        case 'hourly': return 60 * 60 * 1000
        case 'daily': return 24 * 60 * 60 * 1000
        default: return 24 * 60 * 60 * 1000
      }
    }
    
    const interval = setInterval(() => {
      // 檢查是否有專案需要重新分析
      const now = new Date()
      analyses.forEach(analysis => {
        if (analysis.nextAnalysis <= now) {
          updateAnalysis(analysis.projectId)
        }
      })
    }, getInterval())
    
    return () => clearInterval(interval)
  }, [config, analyses, updateAnalysis])

  // 清理過期建議
  useEffect(() => {
    const cleanup = () => {
      const now = new Date()
      setRecommendations(prev => 
        prev.filter(r => r.displayUntil > now || !r.dismissed)
      )
    }
    
    const interval = setInterval(cleanup, 60 * 60 * 1000) // 每小時清理一次
    return () => clearInterval(interval)
  }, [setRecommendations])

  const value: AIContextType = {
    analyses,
    recommendations,
    config,
    analyzeProject,
    updateAnalysis,
    dismissRecommendation,
    getActiveRecommendations,
    getProjectRecommendations,
    updateConfig,
    getProjectRisk,
    getOverallProductivity
  }

  return (
    <AIContext.Provider value={value}>
      {children}
    </AIContext.Provider>
  )
}