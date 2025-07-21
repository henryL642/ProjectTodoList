// Pomodoro Timer Types

export interface PomodoroSettings {
  workDuration: number        // 工作時間 (分鐘)
  shortBreakDuration: number  // 短休息 (分鐘)
  longBreakDuration: number   // 長休息 (分鐘)
  sessionsUntilLongBreak: number
}

export interface PomodoroStats {
  completedSessions: number
  totalWorkTime: number      // 總工作時間 (分鐘)
  totalBreakTime: number     // 總休息時間 (分鐘)
  interruptionCount: number  // 中斷次數
}

export interface HealthReminders {
  eyeRestEnabled: boolean
  postureReminderEnabled: boolean
  hydrationReminderEnabled: boolean
  lastHealthCheck: Date
}

export type PomodoroState = 'idle' | 'working' | 'shortBreak' | 'longBreak' | 'paused'

export interface PomodoroSession {
  id: string
  userId: string
  projectId?: string
  taskId?: string
  
  // 會話配置
  settings: PomodoroSettings
  
  // 當前狀態
  currentState: PomodoroState
  currentSession: number
  startTime: Date
  endTime?: Date
  timeRemaining: number
  
  // 統計數據
  stats: PomodoroStats
  
  // 健康提醒
  healthReminders: HealthReminders
}

export interface AudioSettings {
  userId: string
  
  sounds: {
    workStart: string          // 工作開始音效
    workEnd: string           // 工作結束音效
    breakStart: string        // 休息開始音效
    breakEnd: string          // 休息結束音效
    healthReminder: string    // 健康提醒音效
  }
  
  volume: number              // 音量 (0-1)
  enabled: boolean
}

export interface PomodoroContextType {
  // 當前會話
  currentSession: PomodoroSession | null
  
  // 設定
  settings: PomodoroSettings
  audioSettings: AudioSettings
  
  // 控制方法
  startSession: (projectId?: string, taskId?: string) => void
  pauseSession: () => void
  resumeSession: () => void
  stopSession: () => void
  
  // 設定方法
  updateSettings: (settings: Partial<PomodoroSettings>) => void
  updateAudioSettings: (settings: Partial<AudioSettings>) => void
  
  // 統計方法
  getDailyStats: () => PomodoroStats
  getWeeklyStats: () => PomodoroStats
  getProjectStats: (projectId: string) => PomodoroStats
}

// 健康提醒類型
export type HealthReminderType = 'eye_rest' | 'posture' | 'hydration'

export interface HealthReminderConfig {
  type: HealthReminderType
  title: string
  message: string
  emoji: string
  duration: number // 顯示時間 (毫秒)
  interval: number // 間隔時間 (毫秒)
}

// 音效檔案類型
export type SoundType = 'workStart' | 'workEnd' | 'breakStart' | 'breakEnd' | 'healthReminder'

// 計時器事件
export interface TimerEvent {
  type: 'start' | 'pause' | 'resume' | 'stop' | 'complete' | 'healthReminder'
  timestamp: Date
  sessionId: string
  metadata?: Record<string, any>
}