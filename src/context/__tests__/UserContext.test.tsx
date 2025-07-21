import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { UserProvider, useUser } from '../UserContext'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// Test component to use UserContext
const TestComponent = () => {
  const { user, isAuthenticated, login, register, logout, error, isLoading } = useUser()

  return (
    <div>
      <div data-testid="auth-status">
        {isAuthenticated ? 'authenticated' : 'not-authenticated'}
      </div>
      <div data-testid="user-info">
        {user ? `${user.username} - ${user.email}` : 'no-user'}
      </div>
      <div data-testid="loading">{isLoading ? 'loading' : 'not-loading'}</div>
      <div data-testid="error">{error || 'no-error'}</div>
      
      <button
        onClick={() => login({ email: 'demo@example.com', password: 'demo123' })}
        data-testid="login-button"
      >
        Login
      </button>
      
      <button
        onClick={() => login({ email: 'wrong@example.com', password: 'wrong' })}
        data-testid="login-wrong-button"
      >
        Login Wrong
      </button>
      
      <button
        onClick={() => register({ 
          username: 'newuser', 
          email: 'new@example.com', 
          password: 'password123',
          confirmPassword: 'password123'
        })}
        data-testid="register-button"
      >
        Register
      </button>
      
      <button
        onClick={() => register({ 
          username: 'demo', 
          email: 'demo@example.com', 
          password: 'password123',
          confirmPassword: 'password123'
        })}
        data-testid="register-existing-button"
      >
        Register Existing
      </button>
      
      <button onClick={logout} data-testid="logout-button">
        Logout
      </button>
    </div>
  )
}

describe('UserContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
  })

  it('provides initial unauthenticated state', () => {
    render(
      <UserProvider>
        <TestComponent />
      </UserProvider>
    )

    expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated')
    expect(screen.getByTestId('user-info')).toHaveTextContent('no-user')
    expect(screen.getByTestId('loading')).toHaveTextContent('not-loading')
    expect(screen.getByTestId('error')).toHaveTextContent('no-error')
  })

  it('restores user session from localStorage', () => {
    const mockUser = {
      id: '1',
      username: 'demo',
      email: 'demo@example.com',
      createdAt: new Date('2024-01-01'),
      lastLoginAt: new Date(),
    }
    
    localStorageMock.getItem.mockReturnValue(JSON.stringify(mockUser))

    render(
      <UserProvider>
        <TestComponent />
      </UserProvider>
    )

    expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated')
    expect(screen.getByTestId('user-info')).toHaveTextContent('demo - demo@example.com')
  })

  it('handles successful login', async () => {
    const user = userEvent.setup()
    
    render(
      <UserProvider>
        <TestComponent />
      </UserProvider>
    )

    // Initially not authenticated
    expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated')

    // Click login button
    await user.click(screen.getByTestId('login-button'))

    // Should show loading state
    expect(screen.getByTestId('loading')).toHaveTextContent('loading')

    // Wait for login to complete
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated')
    })

    expect(screen.getByTestId('user-info')).toHaveTextContent('demo - demo@example.com')
    expect(screen.getByTestId('loading')).toHaveTextContent('not-loading')
    expect(screen.getByTestId('error')).toHaveTextContent('no-error')
  })

  it('handles failed login', async () => {
    const user = userEvent.setup()
    
    render(
      <UserProvider>
        <TestComponent />
      </UserProvider>
    )

    // Click login button with wrong credentials
    await user.click(screen.getByTestId('login-wrong-button'))

    // Wait for login to complete
    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('用戶名或密碼錯誤')
    })

    expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated')
    expect(screen.getByTestId('loading')).toHaveTextContent('not-loading')
  })

  it('handles successful registration', async () => {
    const user = userEvent.setup()
    
    render(
      <UserProvider>
        <TestComponent />
      </UserProvider>
    )

    // Click register button
    await user.click(screen.getByTestId('register-button'))

    // Wait for registration to complete
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated')
    })

    expect(screen.getByTestId('user-info')).toHaveTextContent('newuser - new@example.com')
    expect(screen.getByTestId('loading')).toHaveTextContent('not-loading')
    expect(screen.getByTestId('error')).toHaveTextContent('no-error')
  })

  it('handles failed registration with existing user', async () => {
    const user = userEvent.setup()
    
    render(
      <UserProvider>
        <TestComponent />
      </UserProvider>
    )

    // Click register button with existing user
    await user.click(screen.getByTestId('register-existing-button'))

    // Wait for registration to complete
    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('用戶名或郵箱已存在')
    })

    expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated')
    expect(screen.getByTestId('loading')).toHaveTextContent('not-loading')
  })

  it('handles logout', async () => {
    const user = userEvent.setup()
    
    // Start with authenticated user
    const mockUser = {
      id: '1',
      username: 'demo',
      email: 'demo@example.com',
      createdAt: new Date('2024-01-01'),
      lastLoginAt: new Date(),
    }
    localStorageMock.getItem.mockReturnValue(JSON.stringify(mockUser))

    render(
      <UserProvider>
        <TestComponent />
      </UserProvider>
    )

    // Should be authenticated initially
    expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated')

    // Click logout button
    await user.click(screen.getByTestId('logout-button'))

    expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated')
    expect(screen.getByTestId('user-info')).toHaveTextContent('no-user')
    expect(localStorageMock.setItem).toHaveBeenCalledWith('currentUser', 'null')
  })

  it('throws error when used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    expect(() => {
      render(<TestComponent />)
    }).toThrow('useUser must be used within a UserProvider')
    
    consoleSpy.mockRestore()
  })
})