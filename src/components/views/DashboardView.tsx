import React, { useState } from 'react'
import { MagicButton } from '../MagicButton'
import { EventEditModal } from '../calendar/EventEditModal'
import { useUser } from '../../context/UserContext'
import { useProjects } from '../../context/ProjectContext'
import { useTodos } from '../../hooks/useTodos'
import { useCalendar } from '../../context/CalendarContext'
import { usePomodoro } from '../../context/PomodoroContext'
import type { SidebarView } from '../layout/Sidebar'
import type { CalendarEvent } from '../../types/calendar'

interface DashboardViewProps {
  onNavigate: (view: SidebarView) => void
  onQuickAction: (action: 'addTask' | 'addProject' | 'addEvent') => void
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onQuickAction
}) => {
  const { user } = useUser()
  const { projects, currentProject } = useProjects()
  const { todos, activeCount, completedCount } = useTodos()
  const { getEventsForDate, getUpcomingEvents, updateEvent, deleteEvent, addEvent } = useCalendar()
  const { getDailyStats } = usePomodoro()

  // 事件編輯狀態
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)

  const totalTodos = activeCount + completedCount
  const completionRate = totalTodos > 0 ? Math.round((completedCount / totalTodos) * 100) : 0
  const dailyStats = getDailyStats()
  
  // 獲取今日和即將到來的事件
  const todayEvents = getEventsForDate(new Date())
  const upcomingEvents = getUpcomingEvents(3) // 接下來3天

  // 獲取今日任務（有截止日期的優先，然後是最近創建的）
  const todayTasks = todos
    .filter(todo => !todo.completed)
    .sort((a, b) => {
      // 有截止日期的任務優先
      if (a.dueDate && !b.dueDate) return -1
      if (!a.dueDate && b.dueDate) return 1
      
      // 如果都有截止日期，按日期排序
      if (a.dueDate && b.dueDate) {
        const aDate = new Date(a.dueDate)
        const bDate = new Date(b.dueDate)
        return aDate.getTime() - bDate.getTime()
      }
      
      // 如果都沒有截止日期，按創建時間排序
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
    .slice(0, 5)

  // Helper functions
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('zh-TW', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return '早上好'
    if (hour < 18) return '下午好'
    return '晚上好'
  }

  // 獲取今日任務（有截止日期的）
  const todayDueTasks = todos
    .filter(todo => {
      if (!todo.dueDate) return false
      const today = new Date()
      const dueDate = new Date(todo.dueDate)
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
      const dueDateStart = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate())
      return dueDateStart.getTime() === todayStart.getTime()
    })
    .slice(0, 3)

  // 合併今日事件和任務
  const todayScheduleItems = [
    ...todayEvents.map(event => ({
      id: event.id,
      title: event.title,
      time: event.allDay ? '全天' : formatTime(new Date(event.startDate)),
      type: 'event' as const,
      icon: '📅',
      originalEvent: event // 保存原始事件引用
    })),
    ...todayDueTasks.map(task => ({
      id: task.id,
      title: task.text,
      time: '截止',
      type: 'task' as const,
      icon: '📋',
      completed: task.completed
    }))
  ].sort((a, b) => {
    if (a.time === '全天') return -1
    if (b.time === '全天') return 1
    if (a.time === '截止') return 1
    if (b.time === '截止') return -1
    return a.time.localeCompare(b.time)
  })

  // 事件處理函數
  const handleEventSave = (id: string, updates: Partial<CalendarEvent>) => {
    updateEvent(id, updates)
    console.log('✅ 事件已更新')
  }

  const handleEventDelete = (id: string) => {
    deleteEvent(id)
    console.log('🗑️ 事件已刪除')
  }


  return (
    <div className="dashboard-view">
      {/* 歡迎區域 */}
      <div className="dashboard__welcome">
        <div className="welcome-card">
          <h2 className="welcome-card__greeting">
            {getGreeting()}，{user?.username}！
          </h2>
          <p className="welcome-card__subtitle">
            今天是美好的一天，讓我們一起完成更多任務吧！
          </p>
        </div>
      </div>

      {/* 快速統計 */}
      <div className="dashboard__stats">
        <div className="stats-grid">
          <div className="stat-card stat-card--tasks">
            <div className="stat-card__icon">✅</div>
            <div className="stat-card__content">
              <div className="stat-card__number">{activeCount}</div>
              <div className="stat-card__label">待辦任務</div>
            </div>
            <div className="stat-card__action">
              <MagicButton
                onClick={() => onNavigate('today')}
                variant="secondary"
                size="small"
              >
                查看全部
              </MagicButton>
            </div>
          </div>

          <div className="stat-card stat-card--projects">
            <div className="stat-card__icon">📁</div>
            <div className="stat-card__content">
              <div className="stat-card__number">{projects.length}</div>
              <div className="stat-card__label">活躍專案</div>
            </div>
            <div className="stat-card__action">
              <MagicButton
                onClick={() => onNavigate('projects')}
                variant="secondary"
                size="small"
              >
                管理專案
              </MagicButton>
            </div>
          </div>

          <div className="stat-card stat-card--completion">
            <div className="stat-card__icon">📊</div>
            <div className="stat-card__content">
              <div className="stat-card__number">{completionRate}%</div>
              <div className="stat-card__label">完成率</div>
            </div>
            <div className="stat-card__progress">
              <div 
                className="stat-card__progress-bar"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>

          <div className="stat-card stat-card--focus">
            <div className="stat-card__icon">🍅</div>
            <div className="stat-card__content">
              <div className="stat-card__number">{dailyStats.completedSessions}</div>
              <div className="stat-card__label">番茄鐘</div>
            </div>
            <div className="stat-card__action">
              <MagicButton
                onClick={() => onNavigate('focus')}
                variant="secondary"
                size="small"
              >
                開始專注
              </MagicButton>
            </div>
          </div>
        </div>
      </div>

      {/* 快速操作 */}
      <div className="dashboard__quick-actions">
        <h3 className="section-title">⚡ 快速操作</h3>
        <div className="quick-actions-grid">
          <MagicButton
            onClick={() => onQuickAction('addTask')}
            variant="primary"
            size="large"
            className="quick-action-card"
          >
            <div className="quick-action-card__icon">➕</div>
            <div className="quick-action-card__content">
              <div className="quick-action-card__title">新增任務</div>
              <div className="quick-action-card__subtitle">快速添加待辦事項</div>
            </div>
          </MagicButton>

          <MagicButton
            onClick={() => onQuickAction('addProject')}
            variant="secondary"
            size="large"
            className="quick-action-card"
          >
            <div className="quick-action-card__icon">📂</div>
            <div className="quick-action-card__content">
              <div className="quick-action-card__title">新建專案</div>
              <div className="quick-action-card__subtitle">創建新的工作專案</div>
            </div>
          </MagicButton>

          <MagicButton
            onClick={() => onQuickAction('addEvent')}
            variant="secondary"
            size="large"
            className="quick-action-card"
          >
            <div className="quick-action-card__icon">📅</div>
            <div className="quick-action-card__content">
              <div className="quick-action-card__title">添加事件</div>
              <div className="quick-action-card__subtitle">安排會議或提醒</div>
            </div>
          </MagicButton>

          <MagicButton
            onClick={() => onNavigate('calendar')}
            variant="secondary"
            size="large"
            className="quick-action-card"
          >
            <div className="quick-action-card__icon">📋</div>
            <div className="quick-action-card__content">
              <div className="quick-action-card__title">查看今日</div>
              <div className="quick-action-card__subtitle">今天的所有安排</div>
            </div>
          </MagicButton>
        </div>
      </div>

      {/* 主要內容區域 */}
      <div className="dashboard__main-content">
        <div className="dashboard__left-column">
          {/* 今日任務 - 具備快速完成功能 */}
          <div className="dashboard__section">
            <div className="section-header">
              <h3 className="section-title">📋 今日任務</h3>
              <div className="section-actions">
                <MagicButton
                  onClick={() => {
                    // 批量標記為完成
                    const incompleteTasks = todayTasks.filter(t => !t.completed)
                    if (incompleteTasks.length > 0) {
                      const confirm = window.confirm(`確定要標記 ${incompleteTasks.length} 個任務為已完成嗎？`)
                      if (confirm) {
                        alert('批量完成功能將在後續版本實現')
                      }
                    }
                  }}
                  variant="outline"
                  size="small"
                  disabled={todayTasks.filter(t => !t.completed).length === 0}
                >
                  ✅ 全部完成
                </MagicButton>
                <MagicButton
                  onClick={() => onNavigate('today')}
                  variant="secondary"
                  size="small"
                >
                  查看全部 →
                </MagicButton>
              </div>
            </div>
            
            <div className="task-list interactive">
              {todayTasks.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state__icon">🎉</div>
                  <div className="empty-state__text">
                    太棒了！您今天沒有待辦任務
                  </div>
                  <MagicButton
                    onClick={() => onQuickAction('addTask')}
                    variant="secondary"
                    size="small"
                  >
                    添加新任務
                  </MagicButton>
                </div>
              ) : (
                todayTasks.map(task => {
                  const project = projects.find(p => p.id === task.projectId)
                  const formatDueDate = (dueDate: Date) => {
                    const today = new Date()
                    const due = new Date(dueDate)
                    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
                    const dueStart = new Date(due.getFullYear(), due.getMonth(), due.getDate())
                    
                    if (dueStart < todayStart) return { text: '已逾期', color: '#ef4444', icon: '⚠️' }
                    if (dueStart.getTime() === todayStart.getTime()) return { text: '今天到期', color: '#f59e0b', icon: '📅' }
                    if (dueStart.getTime() <= todayStart.getTime() + 7 * 24 * 60 * 60 * 1000) return { text: '即將到期', color: '#3b82f6', icon: '🔔' }
                    
                    return { 
                      text: due.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' }), 
                      color: '#6b7280', 
                      icon: '📆' 
                    }
                  }
                  
                  const dueInfo = task.dueDate ? formatDueDate(new Date(task.dueDate)) : null
                  
                  return (
                    <div key={task.id} className="task-item hoverable" onClick={() => onNavigate('today')}>
                      <div className="task-item__checkbox" onClick={(e) => e.stopPropagation()}>
                        <input 
                          type="checkbox" 
                          checked={task.completed}
                          onChange={() => {
                            // 快速切換完成狀態
                            alert('快速完成切換功能將在後續版本實現')
                          }}
                        />
                      </div>
                      <div className="task-item__content">
                        <span className="task-item__text">{task.text}</span>
                        <div className="task-item__meta">
                          {project && (
                            <span className="task-item__project">
                              {project.icon} {project.name}
                            </span>
                          )}
                          {dueInfo && (
                            <span 
                              className="task-item__due-date"
                              style={{ color: dueInfo.color }}
                            >
                              {dueInfo.icon} {dueInfo.text}
                            </span>
                          )}
                          <span className="task-priority-mini">
                            {task.priority === 'urgent_important' ? '🔴' :
                             task.priority === 'urgent_not_important' ? '🟡' :
                             task.priority === 'important_not_urgent' ? '🔵' : '⚪'}
                          </span>
                        </div>
                      </div>
                      <div className="task-item__hover-actions">
                        <span className="hover-hint">點擊查看詳情</span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

        </div>

        <div className="dashboard__right-column">
          {/* 今日行程 - 時間線視圖與快速導航 */}
          <div className="dashboard__section">
            <div className="section-header">
              <h3 className="section-title">📅 今日行程</h3>
              <div className="section-actions">
                <MagicButton
                  onClick={() => {
                    const now = new Date()
                    const currentHour = now.getHours()
                    const nextEvents = todayScheduleItems.filter(item => {
                      if (item.time === '全天' || item.time === '截止') return false
                      const eventHour = parseInt(item.time.split(':')[0])
                      return eventHour >= currentHour
                    })
                    
                    if (nextEvents.length > 0) {
                      alert(`⏰ 下一個事件：${nextEvents[0].title}\n時間：${nextEvents[0].time}`)
                    } else {
                      alert('🎉 今天剩餘時間都是自由的！')
                    }
                  }}
                  variant="outline"
                  size="small"
                >
                  ⏰ 下一個
                </MagicButton>
                <MagicButton
                  onClick={() => onNavigate('calendar')}
                  variant="secondary"
                  size="small"
                >
                  查看行事曆 →
                </MagicButton>
              </div>
            </div>
            
            <div className="event-list timeline">
              {todayScheduleItems.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state__icon">🕐</div>
                  <div className="empty-state__text">
                    今天沒有安排的事件和任務
                  </div>
                  <MagicButton
                    onClick={() => onQuickAction('addEvent')}
                    variant="secondary"
                    size="small"
                  >
                    添加事件
                  </MagicButton>
                </div>
              ) : (
                todayScheduleItems.map((item, index) => {
                  const now = new Date()
                  const isCurrentTime = (() => {
                    if (item.time === '全天' || item.time === '截止') return false
                    const eventHour = parseInt(item.time.split(':')[0])
                    const eventMinute = parseInt(item.time.split(':')[1] || '0')
                    const eventTime = eventHour * 60 + eventMinute
                    const nowTime = now.getHours() * 60 + now.getMinutes()
                    return Math.abs(eventTime - nowTime) <= 30 // 30分鐘內算當前時間
                  })()

                  return (
                    <div 
                      key={`${item.type}-${item.id}`} 
                      className={`event-item ${item.type === 'task' ? 'event-item--task' : ''} ${isCurrentTime ? 'event-item--current' : ''}`}
                      onClick={() => {
                        if (item.type === 'task') {
                          onNavigate('today')
                        } else if (item.type === 'event' && 'originalEvent' in item) {
                          // 開啟事件編輯模態框
                          setEditingEvent(item.originalEvent)
                        } else {
                          onNavigate('calendar')
                        }
                      }}
                    >
                      <div className="event-item__timeline">
                        <div className="timeline-dot"></div>
                        {index < todayScheduleItems.length - 1 && (
                          <div className="timeline-line"></div>
                        )}
                      </div>
                      <div className="event-item__time">
                        <span className="event-item__time-icon">{item.icon}</span>
                        <span className="event-item__time-text">{item.time}</span>
                        {isCurrentTime && (
                          <span className="current-indicator">進行中</span>
                        )}
                      </div>
                      <div className="event-item__content">
                        <div className={`event-item__title ${item.type === 'task' && item.completed ? 'event-item__title--completed' : ''}`}>
                          {item.title}
                        </div>
                        <div className="event-item__actions">
                          {item.type === 'task' && (
                            <span className="event-item__type-badge task">任務</span>
                          )}
                          {item.type === 'event' && (
                            <span className="event-item__type-badge event">事件</span>
                          )}
                          <span className="event-item__hover-hint">點擊查看</span>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* 即將到來 - 智能預測與提醒 */}
          <div className="dashboard__section">
            <div className="section-header">
              <h3 className="section-title">🔮 即將到來</h3>
              <div className="section-actions">
                <MagicButton
                  onClick={() => {
                    // 智能提醒功能
                    const now = new Date()
                    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
                    const upcomingTasksCount = todos.filter(todo => {
                      if (!todo.dueDate || todo.completed) return false
                      const dueDate = new Date(todo.dueDate)
                      return dueDate >= now && dueDate <= tomorrow
                    }).length

                    if (upcomingTasksCount > 0) {
                      alert(`📋 明天有 ${upcomingTasksCount} 個任務到期\n建議提前準備！`)
                    } else {
                      alert('😊 明天沒有緊急任務，可以輕鬆一點！')
                    }
                  }}
                  variant="outline"
                  size="small"
                >
                  🔔 智能提醒
                </MagicButton>
              </div>
            </div>
            
            <div className="upcoming-list">
              {(() => {
                // 獲取即將到期的任務（未來7天內）
                const upcomingTasks = todos
                  .filter(todo => {
                    if (!todo.dueDate || todo.completed) return false
                    const dueDate = new Date(todo.dueDate)
                    const today = new Date()
                    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
                    return dueDate > today && dueDate <= weekFromNow
                  })
                  .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
                  .slice(0, 3)

                // 合併事件和任務
                const upcomingItems = [
                  ...upcomingEvents.map(event => ({
                    id: event.id,
                    title: event.title,
                    date: new Date(event.startDate),
                    type: 'event' as const,
                    icon: '📅',
                    originalEvent: event // 保存原始事件引用
                  })),
                  ...upcomingTasks.map(task => {
                    const project = projects.find(p => p.id === task.projectId)
                    return {
                      id: task.id,
                      title: task.text,
                      date: new Date(task.dueDate!),
                      type: 'task' as const,
                      icon: '📋',
                      project: project ? `${project.icon} ${project.name}` : null
                    }
                  })
                ]
                .sort((a, b) => a.date.getTime() - b.date.getTime())
                .slice(0, 5)

                return upcomingItems.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state__icon">📝</div>
                    <div className="empty-state__text">
                      未來一週沒有安排
                    </div>
                    <MagicButton
                      onClick={() => onQuickAction('addTask')}
                      variant="secondary"
                      size="small"
                    >
                      規劃未來任務
                    </MagicButton>
                  </div>
                ) : (
                  upcomingItems.map((item, index) => {
                    const isToday = item.date.toDateString() === new Date().toDateString()
                    const isTomorrow = item.date.toDateString() === new Date(Date.now() + 24 * 60 * 60 * 1000).toDateString()
                    const isThisWeek = item.date.getTime() <= new Date().getTime() + 7 * 24 * 60 * 60 * 1000
                    
                    let dateText = ''
                    let urgencyLevel = 'normal'
                    
                    if (isToday) {
                      dateText = '今天'
                      urgencyLevel = 'urgent'
                    } else if (isTomorrow) {
                      dateText = '明天'
                      urgencyLevel = 'important'
                    } else if (isThisWeek) {
                      dateText = item.date.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric', weekday: 'short' })
                      urgencyLevel = 'upcoming'
                    } else {
                      dateText = item.date.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric', weekday: 'short' })
                    }

                    return (
                      <div 
                        key={`${item.type}-${item.id}-${index}`} 
                        className={`upcoming-item ${item.type === 'task' ? 'upcoming-item--task' : 'upcoming-item--event'} upcoming-item--${urgencyLevel}`}
                        onClick={() => {
                          if (item.type === 'task') {
                            onNavigate('today')
                          } else if (item.type === 'event' && 'originalEvent' in item) {
                            // 開啟事件編輯模態框
                            setEditingEvent(item.originalEvent)
                          } else {
                            onNavigate('calendar')
                          }
                        }}
                      >
                        <div className="upcoming-item__date">
                          <span className="upcoming-item__date-text">{dateText}</span>
                          {item.type === 'event' && (
                            <span className="upcoming-item__time">
                              {formatTime(item.date)}
                            </span>
                          )}
                          {urgencyLevel === 'urgent' && (
                            <span className="urgency-badge urgent">緊急</span>
                          )}
                          {urgencyLevel === 'important' && (
                            <span className="urgency-badge important">重要</span>
                          )}
                        </div>
                        <div className="upcoming-item__content">
                          <div className="upcoming-item__header">
                            <span className="upcoming-item__icon">{item.icon}</span>
                            <div className="upcoming-item__title">{item.title}</div>
                          </div>
                          {item.type === 'task' && 'project' in item && item.project && (
                            <div className="upcoming-item__project">{item.project}</div>
                          )}
                          <div className="upcoming-item__actions">
                            <span className="upcoming-item__hover-hint">點擊查看詳情</span>
                            {item.type === 'task' && isToday && (
                              <span className="quick-action-hint">← 今天就要處理！</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* 事件編輯模態框 */}
      <EventEditModal
        event={editingEvent}
        isOpen={!!editingEvent}
        mode="edit"
        onClose={() => setEditingEvent(null)}
        onSave={handleEventSave}
        onDelete={handleEventDelete}
      />
    </div>
  )
}