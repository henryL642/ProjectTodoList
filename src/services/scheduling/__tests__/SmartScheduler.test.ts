/**
 * SmartScheduler Tests
 * Part of MVP Implementation Guide Day 3-4
 */

import { SmartScheduler } from '../SmartScheduler'
import type { Todo } from '../../../types/todo'
import { Priority } from '../../../types/priority'
import { PomodoroSlotStatus } from '../../../types/mvp-scheduling'

// Mock crypto.randomUUID for testing
const mockUUID = jest.fn(() => 'test-uuid-' + Math.random().toString(36).substr(2, 9))
Object.defineProperty(global, 'crypto', {
  value: { randomUUID: mockUUID },
  writable: true
})

describe('SmartScheduler', () => {
  let scheduler: SmartScheduler
  
  beforeEach(() => {
    scheduler = new SmartScheduler()
    mockUUID.mockClear()
  })

  describe('scheduleTodo', () => {
    it('should schedule urgent tasks first', () => {
      const urgentTodo: Todo = {
        id: 'urgent-todo',
        text: '緊急任務',
        completed: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: 'user1',
        priority: Priority.URGENT_IMPORTANT,
        totalPomodoros: 2,
        completedPomodoros: 0
      }

      const result = scheduler.scheduleTodo(urgentTodo)
      
      expect(result.success).toBe(true)
      expect(result.scheduledSlots).toHaveLength(2)
      expect(result.message).toContain('成功安排 2 個番茄鐘')
    })

    it('should not auto-schedule low priority tasks', () => {
      const lowPriorityTodo: Todo = {
        id: 'low-todo',
        text: '低優先級任務',
        completed: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: 'user1',
        priority: Priority.NOT_URGENT_NOT_IMPORTANT,
        totalPomodoros: 1,
        completedPomodoros: 0
      }

      const result = scheduler.scheduleTodo(lowPriorityTodo)
      
      expect(result.success).toBe(false)
      expect(result.scheduledSlots).toHaveLength(0)
      expect(result.message).toContain('不建議自動排程')
    })

    it('should create slots with correct duration', () => {
      const todo: Todo = {
        id: 'test-todo',
        text: '測試任務',
        completed: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: 'user1',
        priority: Priority.IMPORTANT_NOT_URGENT,
        totalPomodoros: 1,
        completedPomodoros: 0
      }

      const result = scheduler.scheduleTodo(todo)
      
      expect(result.success).toBe(true)
      expect(result.scheduledSlots).toHaveLength(1)
      
      const slot = result.scheduledSlots[0]
      expect(slot.todoId).toBe('test-todo')
      expect(slot.status).toBe(PomodoroSlotStatus.SCHEDULED)
      expect(slot.startTime).toMatch(/^\d{2}:\d{2}$/)
      expect(slot.endTime).toMatch(/^\d{2}:\d{2}$/)
    })
  })

  describe('scheduleTodos', () => {
    it('should schedule urgent tasks before important ones', () => {
      const todos: Todo[] = [
        {
          id: 'important-todo',
          text: '重要任務',
          completed: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: 'user1',
          priority: Priority.IMPORTANT_NOT_URGENT,
          totalPomodoros: 2,
          completedPomodoros: 0
        },
        {
          id: 'urgent-todo',
          text: '緊急任務',
          completed: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: 'user1',
          priority: Priority.URGENT_IMPORTANT,
          totalPomodoros: 1,
          completedPomodoros: 0
        }
      ]

      const result = scheduler.scheduleTodos(todos)
      
      expect(result.success).toBe(true)
      expect(result.scheduledSlots).toHaveLength(3) // 1 urgent + 2 important
      
      // First slot should be from urgent task
      const firstSlot = result.scheduledSlots[0]
      expect(firstSlot.todoId).toBe('urgent-todo')
    })

    it('should handle mixed priority todos correctly', () => {
      const todos: Todo[] = [
        {
          id: 'low-todo',
          text: '低優先級',
          completed: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: 'user1',
          priority: Priority.NOT_URGENT_NOT_IMPORTANT,
          totalPomodoros: 1,
          completedPomodoros: 0
        },
        {
          id: 'high-todo',
          text: '高優先級',
          completed: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: 'user1',
          priority: Priority.URGENT_IMPORTANT,
          totalPomodoros: 1,
          completedPomodoros: 0
        }
      ]

      const result = scheduler.scheduleTodos(todos)
      
      // Should only schedule the high priority one
      expect(result.scheduledSlots).toHaveLength(1)
      expect(result.scheduledSlots[0].todoId).toBe('high-todo')
      expect(result.conflicts).toContain('低優先級: 此優先級的任務不建議自動排程')
    })
  })

  describe('getDaySchedule', () => {
    it('should return empty schedule for day with no slots', () => {
      const today = new Date()
      const schedule = scheduler.getDaySchedule(today)
      
      expect(schedule).toHaveLength(0)
    })

    it('should return sorted schedule items', () => {
      // Add some test slots
      const today = new Date()
      const slots = [
        {
          id: 'slot1',
          todoId: 'todo1',
          date: today,
          startTime: '10:00',
          endTime: '10:25',
          status: PomodoroSlotStatus.SCHEDULED
        },
        {
          id: 'slot2',
          todoId: 'todo2',
          date: today,
          startTime: '09:00',
          endTime: '09:25',
          status: PomodoroSlotStatus.SCHEDULED
        }
      ]
      
      scheduler.setExistingSlots(slots)
      const schedule = scheduler.getDaySchedule(today)
      
      expect(schedule).toHaveLength(2)
      // Should be sorted by time
      expect(schedule[0].time).toBe('09:00')
      expect(schedule[1].time).toBe('10:00')
    })
  })

  describe('getAvailableSlots', () => {
    it('should return available slots within working hours', () => {
      const today = new Date()
      const availableSlots = scheduler.getAvailableSlots(today)
      
      expect(availableSlots.length).toBeGreaterThan(0)
      
      // Check that slots are within working hours (9-18 by default)
      const firstSlot = availableSlots[0]
      expect(firstSlot.startTime >= '09:00').toBe(true)
      expect(firstSlot.endTime <= '18:00').toBe(true)
    })

    it('should exclude conflicting time slots', () => {
      const today = new Date()
      const existingSlot = {
        id: 'existing',
        todoId: 'todo1',
        date: today,
        startTime: '09:00',
        endTime: '09:25',
        status: PomodoroSlotStatus.SCHEDULED
      }
      
      scheduler.setExistingSlots([existingSlot])
      const availableSlots = scheduler.getAvailableSlots(today)
      
      // Should not include the 9:00-9:25 slot
      const conflictingSlot = availableSlots.find(slot => 
        slot.startTime === '09:00' && slot.endTime === '09:25'
      )
      expect(conflictingSlot).toBeUndefined()
    })
  })

  describe('preferences integration', () => {
    it('should respect custom working hours', () => {
      const customScheduler = new SmartScheduler({
        workingHours: {
          start: '10:00',
          end: '16:00'
        },
        availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        maxPomodorosPerDay: 8,
        preferredBatchSize: 2,
        bufferTime: 10
      })

      const today = new Date()
      const availableSlots = customScheduler.getAvailableSlots(today)
      
      if (availableSlots.length > 0) {
        const firstSlot = availableSlots[0]
        const lastSlot = availableSlots[availableSlots.length - 1]
        
        expect(firstSlot.startTime >= '10:00').toBe(true)
        expect(lastSlot.endTime <= '16:00').toBe(true)
      }
    })
  })
})

// Helper function tests
describe('SmartScheduler utility functions', () => {
  it('should estimate scheduling duration correctly', () => {
    const { estimateSchedulingDuration } = require('../SmartScheduler')
    
    const todos: Todo[] = [
      {
        id: 'todo1',
        text: 'Task 1',
        completed: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: 'user1',
        priority: Priority.IMPORTANT_NOT_URGENT,
        totalPomodoros: 2,
        completedPomodoros: 0
      },
      {
        id: 'todo2',
        text: 'Task 2',
        completed: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: 'user1',
        priority: Priority.URGENT_IMPORTANT,
        totalPomodoros: 3,
        completedPomodoros: 0
      }
    ]

    const estimate = estimateSchedulingDuration(todos)
    
    expect(estimate.totalPomodoros).toBe(5)
    expect(estimate.totalMinutes).toBe(5 * 30) // 25 min + 5 min break
    expect(estimate.estimatedDays).toBe(1) // 5 pomodoros should fit in 1 day (default max 12/day)
  })
})