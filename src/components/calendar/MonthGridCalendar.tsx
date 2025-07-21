import React, { useState, useMemo } from 'react'
import { MagicButton } from '../MagicButton'
import type { CalendarEvent } from '../../types/calendar'

interface MonthGridCalendarProps {
  events?: CalendarEvent[]
  onAddEvent?: () => void
  onEventClick?: (event: CalendarEvent) => void
}

export const MonthGridCalendar: React.FC<MonthGridCalendarProps> = ({
  events = [],
  onAddEvent,
  onEventClick
}) => {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  // 從傳入的events中獲取指定日期的事件
  const getEventsForDate = (date: Date): CalendarEvent[] => {
    const dateString = date.toDateString()
    return events.filter(event => {
      const eventStart = new Date(event.startDate)
      const eventEnd = event.endDate ? new Date(event.endDate) : eventStart
      return eventStart.toDateString() === dateString || 
             eventEnd.toDateString() === dateString ||
             (eventStart <= date && eventEnd >= date)
    })
  }

  // 獲取當前月份的第一天和最後一天
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
  
  // 獲取日曆網格需要顯示的開始和結束日期（包含上個月和下個月的部分日期）
  const firstDayOfWeek = firstDayOfMonth.getDay() // 0 = Sunday, 1 = Monday, ...
  const startDate = new Date(firstDayOfMonth)
  startDate.setDate(startDate.getDate() - firstDayOfWeek)
  
  const endDate = new Date(lastDayOfMonth)
  const remainingDays = 6 - lastDayOfMonth.getDay()
  endDate.setDate(endDate.getDate() + remainingDays)

  // 生成日曆格子
  const calendarDays = useMemo(() => {
    const days = []
    const current = new Date(startDate)
    
    while (current <= endDate) {
      days.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }
    
    return days
  }, [startDate, endDate])

  // 檢查日期是否為今天
  const isToday = (date: Date): boolean => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  // 檢查日期是否為當前月份
  const isCurrentMonth = (date: Date): boolean => {
    return date.getMonth() === currentDate.getMonth()
  }

  // 檢查日期是否被選中
  const isSelected = (date: Date): boolean => {
    return selectedDate ? date.toDateString() === selectedDate.toDateString() : false
  }

  // 獲取事件類型的顏色
  const getEventColor = (type: CalendarEvent['type']): string => {
    switch (type) {
      case 'deadline': return '#ef4444'
      case 'meeting': return '#3b82f6'
      case 'work_block': return '#f59e0b'
      case 'reminder': return '#10b981'
      case 'milestone': return '#8b5cf6'
      default: return '#6b7280'
    }
  }

  // 獲取事件類型的圖標
  const getEventIcon = (type: CalendarEvent['type']): string => {
    switch (type) {
      case 'deadline': return '🎯'
      case 'meeting': return '👥'
      case 'work_block': return '🕒'
      case 'reminder': return '🔔'
      case 'milestone': return '🏁'
      default: return '📅'
    }
  }

  // 導航到上個月
  const goToPrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  // 導航到下個月
  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  // 回到今天
  const goToToday = () => {
    const today = new Date()
    setCurrentDate(today)
    setSelectedDate(today)
  }

  // 處理日期點擊
  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
  }

  // 處理事件點擊
  const handleEventClick = (event: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation()
    if (onEventClick) {
      onEventClick(event)
    }
  }

  // 格式化月份年份
  const formatMonthYear = (date: Date): string => {
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long'
    })
  }

  // 週名稱
  const weekdays = ['日', '一', '二', '三', '四', '五', '六']

  return (
    <div className="month-grid-calendar">
      {/* 日曆標題和導航 */}
      <div className="calendar-header">
        <div className="calendar-nav">
          <MagicButton
            onClick={goToPrevMonth}
            variant="secondary"
            size="small"
          >
            ‹
          </MagicButton>
          
          <h2 className="current-month">{formatMonthYear(currentDate)}</h2>
          
          <MagicButton
            onClick={goToNextMonth}
            variant="secondary"
            size="small"
          >
            ›
          </MagicButton>
        </div>

        <div className="calendar-actions">
          <MagicButton
            onClick={goToToday}
            variant="secondary"
            size="small"
          >
            今天
          </MagicButton>
          
          {onAddEvent && (
            <MagicButton
              onClick={onAddEvent}
              variant="primary"
              size="small"
            >
              ➕ 新增事件
            </MagicButton>
          )}
        </div>
      </div>

      {/* 日曆網格 */}
      <div className="calendar-grid">
        {/* 週標題 */}
        <div className="weekdays">
          {weekdays.map(day => (
            <div key={day} className="weekday-header">
              {day}
            </div>
          ))}
        </div>

        {/* 日期格子 */}
        <div className="calendar-body">
          {calendarDays.map(date => {
            const dayEvents = getEventsForDate(date)
            const isCurrentMonthDay = isCurrentMonth(date)
            const isTodayDay = isToday(date)
            const isSelectedDay = isSelected(date)

            return (
              <div
                key={date.toISOString()}
                className={`calendar-day ${!isCurrentMonthDay ? 'calendar-day--other-month' : ''} ${isTodayDay ? 'calendar-day--today' : ''} ${isSelectedDay ? 'calendar-day--selected' : ''}`}
                onClick={() => handleDateClick(date)}
              >
                <div className="day-number">
                  {date.getDate()}
                </div>

                {/* 事件指示器 */}
                {dayEvents.length > 0 && (
                  <div className="day-events">
                    {dayEvents.slice(0, 3).map(event => (
                      <div
                        key={event.id}
                        className="event-indicator"
                        style={{ backgroundColor: getEventColor(event.type) }}
                        title={event.title}
                        onClick={(e) => handleEventClick(event, e)}
                      >
                        <span className="event-icon">{getEventIcon(event.type)}</span>
                        <span className="event-title">{event.title}</span>
                      </div>
                    ))}
                    
                    {dayEvents.length > 3 && (
                      <div className="more-events">
                        +{dayEvents.length - 3} 更多
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* 選中日期的詳細信息 */}
      {selectedDate && (
        <div className="selected-date-details">
          <div className="details-header">
            <h3>
              {selectedDate.toLocaleDateString('zh-TW', {
                month: 'long',
                day: 'numeric',
                weekday: 'long'
              })}
              {isToday(selectedDate) && <span className="today-badge">今天</span>}
            </h3>
          </div>

          <div className="details-content">
            {(() => {
              const selectedDateEvents = getEventsForDate(selectedDate)
              if (selectedDateEvents.length === 0) {
                return (
                  <div className="no-events">
                    <div className="no-events-icon">📅</div>
                    <p>這一天沒有安排的事件</p>
                    {onAddEvent && (
                      <MagicButton
                        onClick={onAddEvent}
                        variant="secondary"
                        size="small"
                      >
                        添加事件
                      </MagicButton>
                    )}
                  </div>
                )
              }

              return (
                <div className="events-list">
                  {selectedDateEvents.map(event => (
                    <div
                      key={event.id}
                      className="event-item"
                      onClick={() => onEventClick && onEventClick(event)}
                    >
                      <div className="event-time">
                        {event.allDay ? (
                          <span className="all-day-badge">全天</span>
                        ) : (
                          <span className="event-hour">
                            {new Date(event.startDate).toLocaleTimeString('zh-TW', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        )}
                      </div>
                      
                      <div className="event-content">
                        <div className="event-header">
                          <span className="event-icon">{getEventIcon(event.type)}</span>
                          <span className="event-title">{event.title}</span>
                          <div
                            className="event-type-indicator"
                            style={{ backgroundColor: getEventColor(event.type) }}
                          />
                        </div>
                        
                        {event.description && (
                          <p className="event-description">{event.description}</p>
                        )}
                        
                        <div className="event-meta">
                          <span className="event-type">
                            {event.type === 'deadline' && '截止日期'}
                            {event.type === 'meeting' && '會議'}
                            {event.type === 'work_block' && '工作時段'}
                            {event.type === 'reminder' && '提醒'}
                            {event.type === 'milestone' && '里程碑'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            })()}
          </div>
        </div>
      )}
    </div>
  )
}