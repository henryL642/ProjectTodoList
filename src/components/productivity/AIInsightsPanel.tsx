import React, { useState, useEffect } from 'react'
import { useAI } from '../../context/AIContext'
import { useProjects } from '../../context/ProjectContext'
import { useTodos } from '../../hooks/useTodos'
import { MagicButton } from '../MagicButton'
import type { ProjectAnalysis, AIRecommendation } from '../../types/ai'

export const AIInsightsPanel: React.FC = () => {
  const { 
    analyses, 
    // recommendations, 
    analyzeProject, 
    dismissRecommendation,
    getActiveRecommendations,
    // getProjectRisk,
    getOverallProductivity
  } = useAI()
  
  const { projects, currentProject } = useProjects()
  const { todos } = useTodos()
  
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [selectedTab, setSelectedTab] = useState<'overview' | 'recommendations' | 'insights'>('overview')

  const activeRecommendations = getActiveRecommendations()
  const overallProductivity = getOverallProductivity()

  /**
   * 執行專案分析
   */
  const handleAnalyzeProject = async () => {
    if (!currentProject) return
    
    setIsAnalyzing(true)
    try {
      await analyzeProject(currentProject, todos)
    } catch (error) {
      console.error('Analysis failed:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  /**
   * 自動分析當前專案
   */
  useEffect(() => {
    if (currentProject && todos.length > 0) {
      const projectAnalysis = analyses.find(a => a.projectId === currentProject.id)
      const needsAnalysis = !projectAnalysis || 
        (Date.now() - projectAnalysis.analysisDate.getTime()) > 24 * 60 * 60 * 1000
      
      if (needsAnalysis) {
        handleAnalyzeProject()
      }
    }
  }, [currentProject, todos])

  /**
   * 獲取風險等級顏色
   */
  const getRiskColor = (risk: string): string => {
    switch (risk) {
      case 'low': return '#4ade80'
      case 'medium': return '#fbbf24'
      case 'high': return '#f97316'
      case 'critical': return '#ef4444'
      default: return '#9ca3af'
    }
  }

  /**
   * 獲取風險等級圖標
   */
  const getRiskIcon = (risk: string): string => {
    switch (risk) {
      case 'low': return '✅'
      case 'medium': return '⚠️'
      case 'high': return '🔶'
      case 'critical': return '🚨'
      default: return '❓'
    }
  }

  /**
   * 獲取建議優先級顏色
   */
  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'urgent': return '#ef4444'
      case 'high': return '#f97316'
      case 'medium': return '#fbbf24'
      case 'low': return '#4ade80'
      default: return '#9ca3af'
    }
  }

  const currentAnalysis = currentProject 
    ? analyses.find(a => a.projectId === currentProject.id)
    : null

  return (
    <div className="ai-insights-panel">
      <div className="ai-insights-panel__header">
        <h3>🤖 AI 洞察分析</h3>
        
        {currentProject && (
          <MagicButton
            onClick={handleAnalyzeProject}
            variant="secondary"
            size="small"
            disabled={isAnalyzing}
          >
            {isAnalyzing ? '分析中...' : '🔄 重新分析'}
          </MagicButton>
        )}
      </div>

      <div className="ai-insights-panel__tabs">
        <button
          className={`tab ${selectedTab === 'overview' ? 'active' : ''}`}
          onClick={() => setSelectedTab('overview')}
        >
          概覽
        </button>
        <button
          className={`tab ${selectedTab === 'recommendations' ? 'active' : ''}`}
          onClick={() => setSelectedTab('recommendations')}
        >
          建議 {activeRecommendations.length > 0 && (
            <span className="notification-badge">{activeRecommendations.length}</span>
          )}
        </button>
        <button
          className={`tab ${selectedTab === 'insights' ? 'active' : ''}`}
          onClick={() => setSelectedTab('insights')}
        >
          深度分析
        </button>
      </div>

      <div className="ai-insights-panel__content">
        {selectedTab === 'overview' && (
          <OverviewTab 
            currentAnalysis={currentAnalysis || null}
            currentProject={currentProject}
            overallProductivity={overallProductivity}
            getRiskColor={getRiskColor}
            getRiskIcon={getRiskIcon}
          />
        )}

        {selectedTab === 'recommendations' && (
          <RecommendationsTab 
            recommendations={activeRecommendations}
            onDismiss={dismissRecommendation}
            getPriorityColor={getPriorityColor}
          />
        )}

        {selectedTab === 'insights' && (
          <InsightsTab 
            currentAnalysis={currentAnalysis || null}
            projects={projects}
            analyses={analyses}
          />
        )}
      </div>
    </div>
  )
}

interface OverviewTabProps {
  currentAnalysis: ProjectAnalysis | null
  currentProject: any
  overallProductivity: number
  getRiskColor: (risk: string) => string
  getRiskIcon: (risk: string) => string
}

const OverviewTab: React.FC<OverviewTabProps> = ({
  currentAnalysis,
  currentProject,
  overallProductivity,
  getRiskColor,
  getRiskIcon
}) => (
  <div className="overview-tab">
    <div className="productivity-score">
      <h4>整體生產力</h4>
      <div className="score-display">
        <div 
          className="score-circle"
          style={{ 
            background: `conic-gradient(#667eea 0% ${overallProductivity * 100}%, #e2e8f0 ${overallProductivity * 100}% 100%)` 
          }}
        >
          <span className="score-value">
            {Math.round(overallProductivity * 100)}%
          </span>
        </div>
      </div>
    </div>

    {currentProject && currentAnalysis ? (
      <div className="project-status">
        <h4>當前專案狀態</h4>
        
        <div className="status-card">
          <div className="status-header">
            <span className="project-name">{currentProject.name}</span>
            <div 
              className="risk-indicator"
              style={{ color: getRiskColor(currentAnalysis.riskAssessment.overallRisk) }}
            >
              {getRiskIcon(currentAnalysis.riskAssessment.overallRisk)}
              {currentAnalysis.riskAssessment.overallRisk}
            </div>
          </div>

          <div className="progress-metrics">
            <div className="metric">
              <span className="metric-label">完成率</span>
              <span className="metric-value">
                {Math.round(currentAnalysis.progressMetrics.completionRate * 100)}%
              </span>
            </div>
            
            <div className="metric">
              <span className="metric-label">工作速度</span>
              <span className="metric-value">
                {currentAnalysis.progressMetrics.velocity.toFixed(1)} 任務/天
              </span>
            </div>
            
            <div className="metric">
              <span className="metric-label">預估剩餘</span>
              <span className="metric-value">
                {currentAnalysis.progressMetrics.timeRemaining === Infinity 
                  ? '未知' 
                  : `${Math.ceil(currentAnalysis.progressMetrics.timeRemaining)} 天`
                }
              </span>
            </div>
          </div>

          {currentAnalysis.riskAssessment.riskFactors.length > 0 && (
            <div className="risk-factors">
              <h5>風險因素</h5>
              <ul>
                {currentAnalysis.riskAssessment.riskFactors.map((factor, index) => (
                  <li key={index}>{factor}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    ) : (
      <div className="no-project">
        <p>選擇一個專案開始 AI 分析</p>
      </div>
    )}
  </div>
)

interface RecommendationsTabProps {
  recommendations: AIRecommendation[]
  onDismiss: (id: string) => void
  getPriorityColor: (priority: string) => string
}

const RecommendationsTab: React.FC<RecommendationsTabProps> = ({
  recommendations,
  onDismiss,
  getPriorityColor
}) => (
  <div className="recommendations-tab">
    {recommendations.length === 0 ? (
      <div className="no-recommendations">
        <span className="icon">🎉</span>
        <p>目前沒有新建議</p>
        <p className="subtitle">保持良好的工作狀態！</p>
      </div>
    ) : (
      <div className="recommendations-list">
        {recommendations.map(recommendation => (
          <div key={recommendation.id} className="recommendation-card">
            <div className="recommendation-header">
              <div 
                className="priority-indicator"
                style={{ backgroundColor: getPriorityColor(recommendation.priority) }}
              />
              <h5>{recommendation.title}</h5>
              <button
                onClick={() => onDismiss(recommendation.id)}
                className="dismiss-button"
                title="忽略建議"
              >
                ✕
              </button>
            </div>
            
            <p className="recommendation-message">
              {recommendation.message}
            </p>
            
            {recommendation.suggestedActions.length > 0 && (
              <div className="suggested-actions">
                <h6>建議行動</h6>
                <ul>
                  {recommendation.suggestedActions.map((action, index) => (
                    <li key={index}>
                      {action.type === 'focus_session' && '開始專注工作段'}
                      {action.type === 'reschedule' && '重新安排時程'}
                      {action.type === 'take_break' && '休息一下'}
                      {action.type === 'add_task' && '添加/整理任務'}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    )}
  </div>
)

interface InsightsTabProps {
  currentAnalysis: ProjectAnalysis | null
  projects: any[]
  analyses: ProjectAnalysis[]
}

const InsightsTab: React.FC<InsightsTabProps> = ({
  currentAnalysis,
  // projects,
  // analyses
}) => (
  <div className="insights-tab">
    {currentAnalysis ? (
      <>
        <div className="working-patterns">
          <h4>工作模式分析</h4>
          
          <div className="pattern-card">
            <h5>最佳工作時間</h5>
            <p>
              {currentAnalysis.patterns.workingHours.start}:00 - {currentAnalysis.patterns.workingHours.end}:00
            </p>
          </div>

          <div className="pattern-card">
            <h5>高效工作日</h5>
            <div className="productive-days">
              {currentAnalysis.patterns.productiveDay.map(day => (
                <span key={day} className="day-badge">{day}</span>
              ))}
            </div>
          </div>

          <div className="pattern-card">
            <h5>拖延趨勢</h5>
            <div className="procrastination-score">
              <div 
                className="score-bar"
                style={{ 
                  width: `${currentAnalysis.patterns.procrastinationTrend * 100}%`,
                  backgroundColor: currentAnalysis.patterns.procrastinationTrend > 0.7 
                    ? '#ef4444' 
                    : currentAnalysis.patterns.procrastinationTrend > 0.4 
                      ? '#fbbf24' 
                      : '#4ade80'
                }}
              />
              <span>{Math.round(currentAnalysis.patterns.procrastinationTrend * 100)}%</span>
            </div>
          </div>
        </div>

        <div className="ai-recommendations-summary">
          <h4>AI 建議摘要</h4>
          <ul>
            {currentAnalysis.riskAssessment.recommendations.map((rec, index) => (
              <li key={index}>{rec}</li>
            ))}
          </ul>
        </div>
      </>
    ) : (
      <div className="no-insights">
        <p>暫無分析數據</p>
      </div>
    )}
  </div>
)