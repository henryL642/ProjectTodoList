import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import type { 
  PomodoroSession, 
  PomodoroSettings, 
  AudioSettings, 
  PomodoroStats,
  PomodoroState,
  HealthReminderType,
  PomodoroContextType
} from '../types/pomodoro'
import { AudioManager } from '../utils/audioManager'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { preferencesManager } from '../utils/preferencesManager'

const PomodoroContext = createContext<PomodoroContextType | undefined>(undefined)

export const usePomodoro = () => {
  const context = useContext(PomodoroContext)
  if (context === undefined) {
    throw new Error('usePomodoro must be used within a PomodoroProvider')
  }
  return context
}

interface PomodoroProviderProps {
  children: React.ReactNode
  userId: string
}

export const PomodoroProvider: React.FC<PomodoroProviderProps> = ({ children, userId }) => {
  // 從偏好設定獲取番茄鐘設定
  const getDefaultSettings = (): PomodoroSettings => {
    const prefs = preferencesManager.getPreferences()
    return {
      workDuration: prefs.pomodoroSettings.workDuration,
      shortBreakDuration: prefs.pomodoroSettings.shortBreak,
      longBreakDuration: prefs.pomodoroSettings.longBreak,
      sessionsUntilLongBreak: prefs.pomodoroSettings.longBreakInterval
    }
  }


  const getDefaultAudioSettings = (): AudioSettings => {
    const prefs = preferencesManager.getPreferences()
    return {
      userId,
      sounds: {
        workStart: 'work-start',
        workEnd: 'work-end',
        breakStart: 'break-start',
        breakEnd: 'break-end',
        healthReminder: 'health-reminder'
      },
      volume: 0.7,
      enabled: prefs.pomodoroSettings.playNotificationSound
    }
  }

  const defaultAudioSettings: AudioSettings = {
    userId,
    sounds: {
      workStart: 'work-start',
      workEnd: 'work-end',
      breakStart: 'break-start',
      breakEnd: 'break-end',
      healthReminder: 'health-reminder'
    },
    volume: 0.7,
    enabled: true
  }

  // 狀態管理
  const [currentSession, setCurrentSession] = useState<PomodoroSession | null>(null)
  const [settings, setSettings] = useLocalStorage<PomodoroSettings>(
    `pomodoro_settings_${userId}`, 
    getDefaultSettings()
  )
  const [audioSettings, setAudioSettings] = useLocalStorage<AudioSettings>(
    `pomodoro_audio_${userId}`, 
    getDefaultAudioSettings()
  )
  const [dailyStats, setDailyStats] = useLocalStorage<PomodoroStats>(
    `pomodoro_daily_${userId}_${new Date().toDateString()}`, 
    {
      completedSessions: 0,
      totalWorkTime: 0,
      totalBreakTime: 0,
      interruptionCount: 0
    }
  )

  // Refs
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const audioManagerRef = useRef<AudioManager | null>(null)
  const healthReminderTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // 初始化音效管理器 (只執行一次)
  useEffect(() => {
    if (!audioManagerRef.current) {
      audioManagerRef.current = new AudioManager(defaultAudioSettings)
    }
    
    return () => {
      if (audioManagerRef.current) {
        audioManagerRef.current.dispose()
        audioManagerRef.current = null
      }
    }
  }, [])

  // 清理定時器
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      if (healthReminderTimeoutRef.current) {
        clearTimeout(healthReminderTimeoutRef.current)
      }
    }
  }, [])

  // 監聽偏好設定變化，同步番茄鐘設定
  useEffect(() => {
    const handlePreferencesChange = () => {
      const newSettings = getDefaultSettings()
      const newAudioSettings = getDefaultAudioSettings()
      setSettings(newSettings)
      setAudioSettings(newAudioSettings)
    }

    preferencesManager.addChangeListener(handlePreferencesChange)
    return () => preferencesManager.removeChangeListener(handlePreferencesChange)
  }, [setSettings, setAudioSettings])

  /**
   * 開始番茄鐘會話
   */
  const startSession = useCallback((projectId?: string, taskId?: string) => {
    if (currentSession) {
      console.warn('Session already in progress')
      return
    }

    const newSession: PomodoroSession = {
      id: crypto.randomUUID(),
      userId,
      projectId,
      taskId,
      settings,
      currentState: 'working',
      currentSession: 1,
      startTime: new Date(),
      timeRemaining: settings.workDuration * 60, // 轉換為秒
      stats: {
        completedSessions: 0,
        totalWorkTime: 0,
        totalBreakTime: 0,
        interruptionCount: 0
      },
      healthReminders: {
        eyeRestEnabled: true,
        postureReminderEnabled: true,
        hydrationReminderEnabled: true,
        lastHealthCheck: new Date()
      }
    }

    setCurrentSession(newSession)
    audioManagerRef.current?.play('workStart')
    startTimer()
    scheduleHealthReminders()
  }, [currentSession, userId, settings])

  /**
   * 暫停會話
   */
  const pauseSession = useCallback(() => {
    if (!currentSession || currentSession.currentState === 'paused') return

    setCurrentSession(prev => prev ? { ...prev, currentState: 'paused' } : null)
    stopTimer()
  }, [currentSession])

  /**
   * 恢復會話
   */
  const resumeSession = useCallback(() => {
    if (!currentSession || currentSession.currentState !== 'paused') return

    setCurrentSession(prev => prev ? { 
      ...prev, 
      currentState: prev.currentState === 'paused' ? 'working' : prev.currentState 
    } : null)
    startTimer()
  }, [currentSession])

  /**
   * 停止會話
   */
  const stopSession = useCallback(() => {
    if (!currentSession) return

    // 記錄中斷
    setCurrentSession(prev => {
      if (!prev) return null
      
      const updatedStats = {
        ...prev.stats,
        interruptionCount: prev.stats.interruptionCount + 1
      }

      // 更新每日統計
      setDailyStats(dailyStats => ({
        ...dailyStats,
        interruptionCount: dailyStats.interruptionCount + 1
      }))

      return { ...prev, stats: updatedStats }
    })

    stopTimer()
    setCurrentSession(null)
  }, [currentSession, setDailyStats])

  /**
   * 開始計時器
   */
  const startTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    intervalRef.current = setInterval(() => {
      setCurrentSession(prev => {
        if (!prev) return null

        const newTimeRemaining = prev.timeRemaining - 1

        if (newTimeRemaining <= 0) {
          handleStateTransition(prev)
          return prev
        }

        return { ...prev, timeRemaining: newTimeRemaining }
      })
    }, 1000)
  }, [])

  /**
   * 停止計時器
   */
  const stopTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  /**
   * 處理狀態轉換
   */
  const handleStateTransition = useCallback((session: PomodoroSession) => {
    const { currentState, currentSession: sessionNum, settings } = session

    switch (currentState) {
      case 'working':
        // 工作完成
        audioManagerRef.current?.play('workEnd')
        
        // 更新統計
        const workMinutes = settings.workDuration
        setCurrentSession(prev => {
          if (!prev) return null
          
          const updatedStats = {
            ...prev.stats,
            completedSessions: prev.stats.completedSessions + 1,
            totalWorkTime: prev.stats.totalWorkTime + workMinutes
          }

          return { ...prev, stats: updatedStats }
        })

        setDailyStats(prev => ({
          ...prev,
          completedSessions: prev.completedSessions + 1,
          totalWorkTime: prev.totalWorkTime + workMinutes
        }))

        // 決定休息類型
        const isLongBreak = sessionNum % settings.sessionsUntilLongBreak === 0
        const breakDuration = isLongBreak ? settings.longBreakDuration : settings.shortBreakDuration
        const newState: PomodoroState = isLongBreak ? 'longBreak' : 'shortBreak'

        startBreak(newState, breakDuration)
        break

      case 'shortBreak':
      case 'longBreak':
        // 休息完成
        audioManagerRef.current?.play('breakEnd')
        
        // 更新統計
        const breakMinutes = currentState === 'longBreak' 
          ? settings.longBreakDuration 
          : settings.shortBreakDuration
          
        setCurrentSession(prev => {
          if (!prev) return null
          
          const updatedStats = {
            ...prev.stats,
            totalBreakTime: prev.stats.totalBreakTime + breakMinutes
          }

          return { ...prev, stats: updatedStats }
        })

        setDailyStats(prev => ({
          ...prev,
          totalBreakTime: prev.totalBreakTime + breakMinutes
        }))

        startWork()
        break
    }
  }, [setDailyStats])

  /**
   * 開始休息
   */
  const startBreak = useCallback((breakType: 'shortBreak' | 'longBreak', duration: number) => {
    audioManagerRef.current?.play('breakStart')
    
    setCurrentSession(prev => {
      if (!prev) return null
      
      return {
        ...prev,
        currentState: breakType,
        timeRemaining: duration * 60
      }
    })

    startTimer()
  }, [startTimer])

  /**
   * 開始工作
   */
  const startWork = useCallback(() => {
    audioManagerRef.current?.play('workStart')
    
    setCurrentSession(prev => {
      if (!prev) return null
      
      return {
        ...prev,
        currentState: 'working',
        currentSession: prev.currentSession + 1,
        timeRemaining: prev.settings.workDuration * 60
      }
    })

    startTimer()
    scheduleHealthReminders()
  }, [startTimer])

  /**
   * 安排健康提醒
   */
  const scheduleHealthReminders = useCallback(() => {
    if (!currentSession?.healthReminders) return

    // 眼部休息提醒 - 每20分鐘
    if (currentSession.healthReminders.eyeRestEnabled) {
      setTimeout(() => {
        showHealthReminder('eye_rest')
      }, 20 * 60 * 1000)
    }

    // 姿勢提醒 - 每30分鐘
    if (currentSession.healthReminders.postureReminderEnabled) {
      setTimeout(() => {
        showHealthReminder('posture')
      }, 30 * 60 * 1000)
    }
  }, [currentSession])

  /**
   * 顯示健康提醒
   */
  const showHealthReminder = useCallback((type: HealthReminderType) => {
    const reminders = {
      eye_rest: {
        title: '👀 眼部休息',
        message: '看向遠方20秒，讓眼睛放鬆一下'
      },
      posture: {
        title: '🧘‍♀️ 姿勢提醒',
        message: '起身伸展，活動一下身體'
      },
      hydration: {
        title: '💧 補水提醒',
        message: '記得喝水，保持身體水分'
      }
    }

    const reminder = reminders[type]
    audioManagerRef.current?.play('healthReminder')

    // 檢查通知偏好設定並觸發通知
    const notificationSettings = preferencesManager.getNotificationSettings()
    
    if (notificationSettings.browserNotifications && 
        'Notification' in window && 
        Notification.permission === 'granted') {
      new Notification(reminder.title, {
        body: reminder.message,
        icon: '/favicon.ico'
      })
    }

    // 更新健康檢查時間
    setCurrentSession(prev => {
      if (!prev) return null
      
      return {
        ...prev,
        healthReminders: {
          ...prev.healthReminders,
          lastHealthCheck: new Date()
        }
      }
    })
  }, [])

  /**
   * 更新設定
   */
  const updateSettings = useCallback((newSettings: Partial<PomodoroSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }))
  }, [setSettings])

  /**
   * 更新音效設定
   */
  const updateAudioSettings = useCallback((newAudioSettings: Partial<AudioSettings>) => {
    const updated = { ...audioSettings, ...newAudioSettings }
    setAudioSettings(updated)
    audioManagerRef.current?.updateSettings(updated)
  }, [audioSettings, setAudioSettings])

  /**
   * 獲取每日統計
   */
  const getDailyStats = useCallback((): PomodoroStats => {
    return dailyStats
  }, [dailyStats])

  /**
   * 獲取週統計
   */
  const getWeeklyStats = useCallback((): PomodoroStats => {
    // 這裡應該實現週統計邏輯
    // 暫時返回每日統計
    return dailyStats
  }, [dailyStats])

  /**
   * 獲取專案統計
   */
  const getProjectStats = useCallback((_projectId: string): PomodoroStats => {
    // 這裡應該實現專案統計邏輯
    // 暫時返回空統計
    return {
      completedSessions: 0,
      totalWorkTime: 0,
      totalBreakTime: 0,
      interruptionCount: 0
    }
  }, [])

  const value: PomodoroContextType = {
    currentSession,
    settings,
    audioSettings,
    startSession,
    pauseSession,
    resumeSession,
    stopSession,
    updateSettings,
    updateAudioSettings,
    getDailyStats,
    getWeeklyStats,
    getProjectStats
  }

  return (
    <PomodoroContext.Provider value={value}>
      {children}
    </PomodoroContext.Provider>
  )
}