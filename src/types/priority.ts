/**
 * Eisenhower Matrix Priority System
 * Based on urgency and importance to help users focus on what matters most
 */

export enum Priority {
  URGENT_IMPORTANT = 'urgent_important',
  IMPORTANT_NOT_URGENT = 'important_not_urgent',
  URGENT_NOT_IMPORTANT = 'urgent_not_important',
  NOT_URGENT_NOT_IMPORTANT = 'not_urgent_not_important'
}

export interface PriorityConfig {
  label: string
  color: string
  order: number
  description: string
  actionHint: string
  autoSchedule: boolean
  maxDelay: number // Maximum days to delay scheduling
}

export const PriorityConfigs: Record<Priority, PriorityConfig> = {
  [Priority.URGENT_IMPORTANT]: {
    label: '重要且緊急',
    color: '#FF4757',
    order: 1,
    description: '立即執行',
    actionHint: '這些任務需要立即處理，不能延後',
    autoSchedule: true,
    maxDelay: 0
  },
  [Priority.IMPORTANT_NOT_URGENT]: {
    label: '重要但不緊急',
    color: '#FFA726',
    order: 2,
    description: '計劃執行',
    actionHint: '這些任務很重要，需要安排時間好好完成',
    autoSchedule: true,
    maxDelay: 7
  },
  [Priority.URGENT_NOT_IMPORTANT]: {
    label: '不重要但緊急',
    color: '#42A5F5',
    order: 3,
    description: '快速處理',
    actionHint: '可以委派或快速完成的任務',
    autoSchedule: true,
    maxDelay: 1
  },
  [Priority.NOT_URGENT_NOT_IMPORTANT]: {
    label: '不重要不緊急',
    color: '#66BB6A',
    order: 4,
    description: '考慮延後',
    actionHint: '這些任務可以延後或刪除',
    autoSchedule: false,
    maxDelay: 30
  }
}

/**
 * Get priority config by priority value
 */
export function getPriorityConfig(priority: Priority): PriorityConfig {
  return PriorityConfigs[priority]
}

/**
 * Sort priorities by importance (order)
 */
export function sortByPriority(priorities: Priority[]): Priority[] {
  return priorities.sort((a, b) => {
    return PriorityConfigs[a].order - PriorityConfigs[b].order
  })
}

/**
 * Convert old priority system to new Eisenhower Matrix
 */
export function convertOldPriority(oldPriority?: 'low' | 'medium' | 'high'): Priority {
  switch (oldPriority) {
    case 'high':
      return Priority.URGENT_IMPORTANT
    case 'medium':
      return Priority.IMPORTANT_NOT_URGENT
    case 'low':
      return Priority.NOT_URGENT_NOT_IMPORTANT
    default:
      return Priority.IMPORTANT_NOT_URGENT
  }
}

/**
 * Check if a task should be auto-scheduled based on its priority
 */
export function shouldAutoSchedule(priority: Priority): boolean {
  return PriorityConfigs[priority].autoSchedule
}

/**
 * Get the maximum delay days for a priority
 */
export function getMaxDelayDays(priority: Priority): number {
  return PriorityConfigs[priority].maxDelay
}