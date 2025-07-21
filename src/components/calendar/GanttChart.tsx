import React, { useMemo, useState } from 'react'
import { MagicButton } from '../MagicButton'
import { useProjects } from '../../context/ProjectContext'
import type { CalendarEvent } from '../../types/calendar'

interface GanttChartProps {
  events: CalendarEvent[]
  timeView: 'quarter' | 'year'
  onEventClick: (event: CalendarEvent) => void
}

export const GanttChart: React.FC<GanttChartProps> = ({
  events,
  timeView,
  onEventClick
}) => {
  const { projects } = useProjects()
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const [hoveredEvent, setHoveredEvent] = useState<string | null>(null)
  // Generate time periods based on view
  const timePeriods = useMemo(() => {
    const now = new Date()
    const currentYear = now.getFullYear()
    
    if (timeView === 'quarter') {
      // Generate quarters for current year
      return [
        { label: 'Q1', start: new Date(currentYear, 0, 1), end: new Date(currentYear, 2, 31) },
        { label: 'Q2', start: new Date(currentYear, 3, 1), end: new Date(currentYear, 5, 30) },
        { label: 'Q3', start: new Date(currentYear, 6, 1), end: new Date(currentYear, 8, 30) },
        { label: 'Q4', start: new Date(currentYear, 9, 1), end: new Date(currentYear, 11, 31) }
      ]
    } else {
      // Generate months for current year
      return Array.from({ length: 12 }, (_, i) => ({
        label: new Date(currentYear, i, 1).toLocaleDateString('zh-TW', { month: 'short' }),
        start: new Date(currentYear, i, 1),
        end: new Date(currentYear, i + 1, 0)
      }))
    }
  }, [timeView])

  // Group events by project with enhanced metadata
  const eventsByProject = useMemo(() => {
    const grouped = new Map<string, {
      events: CalendarEvent[],
      projectName: string,
      totalDuration: number,
      completedCount: number
    }>()
    
    events.forEach(event => {
      const projectId = event.projectId || 'no-project'
      const project = projects.find(p => p.id === projectId)
      const projectName = project?.name || (projectId === 'no-project' ? '無專案' : `專案 ${projectId.slice(0, 8)}`)
      
      if (!grouped.has(projectId)) {
        grouped.set(projectId, {
          events: [],
          projectName,
          totalDuration: 0,
          completedCount: 0
        })
      }
      
      const projectData = grouped.get(projectId)!
      projectData.events.push(event)
      
      // Calculate duration in days
      const eventStart = new Date(event.startDate)
      const eventEnd = event.endDate ? new Date(event.endDate) : eventStart
      const duration = Math.max(1, Math.ceil((eventEnd.getTime() - eventStart.getTime()) / (1000 * 60 * 60 * 24)))
      projectData.totalDuration += duration
      
      if (event.status === 'completed') {
        projectData.completedCount++
      }
    })
    
    return grouped
  }, [events, projects])

  // Calculate position and width for event bars
  const getEventPosition = (event: CalendarEvent) => {
    const eventStart = new Date(event.startDate)
    const eventEnd = event.endDate ? new Date(event.endDate) : eventStart
    const yearStart = new Date(eventStart.getFullYear(), 0, 1)
    const yearEnd = new Date(eventStart.getFullYear(), 11, 31)
    
    const totalDays = Math.ceil((yearEnd.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24))
    const startDay = Math.ceil((eventStart.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24))
    const duration = Math.max(1, Math.ceil((eventEnd.getTime() - eventStart.getTime()) / (1000 * 60 * 60 * 24)))
    
    return {
      left: `${(startDay / totalDays) * 100}%`,
      width: `${Math.max(2, (duration / totalDays) * 100)}%`
    }
  }

  const getEventColor = (event: CalendarEvent) => {
    const isCompleted = event.status === 'completed'
    
    if (event.isTask) {
      return isCompleted ? '#22c55e' : '#f59e0b'
    }
    
    const baseColors = {
      'deadline': '#ef4444',
      'meeting': '#3b82f6', 
      'work_block': '#8b5cf6',
      'milestone': '#f59e0b',
      'reminder': '#10b981'
    }
    
    return baseColors[event.type] || '#6b7280'
  }
  
  const getProjectProgress = (projectData: { events: CalendarEvent[], completedCount: number }) => {
    if (projectData.events.length === 0) return 0
    return Math.round((projectData.completedCount / projectData.events.length) * 100)
  }
  
  const formatDuration = (days: number) => {
    if (days < 30) return `${days} 天`
    if (days < 365) return `${Math.round(days / 30)} 個月`
    return `${Math.round(days / 365)} 年`
  }

  return (
    <div className="gantt-chart-enhanced">
      {/* Enhanced Header with Controls */}
      <div className="gantt-controls">
        <div className="gantt-title">
          <h3>📊 專案時間線 - {timeView === 'quarter' ? '季度視圖' : '年度視圖'}</h3>
          <p className="gantt-subtitle">{events.length} 個事件分佈在 {eventsByProject.size} 個專案中</p>
        </div>
        
        <div className="gantt-legend">
          <div className="legend-item">
            <div className="legend-color" style={{backgroundColor: '#f59e0b'}}></div>
            <span>任務</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{backgroundColor: '#22c55e'}}></div>
            <span>已完成</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{backgroundColor: '#ef4444'}}></div>
            <span>截止日期</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{backgroundColor: '#3b82f6'}}></div>
            <span>會議</span>
          </div>
        </div>
      </div>
      
      {/* Timeline Header */}
      <div className="gantt-header-enhanced">
        <div className="gantt-row-header">專案</div>
        <div className="gantt-timeline-enhanced">
          {timePeriods.map(period => (
            <div key={period.label} className="timeline-period-enhanced">
              <span className="period-label-enhanced">{period.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Enhanced Project Rows */}
      <div className="gantt-body-enhanced">
        {Array.from(eventsByProject.entries()).map(([projectId, projectData]) => {
          const progress = getProjectProgress(projectData)
          const isSelected = selectedProject === projectId
          
          return (
            <div 
              key={projectId} 
              className={`gantt-row-enhanced ${isSelected ? 'gantt-row--selected' : ''}`}
              onClick={() => setSelectedProject(isSelected ? null : projectId)}
            >
              <div className="gantt-row-label-enhanced">
                <div className="project-info">
                  <div className="project-header">
                    <span className="project-icon">📁</span>
                    <span className="project-name">{projectData.projectName}</span>
                    <MagicButton
                      size="small"
                      variant="secondary"
                      onClick={() => setSelectedProject(isSelected ? null : projectId)}
                    >
                      {isSelected ? '收起' : '展開'}
                    </MagicButton>
                  </div>
                  
                  <div className="project-stats">
                    <div className="stat-item">
                      <span className="stat-label">事件:</span>
                      <span className="stat-value">{projectData.events.length}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">時長:</span>
                      <span className="stat-value">{formatDuration(projectData.totalDuration)}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">進度:</span>
                      <span className="stat-value">{progress}%</span>
                    </div>
                  </div>
                  
                  <div className="project-progress">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="gantt-row-content-enhanced">
                <div className="gantt-timeline-bg-enhanced">
                  {timePeriods.map(period => (
                    <div key={period.label} className="timeline-period-bg-enhanced"></div>
                  ))}
                </div>
                
                <div className="gantt-events-enhanced">
                  {projectData.events.map(event => {
                    const position = getEventPosition(event)
                    const color = getEventColor(event)
                    const isHovered = hoveredEvent === event.id
                    
                    return (
                      <div
                        key={event.id}
                        className={`gantt-event-enhanced ${isHovered ? 'gantt-event--hovered' : ''}`}
                        style={{
                          ...position,
                          backgroundColor: color,
                          opacity: event.status === 'completed' ? 0.8 : 1,
                          transform: isHovered ? 'scaleY(1.1)' : 'scaleY(1)'
                        }}
                        onClick={(e) => {
                          e.stopPropagation()
                          onEventClick(event)
                        }}
                        onMouseEnter={() => setHoveredEvent(event.id)}
                        onMouseLeave={() => setHoveredEvent(null)}
                      >
                        <div className="gantt-event-content">
                          <span className="gantt-event-icon">
                            {event.isTask ? '📋' : 
                             event.type === 'meeting' ? '👥' :
                             event.type === 'deadline' ? '🎯' :
                             event.type === 'milestone' ? '🏁' : '📅'}
                          </span>
                          <span className="gantt-event-title-enhanced">{event.title}</span>
                          {event.status === 'completed' && (
                            <span className="completion-badge">✓</span>
                          )}
                        </div>
                        
                        {/* Enhanced Tooltip */}
                        {isHovered && (
                          <div className="gantt-tooltip">
                            <div className="tooltip-title">{event.title}</div>
                            <div className="tooltip-date">
                              📅 {new Date(event.startDate).toLocaleDateString('zh-TW')}
                              {event.endDate && event.endDate !== event.startDate && 
                                ` - ${new Date(event.endDate).toLocaleDateString('zh-TW')}`}
                            </div>
                            <div className="tooltip-type">
                              🏷️ {event.isTask ? '任務' : 
                                 event.type === 'meeting' ? '會議' :
                                 event.type === 'deadline' ? '截止日期' :
                                 event.type === 'milestone' ? '里程碑' : '事件'}
                            </div>
                            {event.description && (
                              <div className="tooltip-description">{event.description}</div>
                            )}
                            <div className="tooltip-status">
                              📊 {event.status === 'completed' ? '✅ 已完成' :
                                 event.status === 'in_progress' ? '🔄 進行中' :
                                 event.status === 'cancelled' ? '❌ 已取消' : '📅 已安排'}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Enhanced Empty State */}
      {eventsByProject.size === 0 && (
        <div className="gantt-empty-enhanced">
          <div className="empty-state-enhanced">
            <div className="empty-animation">
              <span className="empty-icon">📊</span>
            </div>
            <h3>沒有找到事件</h3>
            <p>在{timeView === 'quarter' ? '季度' : '年度'}視圖中沒有找到任何事件或任務</p>
            <div className="empty-suggestions">
              <p>建議：</p>
              <ul>
                <li>• 嘗試切換到不同的時間視圖</li>
                <li>• 檢查專案過濾設定</li>
                <li>• 添加一些帶有日期的任務或事件</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}