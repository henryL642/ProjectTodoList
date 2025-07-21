import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { TodoInput } from '../TodoInput'

describe('TodoInput', () => {
  const mockOnAdd = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders input with placeholder', () => {
    render(<TodoInput onAdd={mockOnAdd} />)
    expect(screen.getByPlaceholderText('需要做什麼？')).toBeInTheDocument()
  })

  it('renders input with custom placeholder', () => {
    render(<TodoInput onAdd={mockOnAdd} placeholder="自定義占位符" />)
    expect(screen.getByPlaceholderText('自定義占位符')).toBeInTheDocument()
  })

  it('calls onAdd when form is submitted with valid text', async () => {
    const user = userEvent.setup()
    render(<TodoInput onAdd={mockOnAdd} />)
    
    const input = screen.getByRole('textbox')
    await user.type(input, '新的任務')
    await user.keyboard('{Enter}')
    
    expect(mockOnAdd).toHaveBeenCalledWith('新的任務')
  })

  it('clears input after successful submission', async () => {
    const user = userEvent.setup()
    render(<TodoInput onAdd={mockOnAdd} />)
    
    const input = screen.getByRole('textbox')
    await user.type(input, '測試任務')
    await user.keyboard('{Enter}')
    
    expect(input).toHaveValue('')
  })

  it('does not call onAdd with empty or whitespace text', async () => {
    const user = userEvent.setup()
    render(<TodoInput onAdd={mockOnAdd} />)
    
    const input = screen.getByRole('textbox')
    
    // Test empty string
    await user.keyboard('{Enter}')
    expect(mockOnAdd).not.toHaveBeenCalled()
    
    // Test whitespace only
    await user.type(input, '   ')
    await user.keyboard('{Enter}')
    expect(mockOnAdd).not.toHaveBeenCalled()
  })

  it('trims whitespace from input before calling onAdd', async () => {
    const user = userEvent.setup()
    render(<TodoInput onAdd={mockOnAdd} />)
    
    const input = screen.getByRole('textbox')
    await user.type(input, '  帶空格的任務  ')
    await user.keyboard('{Enter}')
    
    expect(mockOnAdd).toHaveBeenCalledWith('帶空格的任務')
  })

  it('handles form submission via button click', async () => {
    const user = userEvent.setup()
    render(<TodoInput onAdd={mockOnAdd} />)
    
    const input = screen.getByRole('textbox')
    await user.type(input, '點擊提交的任務')
    
    // Submit form by pressing Enter key instead
    await user.keyboard('{Enter}')
    
    expect(mockOnAdd).toHaveBeenCalledWith('點擊提交的任務')
  })

  it('supports Chinese input method', async () => {
    const user = userEvent.setup()
    render(<TodoInput onAdd={mockOnAdd} />)
    
    const input = screen.getByRole('textbox')
    await user.type(input, '測試中文輸入法')
    await user.keyboard('{Enter}')
    
    expect(mockOnAdd).toHaveBeenCalledWith('測試中文輸入法')
  })
})