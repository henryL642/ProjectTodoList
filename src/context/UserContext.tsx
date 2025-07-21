import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react'
import type { User, UserContextType, AuthState, LoginCredentials, RegisterCredentials } from '../types/user'
import { useLocalStorage } from '../hooks/useLocalStorage'

const UserContext = createContext<UserContextType | undefined>(undefined)

interface AuthAction {
  type: 'LOGIN_START' | 'LOGIN_SUCCESS' | 'LOGIN_FAILURE' | 'LOGOUT' | 'CLEAR_ERROR' | 'UPDATE_PROFILE'
  payload?: any
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
}

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      }
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      }
    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      }
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      }
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      }
    case 'UPDATE_PROFILE':
      return {
        ...state,
        user: action.payload,
      }
    default:
      return state
  }
}

// Mock user database (in real app, this would be API calls)
const mockUsers: (User & { password: string })[] = [
  {
    id: '1',
    username: 'demo',
    email: 'demo@example.com',
    password: 'demo123',
    createdAt: new Date('2024-01-01'),
    lastLoginAt: new Date(),
  }
]

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState)
  const [storedUser, setStoredUser] = useLocalStorage<User | null>('currentUser', null)

  // Restore user session on mount
  useEffect(() => {
    if (storedUser) {
      dispatch({ type: 'LOGIN_SUCCESS', payload: storedUser })
    }
  }, [storedUser])

  const login = useCallback(async (credentials: LoginCredentials): Promise<boolean> => {
    dispatch({ type: 'LOGIN_START' })
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Mock authentication
    const user = mockUsers.find(
      u => u.email === credentials.email && u.password === credentials.password
    )
    
    if (user) {
      const authUser: User = {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        createdAt: user.createdAt,
        lastLoginAt: new Date(),
      }
      
      setStoredUser(authUser)
      dispatch({ type: 'LOGIN_SUCCESS', payload: authUser })
      return true
    } else {
      dispatch({ type: 'LOGIN_FAILURE', payload: '用戶名或密碼錯誤' })
      return false
    }
  }, [setStoredUser])

  const register = useCallback(async (credentials: RegisterCredentials): Promise<boolean> => {
    dispatch({ type: 'LOGIN_START' })
    
    // Validate passwords match
    if (credentials.password !== credentials.confirmPassword) {
      dispatch({ type: 'LOGIN_FAILURE', payload: '密碼確認不匹配' })
      return false
    }
    
    // Check if user already exists
    const existingUser = mockUsers.find(
      u => u.email === credentials.email || u.username === credentials.username
    )
    
    if (existingUser) {
      dispatch({ type: 'LOGIN_FAILURE', payload: '用戶名或郵箱已存在' })
      return false
    }
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Create new user
    const newUser: User = {
      id: Date.now().toString(),
      username: credentials.username,
      email: credentials.email,
      createdAt: new Date(),
      lastLoginAt: new Date(),
    }
    
    // Add to mock database
    mockUsers.push({
      ...newUser,
      password: credentials.password,
    })
    
    setStoredUser(newUser)
    dispatch({ type: 'LOGIN_SUCCESS', payload: newUser })
    return true
  }, [setStoredUser])

  const logout = useCallback(() => {
    setStoredUser(null)
    dispatch({ type: 'LOGOUT' })
  }, [setStoredUser])

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' })
  }, [])

  const updateProfile = useCallback(async (updates: Partial<User>): Promise<boolean> => {
    if (!state.user) return false
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const updatedUser = { ...state.user, ...updates }
    setStoredUser(updatedUser)
    dispatch({ type: 'UPDATE_PROFILE', payload: updatedUser })
    return true
  }, [state.user, setStoredUser])

  const value: UserContextType = {
    ...state,
    login,
    register,
    logout,
    clearError,
    updateProfile,
  }

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

export const useUser = (): UserContextType => {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}