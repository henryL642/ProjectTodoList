/**
 * Enhanced useTodos hook with integrated scheduling functionality
 * Part of MVP Implementation Guide Day 3-4
 */

import { useCallback } from 'react'
import { useTodos } from './useTodos'
import { useScheduling, useAutoSchedule } from '../context/SchedulingContext'
import { Priority, shouldAutoSchedule } from '../types/priority'
import type { Todo } from '../types/todo'

export interface TodoWithSchedulingOptions {
  text: string
  projectId?: string
  priority?: Priority | 'low' | 'medium' | 'high'
  dueDate?: string
  totalPomodoros?: number
  autoSchedule?: boolean // Override default auto-scheduling behavior
}

export const useTodosWithScheduling = () => {
  const todosHook = useTodos()
  const { scheduleTodo } = useScheduling()
  const { autoScheduleTodo } = useAutoSchedule()

  /**
   * Enhanced addTodo that includes automatic scheduling
   */
  const addTodoWithScheduling = useCallback(async (options: TodoWithSchedulingOptions) => {
    const {
      text,
      projectId,
      priority,
      dueDate,
      totalPomodoros = 1,
      autoSchedule
    } = options

    // Create the todo first using the original hook
    todosHook.addTodo(text, projectId, priority, dueDate, totalPomodoros)

    // Get the created todo (it should be the last one added)
    // We need to wait a bit for the state to update
    return new Promise<{ todo: Todo | null; schedulingResult: any }>((resolve) => {
      setTimeout(async () => {
        // Find the most recently created todo with this text
        const todos = todosHook.todos || []
        const createdTodo = [...todos]
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          .find(todo => todo.text === text && !todo.completed)

        if (!createdTodo) {
          resolve({ todo: null, schedulingResult: null })
          return
        }

        // Determine if we should auto-schedule
        const shouldSchedule = autoSchedule !== undefined 
          ? autoSchedule 
          : shouldAutoSchedule(createdTodo.priority)

        if (shouldSchedule && createdTodo.totalPomodoros > 0) {
          try {
            const schedulingResult = await autoScheduleTodo(createdTodo)
            resolve({ todo: createdTodo, schedulingResult })
          } catch (error) {
            console.error('Failed to auto-schedule todo:', error)
            resolve({ todo: createdTodo, schedulingResult: null })
          }
        } else {
          resolve({ todo: createdTodo, schedulingResult: null })
        }
      }, 100) // Small delay to allow state update
    })
  }, [todosHook, autoScheduleTodo])

  /**
   * Manually schedule an existing todo
   */
  const scheduleExistingTodo = useCallback(async (todoId: string) => {
    const todo = (todosHook.todos || []).find(t => t.id === todoId)
    if (!todo) {
      throw new Error('Todo not found')
    }

    const result = await scheduleTodo(todo)
    
    if (result.success) {
      // Update the todo with scheduled slots information
      const updatedScheduledSlots = result.scheduledSlots.map(slot => ({
        id: slot.id,
        todoId: slot.todoId,
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        status: slot.status
      }))

      todosHook.editTodo(todoId, {
        scheduledSlots: updatedScheduledSlots
      })
    }

    return result
  }, [todosHook, scheduleTodo])

  /**
   * Remove scheduling for a todo
   */
  const unscheduleTodo = useCallback(async (todoId: string) => {
    // This would remove all scheduled slots for the todo
    // For now, we'll just clear the scheduledSlots array
    todosHook.editTodo(todoId, {
      scheduledSlots: []
    })
  }, [todosHook])

  /**
   * Get todos with their scheduling status
   */
  const todosWithSchedulingStatus = (todosHook.todos || []).map(todo => {
    const hasScheduledSlots = todo.scheduledSlots && todo.scheduledSlots.length > 0
    const isAutoSchedulable = shouldAutoSchedule(todo.priority)
    
    return {
      ...todo,
      isScheduled: hasScheduledSlots,
      canAutoSchedule: isAutoSchedulable,
      schedulingProgress: hasScheduledSlots 
        ? `${todo.scheduledSlots!.length}/${todo.totalPomodoros} 個番茄鐘已排程`
        : undefined
    }
  })

  return {
    // Original useTodos functionality
    ...todosHook,
    
    // Enhanced functionality
    addTodoWithScheduling,
    scheduleExistingTodo,
    unscheduleTodo,
    todosWithSchedulingStatus,
    
    // Convenience methods
    addScheduledTodo: addTodoWithScheduling, // Alias for clarity
  }
}

// Export individual hooks for specific use cases
export { useTodos, useAutoSchedule }