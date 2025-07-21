import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { TodoItem } from '../TodoItem'
import type { Todo } from '../../types/todo'

const mockTodo: Todo = {
  id: '1',
  text: 'Test todo',
  completed: false,
  createdAt: new Date(),
}

const mockHandlers = {
  onToggle: vi.fn(),
  onDelete: vi.fn(),
  onEdit: vi.fn(),
}

describe('TodoItem', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders todo text', () => {
    render(<TodoItem todo={mockTodo} {...mockHandlers} />)
    expect(screen.getByText('Test todo')).toBeInTheDocument()
  })

  it('shows checkbox as unchecked for incomplete todo', () => {
    render(<TodoItem todo={mockTodo} {...mockHandlers} />)
    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).not.toBeChecked()
  })

  it('shows checkbox as checked for completed todo', () => {
    const completedTodo = { ...mockTodo, completed: true }
    render(<TodoItem todo={completedTodo} {...mockHandlers} />)
    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).toBeChecked()
  })

  it('calls onToggle when checkbox is clicked', async () => {
    const user = userEvent.setup()
    render(<TodoItem todo={mockTodo} {...mockHandlers} />)
    const checkbox = screen.getByRole('checkbox')

    await user.click(checkbox)
    expect(mockHandlers.onToggle).toHaveBeenCalledWith('1')
  })

  it('calls onDelete when delete button is clicked and confirmed', async () => {
    vi.useFakeTimers()
    const user = userEvent.setup()
    render(<TodoItem todo={mockTodo} {...mockHandlers} />)
    const deleteButton = screen.getByRole('button', { name: /刪除任務/i })

    // Click delete button to show confirmation dialog
    await user.click(deleteButton)
    
    // Find and click the confirm button
    const confirmButton = screen.getByText('確定刪除')
    await user.click(confirmButton)
    
    // Fast-forward time to complete the animation
    vi.advanceTimersByTime(200)
    
    expect(mockHandlers.onDelete).toHaveBeenCalledWith('1')
    vi.useRealTimers()
  })

  it('calls onDelete immediately when showDeleteConfirm is false', async () => {
    vi.useFakeTimers()
    const user = userEvent.setup()
    render(<TodoItem todo={mockTodo} {...mockHandlers} showDeleteConfirm={false} />)
    const deleteButton = screen.getByRole('button', { name: /刪除任務/i })

    await user.click(deleteButton)
    vi.advanceTimersByTime(200)
    expect(mockHandlers.onDelete).toHaveBeenCalledWith('1')
    vi.useRealTimers()
  })

  it('enters edit mode when text is double-clicked', async () => {
    const user = userEvent.setup()
    render(<TodoItem todo={mockTodo} {...mockHandlers} />)
    const todoText = screen.getByText('Test todo')

    await user.dblClick(todoText)
    expect(screen.getByDisplayValue('Test todo')).toBeInTheDocument()
  })

  it('calls onEdit when Enter is pressed in edit mode', async () => {
    const user = userEvent.setup()
    render(<TodoItem todo={mockTodo} {...mockHandlers} />)
    const todoText = screen.getByText('Test todo')

    await user.dblClick(todoText)
    const editInput = screen.getByDisplayValue('Test todo')
    await user.clear(editInput)
    await user.type(editInput, 'Updated todo')
    await user.keyboard('{Enter}')

    expect(mockHandlers.onEdit).toHaveBeenCalledWith('1', 'Updated todo')
  })

  it('cancels edit mode when Escape is pressed', async () => {
    const user = userEvent.setup()
    render(<TodoItem todo={mockTodo} {...mockHandlers} />)
    const todoText = screen.getByText('Test todo')

    await user.dblClick(todoText)
    const editInput = screen.getByDisplayValue('Test todo')
    await user.clear(editInput)
    await user.type(editInput, 'Should not save')
    await user.keyboard('{Escape}')

    expect(screen.getByText('Test todo')).toBeInTheDocument()
    expect(mockHandlers.onEdit).not.toHaveBeenCalled()
  })
})
