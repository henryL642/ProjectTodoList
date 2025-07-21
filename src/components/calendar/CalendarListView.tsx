import React, { useMemo, useState } from 'react'
import { MagicButton } from '../MagicButton'
import type { CalendarEvent } from '../../types/calendar'

interface CalendarListViewProps {
  events: CalendarEvent[]
  onEventClick: (event: CalendarEvent) => void
}

export const CalendarListView: React.FC<CalendarListViewProps> = ({
  events,
  onEventClick
}) => {
  const [sortBy, setSortBy] = useState<'date' | 'type' | 'status'>('date')
  const [filterBy, setFilterBy] = useState<'all' | 'events' | 'tasks'>('all')

  // Sort and filter events
  const processedEvents = useMemo(() => {
    let filtered = events

    // Apply filter
    if (filterBy === 'events') {
      filtered = filtered.filter(event => !event.isTask)
    } else if (filterBy === 'tasks') {
      filtered = filtered.filter(event => event.isTask)
    }

    // Apply sort
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
        case 'type':
          return a.type.localeCompare(b.type)
        case 'status':
          return a.status.localeCompare(b.status)
        default:
          return 0
      }
    })
  }, [events, sortBy, filterBy])

  // Group events by date
  const eventsByDate = useMemo(() => {
    const grouped = new Map<string, CalendarEvent[]>()
    
    processedEvents.forEach(event => {
      const dateKey = new Date(event.startDate).toDateString()
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, [])
      }
      grouped.get(dateKey)!.push(event)
    })
    
    return grouped
  }, [processedEvents])

  const getEventIcon = (event: CalendarEvent) => {
    if (event.isTask) {
      return event.status === 'completed' ? '✅' : '📋'
    }
    
    switch (event.type) {
      case 'deadline': return '🎯'
      case 'meeting': return '👥'
      case 'work_block': return '🕒'
      case 'reminder': return '🔔'
      case 'milestone': return '🏁'
      default: return '📅'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled': return '已安排'
      case 'completed': return '已完成'
      case 'cancelled': return '已取消'
      default: return status
    }
  }

  const getTypeText = (type: string) => {
    switch (type) {
      case 'deadline': return '截止日期'
      case 'meeting': return '會議'
      case 'work_block': return '工作時段'
      case 'reminder': return '提醒'
      case 'milestone': return '里程碑'
      default: return type
    }
  }

  return (
    <div className="calendar-list-view">
      {/* 控制面板 */}
      <div className="list-controls">
        <div className="control-group">
          <label>篩選：</label>
          <select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value as 'all' | 'events' | 'tasks')}
            className="control-select"
          >
            <option value="all">全部</option>
            <option value="events">事件</option>
            <option value="tasks">任務</option>
          </select>
        </div>

        <div className="control-group">
          <label>排序：</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'type' | 'status')}
            className="control-select"
          >
            <option value="date">日期</option>
            <option value="type">類型</option>
            <option value="status">狀態</option>
          </select>
        </div>

        <div className="list-stats">
          <span className="stat">
            📅 {events.filter(e => !e.isTask).length} 個事件
          </span>
          <span className="stat">
            📋 {events.filter(e => e.isTask).length} 個任務
          </span>
        </div>
      </div>

      {/* 事件列表 */}
      <div className="list-content">
        {Array.from(eventsByDate.entries()).map(([dateStr, dateEvents]) => (
          <div key={dateStr} className="date-group">
            <div className="date-header">
              <h3 className="date-title">
                {new Date(dateStr).toLocaleDateString('zh-TW', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  weekday: 'long'
                })}
              </h3>
              <span className="date-count">{dateEvents.length} 項目</span>
            </div>

            <div className="date-events">
              {dateEvents.map(event => (
                <div
                  key={event.id}
                  className={`event-item ${event.isTask ? 'event-task' : 'event-calendar'} ${
                    event.status === 'completed' ? 'event-completed' : ''
                  }`}
                  onClick={() => onEventClick(event)}
                >
                  <div className="event-icon">
                    {getEventIcon(event)}
                  </div>

                  <div className="event-info">
                    <div className="event-title">
                      {event.title}
                    </div>
                    
                    <div className="event-meta">
                      <span className="event-type">
                        {event.isTask ? '任務' : getTypeText(event.type)}
                      </span>
                      
                      {!event.allDay && (
                        <span className="event-time">
                          {new Date(event.startDate).toLocaleTimeString('zh-TW', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      )}
                      
                      <span className={`event-status status-${event.status}`}>
                        {getStatusText(event.status)}
                      </span>
                    </div>

                    {event.description && (
                      <div className="event-description">
                        {event.description}
                      </div>
                    )}
                  </div>

                  <div className="event-actions">
                    <MagicButton
                      size="small"
                      variant="secondary"
                      onClick={() => onEventClick(event)}
                    >
                      查看
                    </MagicButton>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {eventsByDate.size === 0 && (
          <div className="list-empty">
            <div className="empty-state">
              <span className="empty-icon">📋</span>
              <h3>沒有找到項目</h3>
              <p>當前篩選條件下沒有事件或任務</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}