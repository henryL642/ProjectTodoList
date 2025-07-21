import React, { useState, useEffect } from 'react'
import { useCalendar } from '../../context/CalendarContext'
import { MagicButton } from '../MagicButton'
import type { CalendarEvent, SimpleTextReminder } from '../../types/calendar'

export const SimpleCalendar: React.FC = () => {
  const {
    // events,
    reminders,
    getEventsForDate,
    getUpcomingEvents,
    getActiveReminders,
    addEvent,
    addReminder
  } = useCalendar()

  // const [selectedDate, setSelectedDate] = useState(new Date())
  const [showAddEvent, setShowAddEvent] = useState(false)
  const [activeReminders, setActiveReminders] = useState<SimpleTextReminder[]>([])

  const upcomingEvents = getUpcomingEvents(7)
  const todayEvents = getEventsForDate(new Date())

  // 定期檢查活動提醒
  useEffect(() => {
    const checkReminders = () => {
      const active = getActiveReminders()
      setActiveReminders(active)
    }
    
    checkReminders()
    const interval = setInterval(checkReminders, 60000) // 每分鐘檢查
    
    return () => clearInterval(interval)
  }, [getActiveReminders])

  /**
   * 格式化日期
   */
  // const formatDate = (date: Date): string => {
  //   return date.toLocaleDateString('zh-TW', {
  //     year: 'numeric',
  //     month: 'long',
  //     day: 'numeric',
  //     weekday: 'long'
  //   })
  // }

  /**
   * 格式化時間
   */
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('zh-TW', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  /**
   * 獲取事件類型圖標
   */
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

  return (
    <div className="simple-calendar">
      <div className="simple-calendar__header">
        <h3>📅 智能日曆</h3>
        <MagicButton
          onClick={() => setShowAddEvent(true)}
          variant="secondary"
          size="small"
        >
          ➕ 新增事件
        </MagicButton>
      </div>

      {/* 活動提醒 */}
      {activeReminders.length > 0 && (
        <div className="active-reminders">
          <h4>📢 當前提醒</h4>
          {activeReminders.map(reminder => (
            <div key={reminder.id} className="reminder-alert">
              <span className="reminder-emoji">{reminder.emoji}</span>
              <span className="reminder-message">{reminder.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* 今日事件 */}
      <div className="today-events">
        <h4>🌅 今日安排</h4>
        {todayEvents.length === 0 ? (
          <p className="no-events">今天沒有安排的事件</p>
        ) : (
          <div className="events-list">
            {todayEvents.map(event => (
              <div key={event.id} className="event-item">
                <span className="event-icon">{getEventIcon(event.type)}</span>
                <div className="event-content">
                  <span className="event-title">{event.title}</span>
                  <span className="event-time">
                    {event.allDay ? '全天' : formatTime(new Date(event.startDate))}
                  </span>
                </div>
                {event.projectMilestone?.criticalPath && (
                  <span className="critical-badge">重要</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 即將到來的事件 */}
      <div className="upcoming-events">
        <h4>📋 未來 7 天</h4>
        {upcomingEvents.length === 0 ? (
          <p className="no-events">未來一週沒有安排的事件</p>
        ) : (
          <div className="events-timeline">
            {upcomingEvents.map(event => (
              <div key={event.id} className="timeline-item">
                <div className="timeline-date">
                  <span className="date-text">
                    {new Date(event.startDate).toLocaleDateString('zh-TW', {
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                  <span className="weekday-text">
                    {new Date(event.startDate).toLocaleDateString('zh-TW', {
                      weekday: 'short'
                    })}
                  </span>
                </div>
                
                <div className="timeline-content">
                  <div className="event-header">
                    <span className="event-icon">{getEventIcon(event.type)}</span>
                    <span className="event-title">{event.title}</span>
                  </div>
                  
                  {event.description && (
                    <p className="event-description">{event.description}</p>
                  )}
                  
                  <div className="event-meta">
                    {!event.allDay && (
                      <span className="event-time">
                        {formatTime(new Date(event.startDate))}
                      </span>
                    )}
                    
                    {event.type === 'deadline' && (
                      <span className="deadline-badge">截止日期</span>
                    )}
                    
                    {event.projectMilestone && (
                      <span className="milestone-badge">
                        {event.projectMilestone.milestoneType}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 簡化文字提醒 */}
      <div className="text-reminders">
        <h4>🔔 文字提醒</h4>
        <div className="reminders-preview">
          {reminders.filter(r => r.enabled).slice(0, 3).map(reminder => (
            <div key={reminder.id} className="reminder-preview">
              <span className="reminder-emoji">{reminder.emoji}</span>
              <span className="reminder-text">{reminder.message}</span>
            </div>
          ))}
          
          {reminders.filter(r => r.enabled).length > 3 && (
            <div className="more-reminders">
              還有 {reminders.filter(r => r.enabled).length - 3} 個提醒...
            </div>
          )}
        </div>
      </div>

      {/* 快速操作 */}
      <div className="quick-actions">
        <h4>⚡ 快速操作</h4>
        <div className="action-buttons">
          <MagicButton
            onClick={() => {
              const tomorrow = new Date()
              tomorrow.setDate(tomorrow.getDate() + 1)
              tomorrow.setHours(9, 0, 0, 0)
              
              addEvent({
                userId: '', // 這裡需要從 context 獲取
                title: '工作提醒',
                type: 'work_block',
                startDate: tomorrow,
                allDay: false,
                reminders: [{ type: 'popup', minutesBefore: 15 }],
                status: 'scheduled'
              })
            }}
            variant="secondary"
            size="small"
          >
            📅 明日工作提醒
          </MagicButton>
          
          <MagicButton
            onClick={() => {
              addReminder({
                userId: '', // 這裡需要從 context 獲取
                message: '記得休息一下，保護眼睛',
                emoji: '👀',
                priority: 'medium',
                triggers: { timeOfDay: '14:00' },
                displayDuration: 5,
                autoSnooze: true,
                snoozeMinutes: 30,
                enabled: true
              })
            }}
            variant="secondary"
            size="small"
          >
            👀 下午護眼提醒
          </MagicButton>
        </div>
      </div>

      {showAddEvent && (
        <AddEventModal 
          onClose={() => setShowAddEvent(false)}
          onAdd={addEvent}
        />
      )}
    </div>
  )
}

interface AddEventModalProps {
  onClose: () => void
  onAdd: (event: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>) => void
}

const AddEventModal: React.FC<AddEventModalProps> = ({ onClose, onAdd }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'reminder' as CalendarEvent['type'],
    startDate: new Date().toISOString().slice(0, 16),
    allDay: false
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim()) return
    
    onAdd({
      userId: '', // 這裡需要從 context 獲取
      title: formData.title,
      description: formData.description || undefined,
      type: formData.type,
      startDate: new Date(formData.startDate),
      allDay: formData.allDay,
      reminders: [
        { type: 'popup', minutesBefore: 15 }
      ],
      status: 'scheduled'
    })
    
    onClose()
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <form onSubmit={handleSubmit} className="add-event-form">
          <h3>新增事件</h3>
          
          <div className="form-group">
            <label>事件標題 *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="輸入事件標題"
              required
            />
          </div>
          
          <div className="form-group">
            <label>事件描述</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="輸入事件描述（選填）"
              rows={3}
            />
          </div>
          
          <div className="form-group">
            <label>事件類型</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as CalendarEvent['type'] }))}
            >
              <option value="reminder">提醒</option>
              <option value="work_block">工作時段</option>
              <option value="meeting">會議</option>
              <option value="deadline">截止日期</option>
              <option value="milestone">里程碑</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>開始時間</label>
            <input
              type="datetime-local"
              value={formData.startDate}
              onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
            />
          </div>
          
          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={formData.allDay}
                onChange={(e) => setFormData(prev => ({ ...prev, allDay: e.target.checked }))}
              />
              全天事件
            </label>
          </div>
          
          <div className="form-actions">
            <MagicButton variant="primary" onClick={() => handleSubmit({} as React.FormEvent)}>
              新增事件
            </MagicButton>
            <MagicButton variant="secondary" onClick={onClose}>
              取消
            </MagicButton>
          </div>
        </form>
      </div>
    </div>
  )
}