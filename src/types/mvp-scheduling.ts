/**
 * MVP Scheduling types - Clean version
 */

export interface PomodoroSlot {
  id: string
  todoId: string
  date: Date
  startTime: string
  endTime: string
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

export interface PomodoroUnit {
  duration: number
  breakTime: number
  longBreakInterval: number
  longBreakDuration: number
}

export const DEFAULT_POMODORO_CONFIG: PomodoroUnit = {
  duration: 25,
  breakTime: 5,
  longBreakInterval: 4,
  longBreakDuration: 15
}

export interface SchedulePreferences {
  workingHours: {
    start: string
    end: string
  }
  availableDays: string[]
  maxPomodorosPerDay: number
  preferredBatchSize: number
  bufferTime: number
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

export function formatTime(hours: number, minutes: number): string {
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
}

export function parseTime(timeString: string): { hours: number; minutes: number } {
  const [hours, minutes] = timeString.split(':').map(Number)
  return { hours, minutes }
}

export function calculateEndTime(startTime: string, durationMinutes: number): string {
  const { hours, minutes } = parseTime(startTime)
  const totalMinutes = hours * 60 + minutes + durationMinutes
  const endHours = Math.floor(totalMinutes / 60)
  const endMinutes = totalMinutes % 60
  return formatTime(endHours, endMinutes)
}

export function isTimeSlotAvailable(
  proposedSlot: { date: Date; startTime: string; endTime: string },
  existingSlots: PomodoroSlot[]
): boolean {
  return !existingSlots.some(slot => {
    if (slot.date.toDateString() !== proposedSlot.date.toDateString()) {
      return false
    }
    
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