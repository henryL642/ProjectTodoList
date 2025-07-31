/**
 * TimelineAnalytics - Analytics and insights for timeline data
 * Part of Timeline Enhancement Implementation  
 */

import React, { useMemo } from 'react'
import type { ScheduleItem } from '../../types/mvp-scheduling'

interface TimelineAnalyticsProps {
  schedule: ScheduleItem[]
  isOpen: boolean
  onClose: () => void
  currentDate?: Date
  historicalData?: ScheduleItem[][] // Array of previous days' schedules
}

interface AnalyticsData {
  productivity: {
    completionRate: number
    totalPomodoros: number
    completedPomodoros: number
    averageSessionLength: number
  }
  timeDistribution: {
    workTime: number
    breakTime: number
    bufferTime: number
  }
  patterns: {
    mostProductiveHour: string
    commonBreakTime: string
    peakPerformanceWindow: string
  }
  trends: {
    dailyCompletion: number[]
    weeklyAverage: number
    monthlyTrend: 'up' | 'down' | 'stable'
  }
}

export const TimelineAnalytics: React.FC<TimelineAnalyticsProps> = ({
  schedule,
  isOpen,
  onClose,
  currentDate = new Date(),
  historicalData = []
}) => {
  // Calculate analytics data
  const analytics = useMemo((): AnalyticsData => {
    const totalSlots = schedule.length
    const completedSlots = schedule.filter(item => item.status === 'completed').length
    const pomodoroSlots = schedule.filter(item => item.type === 'pomodoro')
    const completedPomodoros = pomodoroSlots.filter(item => item.status === 'completed').length

    // Time distribution
    const workTime = pomodoroSlots.length * 25
    const breakTime = schedule.filter(item => item.type === 'break').length * 5
    const bufferTime = schedule.filter(item => item.type === 'buffer').length * 15

    // Find most productive hour
    const hourlyCompletion = new Map<number, { total: number, completed: number }>()
    schedule.forEach(item => {
      const hour = parseInt(item.time.split(':')[0])
      const current = hourlyCompletion.get(hour) || { total: 0, completed: 0 }
      current.total++
      if (item.status === 'completed') current.completed++
      hourlyCompletion.set(hour, current)
    })

    let bestHour = 9
    let bestRate = 0
    hourlyCompletion.forEach((data, hour) => {
      const rate = data.completed / data.total
      if (rate > bestRate) {
        bestRate = rate
        bestHour = hour
      }
    })

    // Historical trends (simplified)
    const dailyCompletion = historicalData.map(daySchedule => {
      const total = daySchedule.filter(item => item.type === 'pomodoro').length
      const completed = daySchedule.filter(item => item.type === 'pomodoro' && item.status === 'completed').length
      return total > 0 ? (completed / total) * 100 : 0
    })

    const weeklyAverage = dailyCompletion.length > 0 
      ? dailyCompletion.reduce((sum, rate) => sum + rate, 0) / dailyCompletion.length
      : 0

    return {
      productivity: {
        completionRate: totalSlots > 0 ? (completedSlots / totalSlots) * 100 : 0,
        totalPomodoros: pomodoroSlots.length,
        completedPomodoros: completedPomodoros,
        averageSessionLength: pomodoroSlots.length > 0 ? workTime / pomodoroSlots.length : 0
      },
      timeDistribution: {
        workTime,
        breakTime,
        bufferTime
      },
      patterns: {
        mostProductiveHour: `${bestHour}:00`,
        commonBreakTime: '10:30', // Simplified
        peakPerformanceWindow: `${bestHour}:00 - ${bestHour + 2}:00`
      },
      trends: {
        dailyCompletion,
        weeklyAverage,
        monthlyTrend: weeklyAverage > 75 ? 'up' : weeklyAverage > 50 ? 'stable' : 'down'
      }
    }
  }, [schedule, historicalData])

  if (!isOpen) return null

  // Get completion rate color
  const getCompletionColor = (rate: number) => {
    if (rate >= 80) return '#27ae60'
    if (rate >= 60) return '#f39c12'
    if (rate >= 40) return '#e67e22'
    return '#e74c3c'
  }

  // Generate productivity score
  const getProductivityScore = () => {
    const { completionRate, totalPomodoros } = analytics.productivity
    const volumeBonus = Math.min(totalPomodoros * 5, 20) // Bonus for volume
    return Math.min(Math.round(completionRate + volumeBonus), 100)
  }

  const productivityScore = getProductivityScore()

  return (
    <div className="timeline-analytics-overlay" onClick={onClose}>
      <div className="timeline-analytics-panel" onClick={(e) => e.stopPropagation()}>
        <div className="analytics-header">
          <h3>📊 時間軸分析</h3>
          <button className="close-button" onClick={onClose}>✕</button>
        </div>

        <div className="analytics-content">
          {/* Productivity Overview */}
          <div className="analytics-section">
            <h4>📈 生產力概覽</h4>
            <div className="productivity-cards">
              <div className="metric-card primary">
                <div className="metric-value" style={{ color: getCompletionColor(analytics.productivity.completionRate) }}>
                  {analytics.productivity.completionRate.toFixed(1)}%
                </div>
                <div className="metric-label">完成率</div>
                <div className="metric-description">
                  {analytics.productivity.completedPomodoros} / {analytics.productivity.totalPomodoros} 番茄鐘
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-value">{productivityScore}</div>
                <div className="metric-label">生產力評分</div>
                <div className="metric-description">
                  {productivityScore >= 80 ? '優秀' : 
                   productivityScore >= 60 ? '良好' : 
                   productivityScore >= 40 ? '一般' : '需改進'}
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-value">{Math.round(analytics.timeDistribution.workTime / 60 * 10) / 10}h</div>
                <div className="metric-label">工作時間</div>
                <div className="metric-description">
                  {analytics.productivity.totalPomodoros} 個番茄鐘
                </div>
              </div>
            </div>
          </div>

          {/* Time Distribution */}
          <div className="analytics-section">
            <h4>⏰ 時間分配</h4>
            <div className="time-distribution">
              <div className="distribution-chart">
                {/* Simple horizontal bar chart */}
                <div className="chart-bar">
                  <div className="bar-segment work" 
                       style={{ 
                         width: `${(analytics.timeDistribution.workTime / (analytics.timeDistribution.workTime + analytics.timeDistribution.breakTime + analytics.timeDistribution.bufferTime)) * 100}%` 
                       }}>
                  </div>
                  <div className="bar-segment break" 
                       style={{ 
                         width: `${(analytics.timeDistribution.breakTime / (analytics.timeDistribution.workTime + analytics.timeDistribution.breakTime + analytics.timeDistribution.bufferTime)) * 100}%` 
                       }}>
                  </div>
                  <div className="bar-segment buffer" 
                       style={{ 
                         width: `${(analytics.timeDistribution.bufferTime / (analytics.timeDistribution.workTime + analytics.timeDistribution.breakTime + analytics.timeDistribution.bufferTime)) * 100}%` 
                       }}>
                  </div>
                </div>
                
                <div className="chart-legend">
                  <div className="legend-item">
                    <span className="legend-color work"></span>
                    <span>工作 ({analytics.timeDistribution.workTime}分鐘)</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-color break"></span>
                    <span>休息 ({analytics.timeDistribution.breakTime}分鐘)</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-color buffer"></span>
                    <span>緩衝 ({analytics.timeDistribution.bufferTime}分鐘)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Patterns & Insights */}
          <div className="analytics-section">
            <h4>🔍 模式洞察</h4>
            <div className="insights-grid">
              <div className="insight-card">
                <div className="insight-icon">🌟</div>
                <div className="insight-content">
                  <div className="insight-title">最佳表現時段</div>
                  <div className="insight-value">{analytics.patterns.peakPerformanceWindow}</div>
                  <div className="insight-description">在此時段完成率最高</div>
                </div>
              </div>

              <div className="insight-card">
                <div className="insight-icon">🎯</div>
                <div className="insight-content">
                  <div className="insight-title">專注度指標</div>
                  <div className="insight-value">
                    {analytics.productivity.completedPomodoros > 0 ? '高' : '待提升'}
                  </div>
                  <div className="insight-description">
                    基於完成的番茄鐘數量評估
                  </div>
                </div>
              </div>

              <div className="insight-card">
                <div className="insight-icon">⚡</div>
                <div className="insight-content">
                  <div className="insight-title">效率建議</div>
                  <div className="insight-value">
                    {analytics.productivity.completionRate > 80 ? '保持節奏' : 
                     analytics.productivity.completionRate > 60 ? '優化排程' : '調整策略'}
                  </div>
                  <div className="insight-description">
                    {analytics.productivity.completionRate > 80 ? '當前表現優異，繼續保持' : 
                     analytics.productivity.completionRate > 60 ? '考慮調整任務分配' : '建議重新規劃時間'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Historical Trends */}
          {historicalData.length > 0 && (
            <div className="analytics-section">
              <h4>📈 歷史趨勢</h4>
              <div className="trends-summary">
                <div className="trend-stat">
                  <span className="trend-label">週平均完成率:</span>
                  <span className="trend-value">{analytics.trends.weeklyAverage.toFixed(1)}%</span>
                </div>
                <div className="trend-indicator">
                  <span className="trend-arrow">
                    {analytics.trends.monthlyTrend === 'up' ? '📈' : 
                     analytics.trends.monthlyTrend === 'down' ? '📉' : '➡️'}
                  </span>
                  <span className="trend-text">
                    {analytics.trends.monthlyTrend === 'up' ? '上升趨勢' : 
                     analytics.trends.monthlyTrend === 'down' ? '下降趨勢' : '保持穩定'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Recommendations */}
          <div className="analytics-section">
            <h4>💡 改進建議</h4>
            <div className="recommendations">
              {analytics.productivity.completionRate < 60 && (
                <div className="recommendation">
                  <span className="rec-icon">🎯</span>
                  <span className="rec-text">
                    完成率偏低，建議減少每日安排的任務數量，專注於核心任務
                  </span>
                </div>
              )}
              
              {analytics.timeDistribution.breakTime < analytics.timeDistribution.workTime * 0.2 && (
                <div className="recommendation">
                  <span className="rec-icon">☕</span>
                  <span className="rec-text">
                    休息時間不足，建議增加短休息以保持長期專注力
                  </span>
                </div>
              )}
              
              {analytics.productivity.totalPomodoros > 12 && (
                <div className="recommendation">
                  <span className="rec-icon">⚖️</span>
                  <span className="rec-text">
                    工作量較重，注意工作生活平衡，避免過度疲勞
                  </span>
                </div>
              )}
              
              {analytics.productivity.completionRate > 80 && (
                <div className="recommendation positive">
                  <span className="rec-icon">🌟</span>
                  <span className="rec-text">
                    表現優異！可以考慮略微增加挑戰性任務來進一步提升
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="analytics-actions">
          <button className="analytics-action-btn" onClick={onClose}>
            確定
          </button>
        </div>
      </div>
    </div>
  )
}