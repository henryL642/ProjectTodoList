import { Priority } from './priority'
import type { PomodoroSlot } from './mvp-scheduling'

export interface Todo {
  id: string
  text: string
  completed: boolean
  createdAt: Date
  updatedAt: Date
  userId: string // Required for user association
  projectId?: string // Associate todos with projects
  priority: Priority // New priority system using Eisenhower Matrix
  totalPomodoros: number // Total estimated pomodoros for the task
  completedPomodoros: number // Number of completed pomodoros
  scheduledSlots?: PomodoroSlot[] // Scheduled time slots for the task
  dueDate?: Date // Due date for the task
  deadline?: Date // Alias for dueDate for consistency with design docs
}

export type FilterType = 'all' | 'active' | 'completed'
