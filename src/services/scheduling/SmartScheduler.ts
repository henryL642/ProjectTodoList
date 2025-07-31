/**
 * SmartScheduler - Intelligent Pomodoro-based task scheduling service
 * Part of MVP Implementation Guide Day 3-4
 */

import type { Todo } from '../../types/todo'
import { Priority, getPriorityConfig, shouldAutoSchedule } from '../../types/priority'
import type { 
  PomodoroSlot, 
  SchedulePreferences, 
  ScheduleItem
} from '../../types/mvp-scheduling'
import { 
  PomodoroSlotStatus, 
  DEFAULT_SCHEDULE_PREFERENCES,
  formatTime,
  parseTime,
  calculateEndTime,
  isTimeSlotAvailable,
  DEFAULT_POMODORO_CONFIG
} from '../../types/mvp-scheduling'

export interface SchedulingResult {
  success: boolean
  scheduledSlots: PomodoroSlot[]
  conflicts: string[]
  message: string
}

export class SmartScheduler {
  private existingSlots: PomodoroSlot[] = []
  private preferences: SchedulePreferences

  constructor(preferences?: Partial<SchedulePreferences>) {
    this.preferences = { ...DEFAULT_SCHEDULE_PREFERENCES, ...preferences }
  }

  /**
   * Set existing scheduled slots to avoid conflicts
   */
  setExistingSlots(slots: PomodoroSlot[]): void {
    this.existingSlots = slots
  }

  /**
   * Schedule a single todo with automatic time slot assignment
   */
  scheduleTodo(todo: Todo): SchedulingResult {
    if (!shouldAutoSchedule(todo.priority)) {
      return {
        success: false,
        scheduledSlots: [],
        conflicts: [],
        message: '此優先級的任務不建議自動排程'
      }
    }

    const requiredSlots = todo.totalPomodoros
    const startDate = this.getStartDateByPriority(todo.priority)
    const slots: PomodoroSlot[] = []
    const conflicts: string[] = []

    try {
      // Generate required number of pomodoro slots
      for (let i = 0; i < requiredSlots; i++) {
        const slot = this.findNextAvailableSlot(todo, startDate, i)
        if (slot) {
          slots.push(slot)
        } else {
          conflicts.push(`無法為第 ${i + 1} 個番茄鐘找到合適時間`)
        }
      }

      // If we couldn't schedule all slots, it's a partial failure
      if (slots.length < requiredSlots) {
        return {
          success: false,
          scheduledSlots: slots,
          conflicts,
          message: `僅能安排 ${slots.length}/${requiredSlots} 個番茄鐘`
        }
      }

      return {
        success: true,
        scheduledSlots: slots,
        conflicts: [],
        message: `成功安排 ${slots.length} 個番茄鐘`
      }
    } catch (error) {
      return {
        success: false,
        scheduledSlots: [],
        conflicts: [error instanceof Error ? error.message : 'Unknown error'],
        message: '排程過程發生錯誤'
      }
    }
  }

  /**
   * Schedule multiple todos with priority ordering
   */
  scheduleTodos(todos: Todo[]): SchedulingResult {
    // Sort todos by priority order (urgent/important first)
    const sortedTodos = [...todos].sort((a, b) => {
      const configA = getPriorityConfig(a.priority)
      const configB = getPriorityConfig(b.priority)
      return configA.order - configB.order
    })

    const allSlots: PomodoroSlot[] = []
    const allConflicts: string[] = []
    let successCount = 0

    for (const todo of sortedTodos) {
      // Update existing slots with previously scheduled ones
      this.setExistingSlots([...this.existingSlots, ...allSlots])
      
      const result = this.scheduleTodo(todo)
      if (result.success) {
        allSlots.push(...result.scheduledSlots)
        successCount++
      } else {
        allConflicts.push(`${todo.text}: ${result.message}`)
        allConflicts.push(...result.conflicts)
      }
    }

    return {
      success: successCount === sortedTodos.length,
      scheduledSlots: allSlots,
      conflicts: allConflicts,
      message: `成功排程 ${successCount}/${sortedTodos.length} 個任務`
    }
  }

  /**
   * Get the schedule for a specific day
   */
  getDaySchedule(date: Date): ScheduleItem[] {
    const dateString = date.toDateString()
    const daySlots = this.existingSlots.filter(slot => 
      slot.date.toDateString() === dateString
    )

    // Convert slots to schedule items and sort by time
    const scheduleItems: ScheduleItem[] = daySlots.map(slot => ({
      id: slot.id,
      time: slot.startTime,
      task: {
        id: slot.todoId,
        title: `番茄鐘 ${slot.startTime}-${slot.endTime}`,
        projectId: undefined // We'll need to look this up from the todo
      },
      status: slot.status,
      type: 'pomodoro'
    }))

    // Add break periods between pomodoros
    const withBreaks = this.addBreakPeriods(scheduleItems, date)

    // Sort by time
    return withBreaks.sort((a, b) => {
      const timeA = parseTime(a.time)
      const timeB = parseTime(b.time)
      const minutesA = timeA.hours * 60 + timeA.minutes
      const minutesB = timeB.hours * 60 + timeB.minutes
      return minutesA - minutesB
    })
  }

  /**
   * Get available time slots for a specific date
   */
  getAvailableSlots(date: Date): { startTime: string; endTime: string }[] {
    const dateString = date.toDateString()
    const existingOnDate = this.existingSlots.filter(slot => 
      slot.date.toDateString() === dateString
    )

    const availableSlots: { startTime: string; endTime: string }[] = []
    const workStart = parseTime(this.preferences.workingHours.start)
    const workEnd = parseTime(this.preferences.workingHours.end)
    
    // Generate all possible slots throughout the day
    let currentTime = workStart.hours * 60 + workStart.minutes
    const endTime = workEnd.hours * 60 + workEnd.minutes
    
    while (currentTime + DEFAULT_POMODORO_CONFIG.duration <= endTime) {
      const slotStart = formatTime(
        Math.floor(currentTime / 60), 
        currentTime % 60
      )
      const slotEnd = calculateEndTime(slotStart, DEFAULT_POMODORO_CONFIG.duration)
      
      // Check if this slot conflicts with existing ones
      const proposedSlot = { date, startTime: slotStart, endTime: slotEnd }
      if (isTimeSlotAvailable(proposedSlot, existingOnDate)) {
        availableSlots.push({ startTime: slotStart, endTime: slotEnd })
      }
      
      // Move to next slot (pomodoro + break time)
      currentTime += DEFAULT_POMODORO_CONFIG.duration + DEFAULT_POMODORO_CONFIG.breakTime
    }

    return availableSlots
  }

  /**
   * Update preferences for scheduling
   */
  updatePreferences(newPreferences: Partial<SchedulePreferences>): void {
    this.preferences = { ...this.preferences, ...newPreferences }
  }

  // Private helper methods

  private getStartDateByPriority(priority: Priority): Date {
    const now = new Date()
    const config = getPriorityConfig(priority)
    
    switch (priority) {
      case Priority.URGENT_IMPORTANT:
        // Start immediately or next available slot
        return now
      case Priority.IMPORTANT_NOT_URGENT:
        // Start today or tomorrow if today is full
        return now
      case Priority.URGENT_NOT_IMPORTANT:
        // Start today but can be after important tasks
        return now
      case Priority.NOT_URGENT_NOT_IMPORTANT:
        // Can start later, within maxDelay days
        const laterDate = new Date()
        laterDate.setDate(now.getDate() + Math.min(config.maxDelay, 3))
        return laterDate
      default:
        return now
    }
  }

  private findNextAvailableSlot(todo: Todo, startDate: Date, slotIndex: number): PomodoroSlot | null {
    const maxDaysToSearch = 14 // Don't search more than 2 weeks ahead
    let currentDate = new Date(startDate)
    
    for (let day = 0; day < maxDaysToSearch; day++) {
      // Skip weekends if not in available days
      const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'lowercase' })
      if (!this.preferences.availableDays.includes(dayName)) {
        currentDate.setDate(currentDate.getDate() + 1)
        continue
      }

      const availableSlots = this.getAvailableSlots(currentDate)
      
      // Try to find a suitable slot for this day
      if (availableSlots.length > slotIndex) {
        const selectedSlot = availableSlots[slotIndex % availableSlots.length]
        
        return {
          id: crypto.randomUUID(),
          todoId: todo.id,
          date: new Date(currentDate),
          startTime: selectedSlot.startTime,
          endTime: selectedSlot.endTime,
          status: PomodoroSlotStatus.SCHEDULED
        }
      }

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1)
    }

    return null // Couldn't find a slot within the search window
  }

  private addBreakPeriods(scheduleItems: ScheduleItem[], date: Date): ScheduleItem[] {
    const itemsWithBreaks: ScheduleItem[] = [...scheduleItems]
    
    // Add breaks between consecutive pomodoros
    for (let i = 0; i < scheduleItems.length - 1; i++) {
      const current = scheduleItems[i]
      const next = scheduleItems[i + 1]
      
      const currentEnd = parseTime(calculateEndTime(current.time, DEFAULT_POMODORO_CONFIG.duration))
      const nextStart = parseTime(next.time)
      
      const currentEndMinutes = currentEnd.hours * 60 + currentEnd.minutes
      const nextStartMinutes = nextStart.hours * 60 + nextStart.minutes
      
      // If there's exactly a break period between them, add break item
      if (nextStartMinutes - currentEndMinutes === DEFAULT_POMODORO_CONFIG.breakTime) {
        const breakStart = formatTime(currentEnd.hours, currentEnd.minutes)
        
        itemsWithBreaks.push({
          id: crypto.randomUUID(),
          time: breakStart,
          task: {
            id: 'break',
            title: '短休息',
            projectId: undefined
          },
          status: PomodoroSlotStatus.SCHEDULED,
          type: 'break'
        })
      }
    }

    return itemsWithBreaks
  }
}

// Default scheduler instance
export const defaultScheduler = new SmartScheduler()

// Utility functions
export function createScheduler(preferences?: Partial<SchedulePreferences>): SmartScheduler {
  return new SmartScheduler(preferences)
}

export function estimateSchedulingDuration(todos: Todo[]): { 
  totalMinutes: number
  totalPomodoros: number
  estimatedDays: number
} {
  const totalPomodoros = todos.reduce((sum, todo) => sum + todo.totalPomodoros, 0)
  const totalMinutes = totalPomodoros * (DEFAULT_POMODORO_CONFIG.duration + DEFAULT_POMODORO_CONFIG.breakTime)
  
  // Estimate days based on default max pomodoros per day
  const estimatedDays = Math.ceil(totalPomodoros / DEFAULT_SCHEDULE_PREFERENCES.maxPomodorosPerDay)
  
  return {
    totalMinutes,
    totalPomodoros,
    estimatedDays
  }
}