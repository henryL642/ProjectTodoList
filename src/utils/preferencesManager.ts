/**
 * 偏好設定管理器 - 處理用戶偏好設定的存儲和同步
 */

export interface UserPreferences {
  // 外觀設定
  theme: 'light' | 'dark' | 'system'
  colorScheme: 'blue' | 'green' | 'purple' | 'pink' | 'orange'
  language: 'zh-TW' | 'zh-CN' | 'en-US'
  fontSize: 'small' | 'medium' | 'large'
  
  // 任務設定
  defaultProjectId?: string
  defaultPriority: 'low' | 'medium' | 'high'
  taskSortBy: 'created' | 'priority' | 'dueDate' | 'alphabetical'
  showCompletedTasks: boolean
  autoArchiveCompleted: boolean
  autoArchiveDays: number
  
  // 工作設定
  workingHours: {
    start: number // 0-23
    end: number   // 0-23
    workDays: number[] // 0-6, 0=Sunday
  }
  dailyTaskLimit: number
  autoSaveInterval: number // minutes
  
  // 番茄鐘設定
  pomodoroSettings: {
    workDuration: number    // minutes
    shortBreak: number      // minutes
    longBreak: number       // minutes
    longBreakInterval: number // sessions
    autoStartBreaks: boolean
    autoStartPomodoros: boolean
    playNotificationSound: boolean
  }
  
  // 行事曆設定
  calendarSettings: {
    defaultView: 'month' | 'week' | 'day'
    weekStartsOn: 0 | 1 // 0=Sunday, 1=Monday
    showWeekends: boolean
    timeFormat: '12h' | '24h'
  }
}

export interface NotificationSettings {
  // 瀏覽器通知
  browserNotifications: boolean
  
  // 任務提醒
  taskReminders: {
    enabled: boolean
    dueDateReminder: number[] // minutes before due date [1440, 60, 30]
    overdue: boolean
    dailySummary: {
      enabled: boolean
      time: string // "08:00"
    }
  }
  
  // 專案通知
  projectNotifications: {
    enabled: boolean
    milestones: boolean
    weeklyReport: {
      enabled: boolean
      day: number // 0-6, 0=Sunday
      time: string // "18:00"
    }
  }
  
  // 番茄鐘通知
  pomodoroNotifications: {
    enabled: boolean
    workSessionEnd: boolean
    breakEnd: boolean
    longBreakReminder: boolean
  }
  
  // 郵件通知 (未來功能)
  emailNotifications: {
    enabled: boolean
    email?: string
    frequency: 'immediate' | 'daily' | 'weekly'
  }
}

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'system',
  colorScheme: 'blue',
  language: 'zh-TW',
  fontSize: 'medium',
  
  defaultPriority: 'medium',
  taskSortBy: 'created',
  showCompletedTasks: true,
  autoArchiveCompleted: false,
  autoArchiveDays: 30,
  
  workingHours: {
    start: 9,
    end: 18,
    workDays: [1, 2, 3, 4, 5] // Monday to Friday
  },
  dailyTaskLimit: 10,
  autoSaveInterval: 5,
  
  pomodoroSettings: {
    workDuration: 25,
    shortBreak: 5,
    longBreak: 15,
    longBreakInterval: 4,
    autoStartBreaks: false,
    autoStartPomodoros: false,
    playNotificationSound: true
  },
  
  calendarSettings: {
    defaultView: 'month',
    weekStartsOn: 1,
    showWeekends: true,
    timeFormat: '24h'
  }
}

const DEFAULT_NOTIFICATIONS: NotificationSettings = {
  browserNotifications: false,
  
  taskReminders: {
    enabled: true,
    dueDateReminder: [1440, 60], // 1 day, 1 hour before
    overdue: true,
    dailySummary: {
      enabled: false,
      time: "08:00"
    }
  },
  
  projectNotifications: {
    enabled: true,
    milestones: true,
    weeklyReport: {
      enabled: false,
      day: 5, // Friday
      time: "17:00"
    }
  },
  
  pomodoroNotifications: {
    enabled: true,
    workSessionEnd: true,
    breakEnd: true,
    longBreakReminder: true
  },
  
  emailNotifications: {
    enabled: false,
    frequency: 'daily'
  }
}

export class PreferencesManager {
  private preferences: UserPreferences
  private notifications: NotificationSettings
  private listeners: (() => void)[] = []

  constructor() {
    this.preferences = this.loadPreferences()
    this.notifications = this.loadNotifications()
    
    // 監聽系統主題變化
    if (this.preferences.theme === 'system') {
      this.watchSystemTheme()
    }
  }

  /**
   * 載入偏好設定
   */
  private loadPreferences(): UserPreferences {
    try {
      const stored = localStorage.getItem('userPreferences')
      if (stored) {
        const parsed = JSON.parse(stored)
        return { ...DEFAULT_PREFERENCES, ...parsed }
      }
    } catch (error) {
      console.error('Failed to load preferences:', error)
    }
    return DEFAULT_PREFERENCES
  }

  /**
   * 載入通知設定
   */
  private loadNotifications(): NotificationSettings {
    try {
      const stored = localStorage.getItem('notificationSettings')
      if (stored) {
        const parsed = JSON.parse(stored)
        return { ...DEFAULT_NOTIFICATIONS, ...parsed }
      }
    } catch (error) {
      console.error('Failed to load notification settings:', error)
    }
    return DEFAULT_NOTIFICATIONS
  }

  /**
   * 儲存偏好設定
   */
  private savePreferences(): void {
    try {
      localStorage.setItem('userPreferences', JSON.stringify(this.preferences))
      this.notifyListeners()
    } catch (error) {
      console.error('Failed to save preferences:', error)
    }
  }

  /**
   * 儲存通知設定
   */
  private saveNotifications(): void {
    try {
      localStorage.setItem('notificationSettings', JSON.stringify(this.notifications))
      this.notifyListeners()
    } catch (error) {
      console.error('Failed to save notification settings:', error)
    }
  }

  /**
   * 監聽系統主題變化
   */
  private watchSystemTheme(): void {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      if (this.preferences.theme === 'system') {
        this.applyTheme()
      }
    }
    
    mediaQuery.addEventListener('change', handleChange)
  }

  /**
   * 應用主題
   */
  private applyTheme(): void {
    const root = document.documentElement
    let actualTheme = this.preferences.theme
    
    if (actualTheme === 'system') {
      actualTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    
    root.setAttribute('data-theme', actualTheme)
    root.setAttribute('data-color-scheme', this.preferences.colorScheme)
    
    // 設定字體大小
    const fontSizeMap = {
      small: '14px',
      medium: '16px',
      large: '18px'
    }
    root.style.setProperty('--base-font-size', fontSizeMap[this.preferences.fontSize])
  }

  /**
   * 通知監聽器
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener())
  }

  /**
   * 添加變更監聽器
   */
  addChangeListener(listener: () => void): void {
    this.listeners.push(listener)
  }

  /**
   * 移除變更監聽器
   */
  removeChangeListener(listener: () => void): void {
    this.listeners = this.listeners.filter(l => l !== listener)
  }

  /**
   * 獲取偏好設定
   */
  getPreferences(): UserPreferences {
    return { ...this.preferences }
  }

  /**
   * 獲取通知設定
   */
  getNotificationSettings(): NotificationSettings {
    return { ...this.notifications }
  }

  /**
   * 更新偏好設定
   */
  updatePreferences(updates: Partial<UserPreferences>): void {
    const oldTheme = this.preferences.theme
    this.preferences = { ...this.preferences, ...updates }
    this.savePreferences()
    
    // 如果主題相關設定變更，重新應用主題
    if (updates.theme !== undefined || updates.colorScheme !== undefined || updates.fontSize !== undefined) {
      this.applyTheme()
    }
    
    // 如果主題從系統模式變更，需要重新設定監聽
    if (oldTheme === 'system' && updates.theme !== 'system') {
      // 停止監聽系統主題變化（在實際實現中需要存儲 mediaQuery 引用）
    } else if (oldTheme !== 'system' && updates.theme === 'system') {
      this.watchSystemTheme()
    }
  }

  /**
   * 更新通知設定
   */
  updateNotificationSettings(updates: Partial<NotificationSettings>): void {
    this.notifications = { ...this.notifications, ...updates }
    this.saveNotifications()
    
    // 如果啟用瀏覽器通知，請求權限
    if (updates.browserNotifications && 'Notification' in window) {
      this.requestNotificationPermission()
    }
  }

  /**
   * 請求通知權限
   */
  async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      return false
    }
    
    if (Notification.permission === 'granted') {
      return true
    }
    
    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    }
    
    return false
  }

  /**
   * 發送通知
   */
  sendNotification(title: string, options?: NotificationOptions): void {
    if (!this.notifications.browserNotifications || Notification.permission !== 'granted') {
      return
    }
    
    new Notification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      ...options
    })
  }

  /**
   * 重置為默認設定
   */
  resetToDefaults(): void {
    this.preferences = { ...DEFAULT_PREFERENCES }
    this.notifications = { ...DEFAULT_NOTIFICATIONS }
    this.savePreferences()
    this.saveNotifications()
    this.applyTheme()
  }

  /**
   * 初始化
   */
  init(): void {
    this.applyTheme()
  }

  /**
   * 檢查是否在工作時間
   */
  isWorkingHours(): boolean {
    const now = new Date()
    const currentHour = now.getHours()
    const currentDay = now.getDay()
    
    const { start, end, workDays } = this.preferences.workingHours
    
    return workDays.includes(currentDay) && currentHour >= start && currentHour < end
  }

  /**
   * 獲取今日任務限制
   */
  getDailyTaskLimit(): number {
    return this.preferences.dailyTaskLimit
  }

  /**
   * 獲取番茄鐘設定
   */
  getPomodoroSettings() {
    return { ...this.preferences.pomodoroSettings }
  }

  /**
   * 獲取行事曆設定
   */
  getCalendarSettings() {
    return { ...this.preferences.calendarSettings }
  }
}

// 創建全局實例
export const preferencesManager = new PreferencesManager()