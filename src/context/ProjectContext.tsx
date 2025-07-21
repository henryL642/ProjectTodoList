import React, { createContext, useContext, useReducer, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Project, ProjectContextType, ProjectStats } from '../types/project'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { useUser } from './UserContext'

const ProjectContext = createContext<ProjectContextType | undefined>(undefined)

interface ProjectState {
  projects: Project[]
  currentProjectId: string | null
  isLoading: boolean
  error: string | null
}

interface ProjectAction {
  type: 'SET_PROJECTS' | 'ADD_PROJECT' | 'UPDATE_PROJECT' | 'DELETE_PROJECT' | 
        'SELECT_PROJECT' | 'SET_LOADING' | 'SET_ERROR' | 'ARCHIVE_PROJECT'
  payload?: any
}

const initialState: ProjectState = {
  projects: [],
  currentProjectId: null,
  isLoading: false,
  error: null,
}

function projectReducer(state: ProjectState, action: ProjectAction): ProjectState {
  switch (action.type) {
    case 'SET_PROJECTS':
      return { ...state, projects: action.payload }
    
    case 'ADD_PROJECT':
      return { ...state, projects: [...state.projects, action.payload] }
    
    case 'UPDATE_PROJECT':
      return {
        ...state,
        projects: state.projects.map(p => 
          p.id === action.payload.id ? { ...p, ...action.payload.updates } : p
        )
      }
    
    case 'DELETE_PROJECT':
      return {
        ...state,
        projects: state.projects.filter(p => p.id !== action.payload),
        currentProjectId: state.currentProjectId === action.payload ? null : state.currentProjectId
      }
    
    case 'ARCHIVE_PROJECT':
      return {
        ...state,
        projects: state.projects.map(p => 
          p.id === action.payload ? { ...p, isArchived: true } : p
        ),
        currentProjectId: state.currentProjectId === action.payload ? null : state.currentProjectId
      }
    
    case 'SELECT_PROJECT':
      return { ...state, currentProjectId: action.payload }
    
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    
    case 'SET_ERROR':
      return { ...state, error: action.payload }
    
    default:
      return state
  }
}

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useUser()
  const [state, dispatch] = useReducer(projectReducer, initialState)
  const [storedProjects, setStoredProjects] = useLocalStorage<Project[]>('projects', [])
  const [storedCurrentProjectId, setStoredCurrentProjectId] = useLocalStorage<string | null>('currentProjectId', null)
  const [, forceUpdate] = useState({})

  // Use a ref to track the last synced project IDs to prevent loops
  const lastSyncedProjectIds = useRef<string>('')

  // Listen for todo updates to refresh project stats
  useEffect(() => {
    const handleTodosUpdated = (event: any) => {
      if (event.detail?.key === 'todos') {
        // Force re-render to update project stats
        forceUpdate({})
      }
    }
    
    window.addEventListener('localStorageUpdated', handleTodosUpdated)
    
    return () => {
      window.removeEventListener('localStorageUpdated', handleTodosUpdated)
    }
  }, [])

  // Sync projects from localStorage when they change
  useEffect(() => {
    if (user) {
      const userProjects = storedProjects.filter(p => p.userId === user.id)
      const newProjectIds = JSON.stringify(userProjects.map(p => p.id).sort())
      
      // Only update if project IDs actually changed
      if (lastSyncedProjectIds.current !== newProjectIds) {
        lastSyncedProjectIds.current = newProjectIds
        dispatch({ type: 'SET_PROJECTS', payload: userProjects })
      }
    } else {
      const emptyIds = JSON.stringify([])
      if (lastSyncedProjectIds.current !== emptyIds) {
        lastSyncedProjectIds.current = emptyIds
        dispatch({ type: 'SET_PROJECTS', payload: [] })
      }
    }
  }, [user, storedProjects])

  // Sync current project from localStorage
  useEffect(() => {
    if (user && storedCurrentProjectId !== state.currentProjectId) {
      const userProjects = storedProjects.filter(p => p.userId === user.id)
      if (storedCurrentProjectId && userProjects.some(p => p.id === storedCurrentProjectId)) {
        dispatch({ type: 'SELECT_PROJECT', payload: storedCurrentProjectId })
      } else {
        dispatch({ type: 'SELECT_PROJECT', payload: null })
      }
    }
  }, [user, storedCurrentProjectId, storedProjects, state.currentProjectId])

  // Get current project
  const currentProject = useMemo(() => {
    return state.projects.find(p => p.id === state.currentProjectId) || null
  }, [state.projects, state.currentProjectId])

  // Get visible projects (not archived)
  const visibleProjects = useMemo(() => {
    return state.projects.filter(p => !p.isArchived)
  }, [state.projects])

  // Create project
  const createProject = useCallback(async (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> => {
    if (!user) throw new Error('User must be logged in to create projects')

    const newProject: Project = {
      ...projectData,
      id: crypto.randomUUID(),
      userId: user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
      todoCount: 0,
      completedCount: 0,
    }

    // First update localStorage, which will trigger the sync useEffect
    const updatedProjects = [...storedProjects, newProject]
    setStoredProjects(updatedProjects)

    return newProject
  }, [user, storedProjects, setStoredProjects])

  // Update project
  const updateProject = useCallback(async (id: string, updates: Partial<Project>): Promise<boolean> => {
    if (!user) return false

    const projectToUpdate = storedProjects.find(p => p.id === id && p.userId === user.id)
    if (!projectToUpdate) return false

    const updatedProject = {
      ...projectToUpdate,
      ...updates,
      updatedAt: new Date(),
    }

    const updatedProjects = storedProjects.map(p => 
      p.id === id ? updatedProject : p
    )
    
    setStoredProjects(updatedProjects)
    return true
  }, [user, storedProjects, setStoredProjects])

  // Delete project
  const deleteProject = useCallback(async (id: string): Promise<boolean> => {
    if (!user) return false

    const projectToDelete = storedProjects.find(p => p.id === id && p.userId === user.id)
    if (!projectToDelete) return false

    const updatedProjects = storedProjects.filter(p => p.id !== id)
    setStoredProjects(updatedProjects)

    // Clear current project if it was deleted
    if (storedCurrentProjectId === id) {
      setStoredCurrentProjectId(null)
    }

    return true
  }, [user, storedProjects, setStoredProjects, storedCurrentProjectId, setStoredCurrentProjectId])

  // Archive project
  const archiveProject = useCallback(async (id: string): Promise<boolean> => {
    return updateProject(id, { isArchived: true })
  }, [updateProject])

  // Select project
  const selectProject = useCallback((id: string | null) => {
    dispatch({ type: 'SELECT_PROJECT', payload: id })
    setStoredCurrentProjectId(id)
  }, [setStoredCurrentProjectId])

  // Get project stats - dynamically calculated from todos
  const getProjectStats = useCallback((id: string): ProjectStats | null => {
    const project = state.projects.find(p => p.id === id)
    if (!project) return null

    // Get todos from localStorage directly to get real-time stats
    let projectTodos: any[] = []
    try {
      const todosFromStorage = localStorage.getItem('todos')
      const allTodos = todosFromStorage ? JSON.parse(todosFromStorage) : []
      projectTodos = allTodos.filter((todo: any) => 
        todo.userId === user?.id && todo.projectId === id
      )
    } catch (error) {
      console.warn('Error reading todos for project stats:', error)
    }

    const totalTodos = projectTodos.length
    const completedTodos = projectTodos.filter(todo => todo.completed).length
    const activeTodos = totalTodos - completedTodos

    return {
      projectId: id,
      totalTodos,
      completedTodos,
      activeTodos,
      completionRate: totalTodos > 0 ? (completedTodos / totalTodos) * 100 : 0,
      lastActivity: project.updatedAt,
    }
  }, [state.projects, user?.id])

  // Get all projects stats
  const getAllProjectsStats = useCallback((): ProjectStats[] => {
    return visibleProjects.map(p => getProjectStats(p.id)).filter(Boolean) as ProjectStats[]
  }, [visibleProjects, getProjectStats])

  const value: ProjectContextType = {
    projects: visibleProjects,
    currentProject,
    isLoading: state.isLoading,
    error: state.error,
    createProject,
    updateProject,
    deleteProject,
    archiveProject,
    selectProject,
    getProjectStats,
    getAllProjectsStats,
  }

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
}

export const useProjects = (): ProjectContextType => {
  const context = useContext(ProjectContext)
  if (context === undefined) {
    throw new Error('useProjects must be used within a ProjectProvider')
  }
  return context
}