import { useState, useCallback, useMemo, useEffect } from 'react'
import type { Todo, FilterType } from '../types/todo'
import { useLocalStorage } from './useLocalStorage'
import { useUser } from '../context/UserContext'
import { useProjects } from '../context/ProjectContext'
import { parseTodoDates } from '../utils/dateHelpers'

export const useTodos = () => {
  const { user } = useUser()
  const { currentProject, updateProject } = useProjects()
  const [allTodos, setAllTodos] = useLocalStorage<Todo[]>('todos', [])
  const [filter, setFilter] = useState<FilterType>('all')

  // Filter todos by current user and project
  const userTodos = useMemo(() => {
    if (!user) return []
    
    // Parse dates when loading from localStorage
    const todosWithDates = parseTodoDates(allTodos)
    
    let todos = todosWithDates.filter(todo => todo.userId === user.id)
    
    // If a project is selected, filter by project
    if (currentProject) {
      todos = todos.filter(todo => todo.projectId === currentProject.id)
    }
    
    return todos
  }, [allTodos, user, currentProject])

  // TODO: Re-implement project stats update without causing infinite loops
  // For now, commenting out to fix the infinite loop issue
  /*
  // Update project stats when todos change - using useMemo to prevent infinite loops
  const projectStats = useMemo(() => {
    if (!currentProject || !user) return null

    const projectTodos = allTodos.filter(
      todo => todo.userId === user.id && todo.projectId === currentProject.id
    )
    
    return {
      todoCount: projectTodos.length,
      completedCount: projectTodos.filter(todo => todo.completed).length
    }
  }, [allTodos, currentProject?.id, user?.id])

  // Only update project stats when they actually change
  useEffect(() => {
    if (!currentProject || !projectStats) return

    // Prevent infinite loops by checking if stats actually changed
    if (currentProject.todoCount !== projectStats.todoCount || 
        currentProject.completedCount !== projectStats.completedCount) {
      
      // Debounce the update to prevent rapid successive calls
      const timeoutId = setTimeout(() => {
        updateProject(currentProject.id, { 
          todoCount: projectStats.todoCount, 
          completedCount: projectStats.completedCount 
        })
      }, 100)
      
      return () => clearTimeout(timeoutId)
    }
  }, [projectStats?.todoCount, projectStats?.completedCount, currentProject?.todoCount, currentProject?.completedCount, currentProject?.id, updateProject])
  */

  const addTodo = useCallback((text: string, projectId?: string, priority?: 'low' | 'medium' | 'high', dueDate?: string) => {
    if (!user) {
      console.warn('addTodo: No user logged in')
      return
    }
    
    const trimmedText = text.trim()
    if (!trimmedText) {
      console.warn('addTodo: Empty text provided')
      return
    }
    
    const finalProjectId = projectId || currentProject?.id
    const newTodo: Todo = {
      id: crypto.randomUUID(),
      text: trimmedText,
      completed: false,
      createdAt: new Date(),
      userId: user.id,
      projectId: finalProjectId,
      priority: priority || 'medium',
      dueDate: dueDate ? new Date(dueDate) : undefined
    }
    
    setAllTodos(prev => [...prev, newTodo])
  }, [setAllTodos, user, currentProject])

  const toggleTodo = useCallback((id: string) => {
    if (!user) return
    
    setAllTodos(prev =>
      prev.map(todo =>
        todo.id === id && todo.userId === user.id ? { ...todo, completed: !todo.completed } : todo
      )
    )
  }, [setAllTodos, user])

  const deleteTodo = useCallback((id: string) => {
    if (!user) return
    
    setAllTodos(prev => prev.filter(todo => !(todo.id === id && todo.userId === user.id)))
  }, [setAllTodos, user])

  const editTodo = useCallback((id: string, updates: Partial<Todo>) => {
    if (!user) return
    
    // If text is being updated, make sure it's not empty
    if ('text' in updates && !updates.text?.trim()) return
    
    setAllTodos(prev =>
      prev.map(todo =>
        todo.id === id && todo.userId === user.id ? { ...todo, ...updates } : todo
      )
    )
  }, [setAllTodos, user])

  const clearCompleted = useCallback(() => {
    if (!user) return
    
    setAllTodos(prev => prev.filter(todo => !(todo.completed && todo.userId === user.id)))
  }, [setAllTodos, user])

  const toggleAllTodos = useCallback(() => {
    if (!user) return
    
    const allCompleted = userTodos.every(todo => todo.completed)
    setAllTodos(prev => prev.map(todo => {
      // Only toggle todos that match current filter (user and project)
      const shouldToggle = todo.userId === user.id && 
        (!currentProject || todo.projectId === currentProject.id)
      
      return shouldToggle ? { ...todo, completed: !allCompleted } : todo
    }))
  }, [userTodos, setAllTodos, user, currentProject])

  const filteredTodos = userTodos.filter(todo => {
    switch (filter) {
      case 'active':
        return !todo.completed
      case 'completed':
        return todo.completed
      default:
        return true
    }
  })

  const activeCount = userTodos.filter(todo => !todo.completed).length
  const completedCount = userTodos.filter(todo => todo.completed).length

  return {
    todos: filteredTodos,
    filter,
    activeCount,
    completedCount,
    addTodo,
    toggleTodo,
    deleteTodo,
    editTodo,
    clearCompleted,
    toggleAllTodos,
    setFilter,
  }
}
