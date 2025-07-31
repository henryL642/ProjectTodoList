import React, { createContext, useContext, useCallback, useEffect } from 'react'
import type { 
  CalendarEvent, 
  SimpleTextReminder, 
  CalendarContextType,
  ReminderTemplate 
} from '../types/calendar'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { preferencesManager } from '../utils/preferencesManager'

const CalendarContext = createContext<CalendarContextType | undefined>(undefined)

export const useCalendar = () => {
  const context = useContext(CalendarContext)
  if (context === undefined) {
    throw new Error('useCalendar must be used within a CalendarProvider')
  }
  return context
}

interface CalendarProviderProps {
  children: React.ReactNode
  userId: string
}

// 預設提醒模板
const DEFAULT_REMINDER_TEMPLATES: ReminderTemplate[] = [
  {
    id: 'morning_start',
    name: '早晨開始',
    message: '早安！準備開始今天的工作了嗎？',
    emoji: '🌅',
    triggers: { timeOfDay: '09:00', daysOfWeek: [1, 2, 3, 4, 5] },
    category: 'morning'
  },
  {
    id: 'lunch_break',
    name: '午餐時間',
    message: '該休息吃午餐了！',
    emoji: '🍽️',
    triggers: { timeOfDay: '12:00' },
    category: 'break'
  },
  {
    id: 'end_of_day',
    name: '結束工作',
    message: '今天辛苦了！記得保存工作進度',
    emoji: '🌙',
    triggers: { timeOfDay: '18:00' },
    category: 'evening'
  },
  {
    id: 'task_overload',
    name: '任務過多',
    message: '待辦事項有點多，要不要先處理優先級高的？',
    emoji: '📋',
    triggers: { taskCount: 10 },
    category: 'work'
  }
]

export const CalendarProvider: React.FC<CalendarProviderProps> = ({ children, userId }) => {
  const [events, setEvents] = useLocalStorage<CalendarEvent[]>(`calendar_events_${userId}`, [])
  const [reminders, setReminders] = useLocalStorage<SimpleTextReminder[]>(
    `calendar_reminders_${userId}`, 
    []
  )

  // 初始化預設提醒
  useEffect(() => {
    if (reminders.length === 0) {
      const defaultReminders: SimpleTextReminder[] = DEFAULT_REMINDER_TEMPLATES.map(template => ({
        id: crypto.randomUUID(),
        userId,
        message: template.message,
        emoji: template.emoji,
        priority: 'medium',
        triggers: template.triggers,
        displayDuration: 5,
        autoSnooze: true,
        snoozeMinutes: 30,
        enabled: true
      }))
      
      setReminders(defaultReminders)
    }
  }, [userId, reminders.length, setReminders])

  /**
   * 添加事件
   */
  const addEvent = useCallback((eventData: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newEvent: CalendarEvent = {
      ...eventData,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    setEvents(prev => [...prev, newEvent])
    return newEvent.id // 返回新創建的事件 ID
  }, [setEvents])

  /**
   * 更新事件
   */
  const updateEvent = useCallback((id: string, updates: Partial<CalendarEvent>) => {
    setEvents(prev => 
      prev.map(event => 
        event.id === id 
          ? { ...event, ...updates, updatedAt: new Date() }
          : event
      )
    )
  }, [setEvents])

  /**
   * 刪除事件
   */
  const deleteEvent = useCallback((id: string) => {
    setEvents(prev => prev.filter(event => event.id !== id))
  }, [setEvents])

  /**
   * 添加提醒
   */
  const addReminder = useCallback((reminderData: Omit<SimpleTextReminder, 'id'>) => {
    const newReminder: SimpleTextReminder = {
      ...reminderData,
      id: crypto.randomUUID()
    }
    
    setReminders(prev => [...prev, newReminder])
  }, [setReminders])

  /**
   * 更新提醒
   */
  const updateReminder = useCallback((id: string, updates: Partial<SimpleTextReminder>) => {
    setReminders(prev => 
      prev.map(reminder => 
        reminder.id === id 
          ? { ...reminder, ...updates }
          : reminder
      )
    )
  }, [setReminders])

  /**
   * 刪除提醒
   */
  const deleteReminder = useCallback((id: string) => {
    setReminders(prev => prev.filter(reminder => reminder.id !== id))
  }, [setReminders])

  /**
   * 忽略提醒
   */
  const dismissReminder = useCallback((id: string) => {
    updateReminder(id, { enabled: false })
  }, [updateReminder])

  /**
   * 延後提醒
   */
  const snoozeReminder = useCallback((id: string, minutes: number = 30) => {
    updateReminder(id, { 
      lastTriggered: new Date(),
      snoozeMinutes: minutes 
    })
  }, [updateReminder])

  /**
   * 獲取指定日期的事件
   */
  const getEventsForDate = useCallback((date: Date): CalendarEvent[] => {
    const targetDate = new Date(date)
    targetDate.setHours(0, 0, 0, 0)
    
    return events.filter(event => {
      const eventDate = new Date(event.startDate)
      eventDate.setHours(0, 0, 0, 0)
      
      if (event.allDay) {
        return eventDate.getTime() === targetDate.getTime()
      }
      
      // 檢查事件是否跨越指定日期
      const endDate = event.endDate ? new Date(event.endDate) : eventDate
      return eventDate <= targetDate && endDate >= targetDate
    })
  }, [events])

  /**
   * 獲取即將到來的事件
   */
  const getUpcomingEvents = useCallback((days: number = 7): CalendarEvent[] => {
    const now = new Date()
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
    
    return events
      .filter(event => {
        const eventDate = new Date(event.startDate)
        return eventDate >= now && eventDate <= futureDate && event.status !== 'cancelled'
      })
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
  }, [events])

  /**
   * 獲取專案相關事件
   */
  const getProjectEvents = useCallback((projectId: string): CalendarEvent[] => {
    return events.filter(event => event.projectId === projectId)
  }, [events])

  /**
   * 獲取活動提醒
   */
  const getActiveReminders = useCallback((): SimpleTextReminder[] => {
    const now = new Date()
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    const currentDay = now.getDay()
    
    return reminders.filter(reminder => {
      if (!reminder.enabled) return false
      
      // 檢查時間觸發條件
      if (reminder.triggers.timeOfDay) {
        if (reminder.triggers.timeOfDay !== currentTime) return false
        
        // 檢查星期幾
        if (reminder.triggers.daysOfWeek && !reminder.triggers.daysOfWeek.includes(currentDay)) {
          return false
        }
        
        // 檢查是否已經在延後時間內
        if (reminder.lastTriggered) {
          const timeSinceLastTrigger = now.getTime() - reminder.lastTriggered.getTime()
          const snoozeTime = reminder.snoozeMinutes * 60 * 1000
          if (timeSinceLastTrigger < snoozeTime) return false
        }
        
        return true
      }
      
      // 其他觸發條件可以在這裡檢查
      // 例如：專案截止日期、任務數量等
      
      return false
    })
  }, [reminders])

  /**
   * 為專案生成里程碑
   */
  const generateProjectMilestones = useCallback((projectId: string): CalendarEvent[] => {
    // 這裡需要專案資料來生成里程碑
    // 暫時返回空數組，實際實現時需要專案數據
    const milestones: CalendarEvent[] = []
    
    // 示例里程碑生成邏輯
    const now = new Date()
    const milestoneTypes = [
      { name: '專案啟動', days: 0, type: 'start' as const },
      { name: '第一階段完成', days: 7, type: 'phase' as const },
      { name: '中期檢查', days: 14, type: 'review' as const },
      { name: '專案截止', days: 30, type: 'deadline' as const }
    ]
    
    milestoneTypes.forEach((milestone) => {
      const milestoneDate = new Date(now.getTime() + milestone.days * 24 * 60 * 60 * 1000)
      
      milestones.push({
        id: crypto.randomUUID(),
        userId,
        projectId,
        title: milestone.name,
        type: 'milestone',
        startDate: milestoneDate,
        allDay: true,
        reminders: [
          { type: 'popup', minutesBefore: 1440 }, // 1天前
          { type: 'popup', minutesBefore: 60 }    // 1小時前
        ],
        projectMilestone: {
          milestoneType: milestone.type,
          criticalPath: milestone.type === 'deadline'
        },
        status: 'scheduled',
        createdAt: new Date(),
        updatedAt: new Date()
      })
    })
    
    return milestones
  }, [userId])

  // 定期檢查提醒觸發
  useEffect(() => {
    const checkReminders = () => {
      const activeReminders = getActiveReminders()
      
      activeReminders.forEach(reminder => {
        // 檢查通知偏好設定並觸發提醒通知
        const notificationSettings = preferencesManager.getNotificationSettings()
        
        if (notificationSettings.browserNotifications && 
            'Notification' in window && 
            Notification.permission === 'granted') {
          new Notification(`${reminder.emoji} 提醒`, {
            body: reminder.message,
            icon: '/favicon.ico'
          })
        }
        
        // 更新最後觸發時間
        updateReminder(reminder.id, { lastTriggered: new Date() })
      })
    }
    
    // 每分鐘檢查一次
    const interval = setInterval(checkReminders, 60 * 1000)
    
    return () => clearInterval(interval)
  }, [getActiveReminders, updateReminder])

  const value: CalendarContextType = {
    events,
    reminders,
    addEvent,
    updateEvent,
    deleteEvent,
    addReminder,
    updateReminder,
    deleteReminder,
    dismissReminder,
    snoozeReminder,
    getEventsForDate,
    getUpcomingEvents,
    getProjectEvents,
    getActiveReminders,
    generateProjectMilestones
  }

  return (
    <CalendarContext.Provider value={value}>
      {children}
    </CalendarContext.Provider>
  )
}