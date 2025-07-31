/**
 * MVP Scheduling types for the Pomodoro-based time management system
 * This is a simplified version focused on core functionality
 */

export interface PomodoroSlot {
  id: string
  todoId: string
  date: Date
  startTime: string // Format: "HH:mm" (e.g., "09:00")
  endTime: string   // Format: "HH:mm" (e.g., "09:25")
  status: PomodoroSlotStatus
  actualStart?: Date
  actualEnd?: Date
}

export enum PomodoroSlotStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  MISSED = 'missed',
  CANCELLED = 'cancelled'
}

export interface PomodoroUnit {
  duration: number // Duration in minutes (default: 25)
  breakTime: number // Short break in minutes (default: 5)
  longBreakInterval: number // Number of pomodoros before long break (default: 4)
  longBreakDuration: number // Long break in minutes (default: 15)
}

export const DEFAULT_POMODORO_CONFIG: PomodoroUnit = {
  duration: 25,
  breakTime: 5,
  longBreakInterval: 4,
  longBreakDuration: 15
}

export interface SchedulePreferences {
  workingHours: {
    start: string // Format: "HH:mm"
    end: string   // Format: "HH:mm"
  }
  availableDays: string[] // ['monday', 'tuesday', ...]
  maxPomodorosPerDay: number
  preferredBatchSize: number // Preferred consecutive pomodoros (2-4)
  bufferTime: number // Minutes between different tasks
}

export const DEFAULT_SCHEDULE_PREFERENCES: SchedulePreferences = {
  workingHours: {
    start: '09:00',
    end: '18:00'
  },
  availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  maxPomodorosPerDay: 12,
  preferredBatchSize: 3,
  bufferTime: 15
}

export interface DaySchedule {
  date: Date
  slots: PomodoroSlot[]
  totalPomodoros: number
  completedPomodoros: number
  remainingPomodoros: number
}

export interface ScheduleItem {
  id: string
  time: string
  task: {
    id: string
    title: string
    projectId?: string
  }
  status: PomodoroSlotStatus
  type: 'pomodoro' | 'break' | 'buffer'
}

/**
 * Helper function to format time string
 */
export function formatTime(hours: number, minutes: number): string {
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
}

/**
 * Helper function to parse time string
 */
export function parseTime(timeString: string): { hours: number; minutes: number } {
  const [hours, minutes] = timeString.split(':').map(Number)
  return { hours, minutes }
}

/**
 * Calculate end time based on start time and duration
 */
export function calculateEndTime(startTime: string, durationMinutes: number): string {
  const { hours, minutes } = parseTime(startTime)
  const totalMinutes = hours * 60 + minutes + durationMinutes
  const endHours = Math.floor(totalMinutes / 60)
  const endMinutes = totalMinutes % 60
  return formatTime(endHours, endMinutes)
}

/**
 * Check if a time slot is available
 */
export function isTimeSlotAvailable(
  proposedSlot: { date: Date; startTime: string; endTime: string },
  existingSlots: PomodoroSlot[]
): boolean {
  return !existingSlots.some(slot => {
    if (slot.date.toDateString() !== proposedSlot.date.toDateString()) {
      return false
    }
    
    // Check for time overlap
    const proposedStart = parseTime(proposedSlot.startTime)
    const proposedEnd = parseTime(proposedSlot.endTime)
    const existingStart = parseTime(slot.startTime)
    const existingEnd = parseTime(slot.endTime)
    
    const proposedStartMinutes = proposedStart.hours * 60 + proposedStart.minutes
    const proposedEndMinutes = proposedEnd.hours * 60 + proposedEnd.minutes
    const existingStartMinutes = existingStart.hours * 60 + existingStart.minutes
    const existingEndMinutes = existingEnd.hours * 60 + existingEnd.minutes
    
    return (
      (proposedStartMinutes >= existingStartMinutes && proposedStartMinutes < existingEndMinutes) ||
      (proposedEndMinutes > existingStartMinutes && proposedEndMinutes <= existingEndMinutes) ||
      (proposedStartMinutes <= existingStartMinutes && proposedEndMinutes >= existingEndMinutes)
    )
  })
}