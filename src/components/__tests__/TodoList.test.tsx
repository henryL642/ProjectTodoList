import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { TodoList } from '../TodoList'
import type { Todo } from '../../types/todo'

const mockTodos: Todo[] = [
  {
    id: '1',
    text: '第一個任務',
    completed: false,
    createdAt: new Date('2024-01-01')
  },
  {
    id: '2', 
    text: '第二個任務',
    completed: true,
    createdAt: new Date('2024-01-02')
  }
]

const mockHandlers = {
  onToggle: vi.fn(),
  onDelete: vi.fn(),
  onEdit: vi.fn()
}

describe('TodoList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders empty state when no todos', () => {
    render(<TodoList todos={[]} {...mockHandlers} />)
    expect(screen.getByText('No todos yet. Add one above!')).toBeInTheDocument()
  })

  it('renders all todos in the list', () => {
    render(<TodoList todos={mockTodos} {...mockHandlers} />)
    
    expect(screen.getByText('第一個任務')).toBeInTheDocument()
    expect(screen.getByText('第二個任務')).toBeInTheDocument()
  })

  it('passes correct props to TodoItem components', () => {
    render(<TodoList todos={mockTodos} {...mockHandlers} />)
    
    // Check that each todo is rendered with correct data
    const checkboxes = screen.getAllByRole('checkbox')
    expect(checkboxes).toHaveLength(2)
    expect(checkboxes[0]).not.toBeChecked() // First todo is not completed
    expect(checkboxes[1]).toBeChecked() // Second todo is completed
  })

  it('handles toggle action from TodoItem', async () => {
    const user = userEvent.setup()
    render(<TodoList todos={mockTodos} {...mockHandlers} />)
    
    const firstCheckbox = screen.getAllByRole('checkbox')[0]
    await user.click(firstCheckbox)
    
    expect(mockHandlers.onToggle).toHaveBeenCalledWith('1')
  })

  it('handles delete action from TodoItem', async () => {
    vi.useFakeTimers()
    const user = userEvent.setup()
    render(<TodoList todos={mockTodos} {...mockHandlers} />)
    
    const deleteButtons = screen.getAllByRole('button', { name: /刪除任務/i })
    await user.click(deleteButtons[0])
    
    // Confirm deletion
    const confirmButton = screen.getByText('確定刪除')
    await user.click(confirmButton)
    
    vi.advanceTimersByTime(200)
    expect(mockHandlers.onDelete).toHaveBeenCalledWith('1')
    vi.useRealTimers()
  })

  it('handles edit action from TodoItem', async () => {
    const user = userEvent.setup()
    render(<TodoList todos={mockTodos} {...mockHandlers} />)
    
    const firstTodoText = screen.getByText('第一個任務')
    await user.dblClick(firstTodoText)
    
    const editInput = screen.getByDisplayValue('第一個任務')
    await user.clear(editInput)
    await user.type(editInput, '編輯後的任務')
    await user.keyboard('{Enter}')
    
    expect(mockHandlers.onEdit).toHaveBeenCalledWith('1', '編輯後的任務')
  })

  it('preserves todo order', () => {
    render(<TodoList todos={mockTodos} {...mockHandlers} />)
    
    const todoItems = screen.getAllByRole('listitem')
    expect(todoItems[0]).toHaveTextContent('第一個任務')
    expect(todoItems[1]).toHaveTextContent('第二個任務')
  })

  it('renders large lists efficiently', () => {
    const largeTodoList = Array.from({ length: 100 }, (_, i) => ({
      id: i.toString(),
      text: `任務 ${i + 1}`,
      completed: i % 2 === 0,
      createdAt: new Date()
    }))

    render(<TodoList todos={largeTodoList} {...mockHandlers} />)
    
    // Should render all items
    expect(screen.getAllByRole('listitem')).toHaveLength(100)
    expect(screen.getByText('任務 1')).toBeInTheDocument()
    expect(screen.getByText('任務 100')).toBeInTheDocument()
  })

  it('handles todos with special characters', () => {
    const specialTodos: Todo[] = [
      {
        id: '1',
        text: '任務 with émojis 🚀✨',
        completed: false,
        createdAt: new Date()
      },
      {
        id: '2',
        text: 'Task with <HTML> & symbols',
        completed: false,
        createdAt: new Date()
      }
    ]

    render(<TodoList todos={specialTodos} {...mockHandlers} />)
    
    expect(screen.getByText('任務 with émojis 🚀✨')).toBeInTheDocument()
    expect(screen.getByText('Task with <HTML> & symbols')).toBeInTheDocument()
  })
})