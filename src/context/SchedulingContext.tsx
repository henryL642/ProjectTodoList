/**
 * SchedulingContext - React context for SmartScheduler integration
 * Part of MVP Implementation Guide Day 3-4
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { SmartScheduler, createScheduler } from '../services/scheduling/SmartScheduler'
import type { SchedulingResult } from '../services/scheduling/SmartScheduler'
import type { Todo } from '../types/todo'
import type { 
  PomodoroSlot, 
  SchedulePreferences, 
  ScheduleItem
} from '../types/mvp-scheduling'
import { 
  DEFAULT_SCHEDULE_PREFERENCES 
} from '../types/mvp-scheduling'
import { useLocalStorage } from '../hooks/useLocalStorage'

interface SchedulingContextType {
  // Scheduler instance
  scheduler: SmartScheduler
  
  // Scheduled slots
  scheduledSlots: PomodoroSlot[]
  setScheduledSlots: (slots: PomodoroSlot[]) => void
  
  // Preferences
  preferences: SchedulePreferences
  updatePreferences: (prefs: Partial<SchedulePreferences>) => void
  
  // Core scheduling functions
  scheduleTodo: (todo: Todo) => Promise<SchedulingResult>
  scheduleTodos: (todos: Todo[]) => Promise<SchedulingResult>
  rescheduleSlot: (slotId: string, newDate: Date, newStartTime: string) => Promise<boolean>
  deleteScheduledSlot: (slotId: string) => Promise<boolean>
  markSlotCompleted: (slotId: string) => Promise<boolean>
  
  // Query functions
  getDaySchedule: (date: Date) => ScheduleItem[]
  getAvailableSlots: (date: Date) => { startTime: string; endTime: string }[]
  getTodoScheduledSlots: (todoId: string) => PomodoroSlot[]
  
  // State
  isScheduling: boolean
  lastSchedulingResult: SchedulingResult | null
}

const SchedulingContext = createContext<SchedulingContextType | undefined>(undefined)

export const useScheduling = (): SchedulingContextType => {
  const context = useContext(SchedulingContext)
  if (!context) {
    throw new Error('useScheduling must be used within a SchedulingProvider')
  }
  return context
}

interface SchedulingProviderProps {
  children: React.ReactNode
}

export const SchedulingProvider: React.FC<SchedulingProviderProps> = ({ children }) => {
  // Persistent storage for scheduled slots and preferences
  const [scheduledSlots, setScheduledSlots] = useLocalStorage<PomodoroSlot[]>('scheduledSlots', [])
  const [preferences, setPreferences] = useLocalStorage<SchedulePreferences>('schedulePreferences', DEFAULT_SCHEDULE_PREFERENCES)
  
  // Runtime state
  const [isScheduling, setIsScheduling] = useState(false)
  const [lastSchedulingResult, setLastSchedulingResult] = useState<SchedulingResult | null>(null)
  const [scheduler] = useState(() => createScheduler(preferences))

  // Update scheduler when preferences or slots change
  useEffect(() => {
    scheduler.updatePreferences(preferences)
    scheduler.setExistingSlots(scheduledSlots)
  }, [scheduler, preferences, scheduledSlots])

  // Parse dates when loading from localStorage (similar to todos)
  useEffect(() => {
    const slotsWithDates = scheduledSlots.map(slot => ({
      ...slot,
      date: typeof slot.date === 'string' ? new Date(slot.date) : slot.date,
      actualStart: slot.actualStart ? (typeof slot.actualStart === 'string' ? new Date(slot.actualStart) : slot.actualStart) : undefined,
      actualEnd: slot.actualEnd ? (typeof slot.actualEnd === 'string' ? new Date(slot.actualEnd) : slot.actualEnd) : undefined
    }))
    
    // Only update if dates were actually strings
    const needsUpdate = scheduledSlots.some(slot => typeof slot.date === 'string')
    if (needsUpdate) {
      setScheduledSlots(slotsWithDates)
    }
  }, [scheduledSlots, setScheduledSlots])

  const updatePreferences = useCallback(async (newPrefs: Partial<SchedulePreferences>) => {
    const updatedPrefs = { ...preferences, ...newPrefs }
    setPreferences(updatedPrefs)
    scheduler.updatePreferences(updatedPrefs)
  }, [preferences, setPreferences, scheduler])

  const scheduleTodo = useCallback(async (todo: Todo): Promise<SchedulingResult> => {
    setIsScheduling(true)
    try {
      const result = scheduler.scheduleTodo(todo)
      setLastSchedulingResult(result)
      
      if (result.success) {
        const newSlots = [...scheduledSlots, ...result.scheduledSlots]
        setScheduledSlots(newSlots)
      }
      
      return result
    } finally {
      setIsScheduling(false)
    }
  }, [scheduler, scheduledSlots, setScheduledSlots])

  const scheduleTodos = useCallback(async (todos: Todo[]): Promise<SchedulingResult> => {
    setIsScheduling(true)
    try {
      const result = scheduler.scheduleTodos(todos)
      setLastSchedulingResult(result)
      
      if (result.success && result.scheduledSlots.length > 0) {
        const newSlots = [...scheduledSlots, ...result.scheduledSlots]
        setScheduledSlots(newSlots)
      }
      
      return result
    } finally {
      setIsScheduling(false)
    }
  }, [scheduler, scheduledSlots, setScheduledSlots])

  const rescheduleSlot = useCallback(async (slotId: string, newDate: Date, newStartTime: string): Promise<boolean> => {
    try {
      const updatedSlots = scheduledSlots.map(slot => {
        if (slot.id === slotId) {
          const endTime = new Date(newDate)
          endTime.setHours(
            parseInt(newStartTime.split(':')[0]),
            parseInt(newStartTime.split(':')[1]) + 25 // 25 minute pomodoro
          )
          
          return {
            ...slot,
            date: newDate,
            startTime: newStartTime,
            endTime: endTime.toTimeString().slice(0, 5)
          }
        }
        return slot
      })
      
      setScheduledSlots(updatedSlots)
      return true
    } catch (error) {
      console.error('Failed to reschedule slot:', error)
      return false
    }
  }, [scheduledSlots, setScheduledSlots])

  const deleteScheduledSlot = useCallback(async (slotId: string): Promise<boolean> => {
    try {
      const updatedSlots = scheduledSlots.filter(slot => slot.id !== slotId)
      setScheduledSlots(updatedSlots)
      return true
    } catch (error) {
      console.error('Failed to delete scheduled slot:', error)
      return false
    }
  }, [scheduledSlots, setScheduledSlots])

  const markSlotCompleted = useCallback(async (slotId: string): Promise<boolean> => {
    try {
      const updatedSlots = scheduledSlots.map(slot => {
        if (slot.id === slotId) {
          return {
            ...slot,
            status: 'completed' as const,
            actualStart: slot.actualStart || new Date(),
            actualEnd: new Date()
          }
        }
        return slot
      })
      
      setScheduledSlots(updatedSlots)
      return true
    } catch (error) {
      console.error('Failed to mark slot as completed:', error)
      return false
    }
  }, [scheduledSlots, setScheduledSlots])

  const getDaySchedule = useCallback((date: Date): ScheduleItem[] => {
    // Update scheduler with current slots before querying
    scheduler.setExistingSlots(scheduledSlots)
    return scheduler.getDaySchedule(date)
  }, [scheduler, scheduledSlots])

  const getAvailableSlots = useCallback((date: Date): { startTime: string; endTime: string }[] => {
    // Update scheduler with current slots before querying
    scheduler.setExistingSlots(scheduledSlots)
    return scheduler.getAvailableSlots(date)
  }, [scheduler, scheduledSlots])

  const getTodoScheduledSlots = useCallback((todoId: string): PomodoroSlot[] => {
    return scheduledSlots.filter(slot => slot.todoId === todoId)
  }, [scheduledSlots])

  const contextValue: SchedulingContextType = {
    scheduler,
    scheduledSlots,
    setScheduledSlots,
    preferences,
    updatePreferences,
    scheduleTodo,
    scheduleTodos,
    rescheduleSlot,
    deleteScheduledSlot,
    markSlotCompleted,
    getDaySchedule,
    getAvailableSlots,
    getTodoScheduledSlots,
    isScheduling,
    lastSchedulingResult
  }

  return (
    <SchedulingContext.Provider value={contextValue}>
      {children}
    </SchedulingContext.Provider>
  )
}

// Utility hooks for common use cases

/**
 * Hook to get today's schedule
 */
export const useTodaySchedule = () => {
  const { getDaySchedule } = useScheduling()
  const [todaySchedule, setTodaySchedule] = useState<ScheduleItem[]>([])
  
  useEffect(() => {
    const today = new Date()
    const schedule = getDaySchedule(today)
    setTodaySchedule(schedule)
  }, [getDaySchedule])
  
  return todaySchedule
}

/**
 * Hook to get scheduled slots for a specific todo
 */
export const useTodoSchedule = (todoId: string) => {
  const { getTodoScheduledSlots } = useScheduling()
  return getTodoScheduledSlots(todoId)
}

/**
 * Hook to automatically schedule a todo when it's created
 */
export const useAutoSchedule = () => {
  const { scheduleTodo, isScheduling } = useScheduling()
  
  const autoScheduleTodo = useCallback(async (todo: Todo) => {
    if (todo.totalPomodoros > 0) {
      const result = await scheduleTodo(todo)
      if (result.success) {
        console.log(`✅ 自動安排任務: ${todo.text} (${result.scheduledSlots.length} 個番茄鐘)`)
      } else {
        console.warn(`⚠️ 無法自動安排任務: ${todo.text} - ${result.message}`)
      }
      return result
    }
    return null
  }, [scheduleTodo])
  
  return { autoScheduleTodo, isScheduling }
}