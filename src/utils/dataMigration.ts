/**
 * Data Migration Utilities for MVP Implementation
 * Handles migration from old todo format to new Pomodoro-based system
 */

import type { Todo } from '../types/todo'
import { Priority, convertOldPriority } from '../types/priority'

/**
 * Old Todo interface for migration purposes
 */
interface OldTodo {
  id: string
  text: string
  completed: boolean
  createdAt: Date | string
  userId: string
  projectId?: string
  priority?: 'low' | 'medium' | 'high'
  dueDate?: Date | string
  deadline?: Date | string
  updatedAt?: Date | string
  totalPomodoros?: number
  completedPomodoros?: number
  scheduledSlots?: any[]
}

/**
 * Migration configuration
 */
export interface MigrationConfig {
  // Default pomodoro estimate for existing tasks
  defaultPomodoros: number
  // Whether to preserve existing deadline/dueDate fields
  preserveDates: boolean
  // Whether to log migration details
  verbose: boolean
}

export const DEFAULT_MIGRATION_CONFIG: MigrationConfig = {
  defaultPomodoros: 1,
  preserveDates: true,
  verbose: false
}

/**
 * Check if a todo needs migration to the new format
 */
export function needsMigration(todo: any): boolean {
  // Check if it's using old priority format
  if (todo.priority && typeof todo.priority === 'string' && 
      ['low', 'medium', 'high'].includes(todo.priority)) {
    return true
  }
  
  // Check if it's missing new required fields
  if (!todo.hasOwnProperty('totalPomodoros') || 
      !todo.hasOwnProperty('completedPomodoros') ||
      !todo.hasOwnProperty('updatedAt')) {
    return true
  }
  
  // Check if dates need to be converted from strings
  if (typeof todo.createdAt === 'string' || 
      (todo.dueDate && typeof todo.dueDate === 'string') ||
      (todo.deadline && typeof todo.deadline === 'string') ||
      (todo.updatedAt && typeof todo.updatedAt === 'string')) {
    return true
  }
  
  return false
}

/**
 * Migrate a single todo to the new format
 */
export function migrateTodo(oldTodo: OldTodo, config: MigrationConfig = DEFAULT_MIGRATION_CONFIG): Todo {
  if (config.verbose) {
    console.log('Migrating todo:', oldTodo.id, oldTodo.text)
  }
  
  // Convert priority to new system
  const newPriority = oldTodo.priority && ['low', 'medium', 'high'].includes(oldTodo.priority)
    ? convertOldPriority(oldTodo.priority as 'low' | 'medium' | 'high')
    : Priority.IMPORTANT_NOT_URGENT
  
  // Convert date strings to Date objects
  const createdAt = typeof oldTodo.createdAt === 'string' 
    ? new Date(oldTodo.createdAt) 
    : oldTodo.createdAt
  
  const updatedAt = oldTodo.updatedAt 
    ? (typeof oldTodo.updatedAt === 'string' ? new Date(oldTodo.updatedAt) : oldTodo.updatedAt)
    : createdAt
  
  const dueDate = oldTodo.dueDate 
    ? (typeof oldTodo.dueDate === 'string' ? new Date(oldTodo.dueDate) : oldTodo.dueDate)
    : undefined
    
  const deadline = oldTodo.deadline 
    ? (typeof oldTodo.deadline === 'string' ? new Date(oldTodo.deadline) : oldTodo.deadline)
    : dueDate
  
  // Create the migrated todo
  const migratedTodo: Todo = {
    id: oldTodo.id,
    text: oldTodo.text,
    completed: oldTodo.completed,
    createdAt,
    updatedAt,
    userId: oldTodo.userId,
    projectId: oldTodo.projectId,
    priority: newPriority,
    totalPomodoros: oldTodo.totalPomodoros ?? config.defaultPomodoros,
    completedPomodoros: oldTodo.completedPomodoros ?? 0,
    scheduledSlots: oldTodo.scheduledSlots ?? undefined
  }
  
  // Add dates if preserving them
  if (config.preserveDates) {
    if (dueDate) migratedTodo.dueDate = dueDate
    if (deadline) migratedTodo.deadline = deadline
  }
  
  return migratedTodo
}

/**
 * Migrate an array of todos
 */
export function migrateTodos(todos: OldTodo[], config: MigrationConfig = DEFAULT_MIGRATION_CONFIG): Todo[] {
  const migrated: Todo[] = []
  const skipped: OldTodo[] = []
  
  for (const todo of todos) {
    try {
      if (needsMigration(todo)) {
        migrated.push(migrateTodo(todo, config))
      } else {
        // Already in correct format, just cast it
        migrated.push(todo as Todo)
      }
    } catch (error) {
      console.error('Failed to migrate todo:', todo.id, error)
      skipped.push(todo)
    }
  }
  
  if (config.verbose) {
    console.log(`Migration complete: ${migrated.length} migrated, ${skipped.length} skipped`)
  }
  
  return migrated
}

/**
 * Migrate todos stored in localStorage
 */
export function migrateLocalStorageTodos(config: MigrationConfig = DEFAULT_MIGRATION_CONFIG): boolean {
  try {
    const stored = localStorage.getItem('todos')
    if (!stored) {
      if (config.verbose) console.log('No todos found in localStorage')
      return true
    }
    
    const todos = JSON.parse(stored)
    if (!Array.isArray(todos)) {
      console.error('Invalid todos format in localStorage')
      return false
    }
    
    // Check if any todos need migration
    const todosNeedingMigration = todos.filter(needsMigration)
    if (todosNeedingMigration.length === 0) {
      if (config.verbose) console.log('No todos need migration')
      return true
    }
    
    if (config.verbose) {
      console.log(`Found ${todosNeedingMigration.length} todos needing migration`)
    }
    
    // Perform migration
    const migratedTodos = migrateTodos(todos, config)
    
    // Save back to localStorage
    localStorage.setItem('todos', JSON.stringify(migratedTodos))
    
    // Trigger storage event for components to update
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'todos',
      newValue: JSON.stringify(migratedTodos),
      oldValue: stored
    }))
    
    if (config.verbose) {
      console.log('Migration saved to localStorage')
    }
    
    return true
  } catch (error) {
    console.error('Failed to migrate localStorage todos:', error)
    return false
  }
}

/**
 * Get migration status for todos in localStorage
 */
export function getMigrationStatus(): {
  totalTodos: number
  needsMigration: number
  alreadyMigrated: number
  hasLocalStorage: boolean
} {
  try {
    const stored = localStorage.getItem('todos')
    if (!stored) {
      return {
        totalTodos: 0,
        needsMigration: 0,
        alreadyMigrated: 0,
        hasLocalStorage: false
      }
    }
    
    const todos = JSON.parse(stored)
    if (!Array.isArray(todos)) {
      return {
        totalTodos: 0,
        needsMigration: 0,
        alreadyMigrated: 0,
        hasLocalStorage: true
      }
    }
    
    const needsMigrationCount = todos.filter(needsMigration).length
    
    return {
      totalTodos: todos.length,
      needsMigration: needsMigrationCount,
      alreadyMigrated: todos.length - needsMigrationCount,
      hasLocalStorage: true
    }
  } catch (error) {
    console.error('Failed to get migration status:', error)
    return {
      totalTodos: 0,
      needsMigration: 0,
      alreadyMigrated: 0,
      hasLocalStorage: true
    }
  }
}

/**
 * Auto-migrate todos when the app starts
 * This should be called during app initialization
 */
export function autoMigrate(config: Partial<MigrationConfig> = {}): void {
  const finalConfig = { ...DEFAULT_MIGRATION_CONFIG, ...config }
  
  // Check if migration is needed
  const status = getMigrationStatus()
  
  if (status.needsMigration > 0) {
    console.log(`Auto-migrating ${status.needsMigration} todos to new format...`)
    
    const success = migrateLocalStorageTodos({
      ...finalConfig,
      verbose: true // Always log during auto-migration
    })
    
    if (success) {
      console.log('✅ Auto-migration completed successfully')
    } else {
      console.error('❌ Auto-migration failed')
    }
  } else if (finalConfig.verbose) {
    console.log('✅ No migration needed, all todos are up to date')
  }
}