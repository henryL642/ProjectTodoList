export interface Todo {
  id: string
  text: string
  completed: boolean
  createdAt: Date
  userId?: string // Associate todos with users
  projectId?: string // Associate todos with projects
  priority?: 'low' | 'medium' | 'high' // Task priority
  dueDate?: Date // Due date for the task
}

export type FilterType = 'all' | 'active' | 'completed'
