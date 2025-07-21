import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { UserProfile } from '../UserProfile'
import { UserProvider } from '../../context/UserContext'

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

const mockUser = {
  id: '1',
  username: 'testuser',
  email: 'test@example.com',
  createdAt: new Date('2024-01-01T10:00:00Z'),
  lastLoginAt: new Date('2024-01-15T14:30:00Z'),
}

const renderUserProfile = () => {
  localStorageMock.getItem.mockReturnValue(JSON.stringify(mockUser))
  
  return render(
    <UserProvider>
      <UserProfile />
    </UserProvider>
  )
}

describe('UserProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders user profile with user information', () => {
    renderUserProfile()

    expect(screen.getByText('testuser')).toBeInTheDocument()
    expect(screen.getByText('test@example.com')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '編輯資料' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '登出' })).toBeInTheDocument()
  })

  it('displays user avatar placeholder with first letter', () => {
    renderUserProfile()

    const avatarPlaceholder = screen.getByText('T') // First letter of "testuser"
    expect(avatarPlaceholder).toBeInTheDocument()
  })

  it('displays formatted creation and login dates', () => {
    renderUserProfile()

    expect(screen.getByText(/註冊時間：/)).toBeInTheDocument()
    expect(screen.getByText(/最後登錄：/)).toBeInTheDocument()
  })

  it('enters edit mode when edit button is clicked', async () => {
    const user = userEvent.setup()
    renderUserProfile()

    const editButton = screen.getByRole('button', { name: '編輯資料' })
    await user.click(editButton)

    expect(screen.getByLabelText('用戶名')).toBeInTheDocument()
    expect(screen.getByLabelText('郵箱')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '保存' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '取消' })).toBeInTheDocument()
  })

  it('populates edit form with current user data', async () => {
    const user = userEvent.setup()
    renderUserProfile()

    const editButton = screen.getByRole('button', { name: '編輯資料' })
    await user.click(editButton)

    const usernameInput = screen.getByLabelText('用戶名')
    const emailInput = screen.getByLabelText('郵箱')

    expect(usernameInput).toHaveValue('testuser')
    expect(emailInput).toHaveValue('test@example.com')
  })

  it('handles form input changes in edit mode', async () => {
    const user = userEvent.setup()
    renderUserProfile()

    // Enter edit mode
    await user.click(screen.getByRole('button', { name: '編輯資料' }))

    const usernameInput = screen.getByLabelText('用戶名')
    const emailInput = screen.getByLabelText('郵箱')

    // Clear and type new values
    await user.clear(usernameInput)
    await user.type(usernameInput, 'newusername')
    
    await user.clear(emailInput)
    await user.type(emailInput, 'new@example.com')

    expect(usernameInput).toHaveValue('newusername')
    expect(emailInput).toHaveValue('new@example.com')
  })

  it('saves profile changes when save button is clicked', async () => {
    const user = userEvent.setup()
    renderUserProfile()

    // Enter edit mode
    await user.click(screen.getByRole('button', { name: '編輯資料' }))

    const usernameInput = screen.getByLabelText('用戶名')
    const saveButton = screen.getByRole('button', { name: '保存' })

    // Make changes
    await user.clear(usernameInput)
    await user.type(usernameInput, 'updateduser')

    // Save changes
    await user.click(saveButton)

    // Should show saving state
    await waitFor(() => {
      expect(screen.getByRole('button', { name: '保存中...' })).toBeInTheDocument()
    })

    // Should exit edit mode and show updated data
    await waitFor(() => {
      expect(screen.getByText('updateduser')).toBeInTheDocument()
    })

    expect(screen.queryByLabelText('用戶名')).not.toBeInTheDocument()
  })

  it('cancels edit mode when cancel button is clicked', async () => {
    const user = userEvent.setup()
    renderUserProfile()

    // Enter edit mode
    await user.click(screen.getByRole('button', { name: '編輯資料' }))

    const usernameInput = screen.getByLabelText('用戶名')
    const cancelButton = screen.getByRole('button', { name: '取消' })

    // Make changes
    await user.clear(usernameInput)
    await user.type(usernameInput, 'changedname')

    // Cancel changes
    await user.click(cancelButton)

    // Should exit edit mode and revert to original data
    expect(screen.getByText('testuser')).toBeInTheDocument()
    expect(screen.queryByLabelText('用戶名')).not.toBeInTheDocument()
  })

  it('disables save button when fields are empty', async () => {
    const user = userEvent.setup()
    renderUserProfile()

    // Enter edit mode
    await user.click(screen.getByRole('button', { name: '編輯資料' }))

    const usernameInput = screen.getByLabelText('用戶名')
    const saveButton = screen.getByRole('button', { name: '保存' })

    // Clear username
    await user.clear(usernameInput)

    expect(saveButton).toBeDisabled()
  })

  it('handles logout when logout button is clicked', async () => {
    const user = userEvent.setup()
    renderUserProfile()

    const logoutButton = screen.getByRole('button', { name: '登出' })
    await user.click(logoutButton)

    // The UserContext will handle the logout, which will cause the component to not render
    // or we can verify that localStorage.setItem was called with null
    expect(localStorageMock.setItem).toHaveBeenCalledWith('currentUser', 'null')
  })

  it('does not render when user is not authenticated', () => {
    localStorageMock.getItem.mockReturnValue(null)
    
    const { container } = render(
      <UserProvider>
        <UserProfile />
      </UserProvider>
    )

    expect(container.firstChild).toBeNull()
  })

  it('formats dates in Chinese locale', () => {
    renderUserProfile()

    // The exact format may vary based on browser/environment, but should contain Chinese characters
    const dateElements = screen.getAllByText(/年|月|日/)
    expect(dateElements.length).toBeGreaterThan(0)
  })
})