/**
 * Parse a date that could be a Date object or a string
 * @param date - The date to parse
 * @returns A Date object or undefined if parsing fails
 */
export function parseDate(date: Date | string | undefined): Date | undefined {
  if (!date) return undefined
  
  try {
    if (date instanceof Date) {
      return date
    }
    
    const parsed = new Date(date)
    return isNaN(parsed.getTime()) ? undefined : parsed
  } catch {
    return undefined
  }
}

/**
 * Ensure all date fields in todos are proper Date objects
 * @param todos - Array of todos to process
 * @returns Todos with parsed dates
 */
export function parseTodoDates<T extends { createdAt?: any; dueDate?: any }>(todos: T[]): T[] {
  return todos.map(todo => ({
    ...todo,
    createdAt: parseDate(todo.createdAt) || new Date(),
    dueDate: parseDate(todo.dueDate)
  }))
}