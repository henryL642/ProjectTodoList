import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { LoginForm } from '../LoginForm'
import { UserProvider } from '../../../context/UserContext'

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

const renderLoginForm = (props = {}) => {
  const defaultProps = {
    onSwitchToRegister: vi.fn(),
    ...props,
  }

  return render(
    <UserProvider>
      <LoginForm {...defaultProps} />
    </UserProvider>
  )
}

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
  })

  it('renders login form with all elements', () => {
    renderLoginForm()

    expect(screen.getByRole('heading', { name: '登錄' })).toBeInTheDocument()
    expect(screen.getByText('歡迎回來！請登錄您的帳戶')).toBeInTheDocument()
    expect(screen.getByLabelText('郵箱')).toBeInTheDocument()
    expect(screen.getByLabelText('密碼')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '登錄' })).toBeInTheDocument()
    expect(screen.getByText('還沒有帳戶？')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '立即註冊' })).toBeInTheDocument()
    expect(screen.getByText('演示帳戶：')).toBeInTheDocument()
  })

  it('handles form input changes', async () => {
    const user = userEvent.setup()
    renderLoginForm()

    const emailInput = screen.getByLabelText('郵箱')
    const passwordInput = screen.getByLabelText('密碼')

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')

    expect(emailInput).toHaveValue('test@example.com')
    expect(passwordInput).toHaveValue('password123')
  })

  it('toggles password visibility', async () => {
    const user = userEvent.setup()
    renderLoginForm()

    const passwordInput = screen.getByLabelText('密碼')
    const toggleButton = screen.getByLabelText('顯示密碼')

    expect(passwordInput).toHaveAttribute('type', 'password')

    await user.click(toggleButton)
    expect(passwordInput).toHaveAttribute('type', 'text')
    expect(screen.getByLabelText('隱藏密碼')).toBeInTheDocument()

    await user.click(toggleButton)
    expect(passwordInput).toHaveAttribute('type', 'password')
  })

  it('disables submit button when form is invalid', () => {
    renderLoginForm()

    const submitButton = screen.getByRole('button', { name: '登錄' })
    expect(submitButton).toBeDisabled()
  })

  it('enables submit button when form is valid', async () => {
    const user = userEvent.setup()
    renderLoginForm()

    const emailInput = screen.getByLabelText('郵箱')
    const passwordInput = screen.getByLabelText('密碼')
    const submitButton = screen.getByRole('button', { name: '登錄' })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')

    expect(submitButton).toBeEnabled()
  })

  it('handles successful login', async () => {
    const user = userEvent.setup()
    renderLoginForm()

    const emailInput = screen.getByLabelText('郵箱')
    const passwordInput = screen.getByLabelText('密碼')
    const submitButton = screen.getByRole('button', { name: '登錄' })

    // Use demo credentials
    await user.type(emailInput, 'demo@example.com')
    await user.type(passwordInput, 'demo123')
    await user.click(submitButton)

    // Should show loading state
    await waitFor(() => {
      expect(screen.getByRole('button', { name: '登錄中...' })).toBeInTheDocument()
    })

    // Login should complete (UserContext handles the success)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: '登錄' })).toBeInTheDocument()
    })
  })

  it('handles failed login', async () => {
    const user = userEvent.setup()
    renderLoginForm()

    const emailInput = screen.getByLabelText('郵箱')
    const passwordInput = screen.getByLabelText('密碼')
    const submitButton = screen.getByRole('button', { name: '登錄' })

    // Use wrong credentials
    await user.type(emailInput, 'wrong@example.com')
    await user.type(passwordInput, 'wrongpassword')
    await user.click(submitButton)

    // Should show error message
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('用戶名或密碼錯誤')
    })
  })

  it('calls onSwitchToRegister when register link is clicked', async () => {
    const user = userEvent.setup()
    const mockSwitchToRegister = vi.fn()
    renderLoginForm({ onSwitchToRegister: mockSwitchToRegister })

    const registerLink = screen.getByRole('button', { name: '立即註冊' })
    await user.click(registerLink)

    expect(mockSwitchToRegister).toHaveBeenCalledTimes(1)
  })

  it('clears error when user starts typing', async () => {
    const user = userEvent.setup()
    renderLoginForm()

    const emailInput = screen.getByLabelText('郵箱')
    const passwordInput = screen.getByLabelText('密碼')
    const submitButton = screen.getByRole('button', { name: '登錄' })

    // Trigger error first
    await user.type(emailInput, 'wrong@example.com')
    await user.type(passwordInput, 'wrongpassword')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    // Clear error by typing
    await user.clear(emailInput)
    await user.type(emailInput, 'new@example.com')

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('prevents form submission with empty fields', async () => {
    const user = userEvent.setup()
    renderLoginForm()

    const form = screen.getByRole('form') || screen.getByTestId('login-form') || document.querySelector('form')
    
    if (form) {
      // Try to submit empty form
      await user.click(screen.getByRole('button', { name: '登錄' }))
      
      // Form should not submit (button should be disabled)
      expect(screen.getByRole('button', { name: '登錄' })).toBeDisabled()
    }
  })

  it('shows demo credentials information', () => {
    renderLoginForm()

    expect(screen.getByText('演示帳戶：')).toBeInTheDocument()
    expect(screen.getByText('郵箱: demo@example.com | 密碼: demo123')).toBeInTheDocument()
  })
})