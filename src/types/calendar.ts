// Calendar and Reminder Types

export interface CalendarEvent {
  id: string
  userId: string
  projectId?: string
  
  // 事件基本信息
  title: string
  description?: string
  type: 'deadline' | 'meeting' | 'work_block' | 'reminder' | 'milestone'
  
  // 時間設定
  startDate: Date
  endDate?: Date
  allDay: boolean
  
  // 任務標識
  isTask?: boolean
  
  // 重複設定
  recurrence?: {
    type: 'daily' | 'weekly' | 'monthly'
    interval: number
    endDate?: Date
  }
  
  // 提醒設定
  reminders: {
    type: 'popup' | 'email' | 'sound'
    minutesBefore: number
  }[]
  
  // 專案關聯
  projectMilestone?: {
    milestoneType: 'start' | 'phase' | 'deadline' | 'review'
    criticalPath: boolean
  }
  
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  createdAt: Date
  updatedAt: Date
}

export interface SimpleTextReminder {
  id: string
  userId: string
  
  // 提醒內容
  message: string
  emoji?: string
  priority: 'low' | 'medium' | 'high'
  
  // 觸發條件
  triggers: {
    timeOfDay?: string        // "09:00"
    daysOfWeek?: number[]     // [1,2,3,4,5] (週一到週五)
    projectDeadline?: number  // 截止日期前 N 天
    taskCount?: number        // 待辦任務超過 N 個
  }
  
  // 顯示設定
  displayDuration: number     // 顯示時間 (秒)
  autoSnooze: boolean
  snoozeMinutes: number
  
  enabled: boolean
  lastTriggered?: Date
}

export interface CalendarContextType {
  // 事件管理
  events: CalendarEvent[]
  reminders: SimpleTextReminder[]
  
  // 事件操作
  addEvent: (event: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>) => string
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => void
  deleteEvent: (id: string) => void
  
  // 提醒操作
  addReminder: (reminder: Omit<SimpleTextReminder, 'id'>) => void
  updateReminder: (id: string, updates: Partial<SimpleTextReminder>) => void
  deleteReminder: (id: string) => void
  dismissReminder: (id: string) => void
  snoozeReminder: (id: string, minutes?: number) => void
  
  // 查詢方法
  getEventsForDate: (date: Date) => CalendarEvent[]
  getUpcomingEvents: (days?: number) => CalendarEvent[]
  getProjectEvents: (projectId: string) => CalendarEvent[]
  getActiveReminders: () => SimpleTextReminder[]
  
  // 自動生成
  generateProjectMilestones: (projectId: string) => CalendarEvent[]
}

// 預設提醒模板
export interface ReminderTemplate {
  id: string
  name: string
  message: string
  emoji: string
  triggers: SimpleTextReminder['triggers']
  category: 'morning' | 'work' | 'break' | 'evening' | 'deadline'
}

// 日曆視圖類型
export type CalendarView = 'day' | 'week' | 'month' | 'agenda'

// 事件狀態變更
export interface EventStatusChange {
  eventId: string
  oldStatus: CalendarEvent['status']
  newStatus: CalendarEvent['status']
  timestamp: Date
  reason?: string
}

// 提醒觸發結果
export interface ReminderTriggerResult {
  reminderId: string
  triggered: boolean
  nextTriggerTime?: Date
  reason?: string
}