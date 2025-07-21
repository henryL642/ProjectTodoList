import { renderHook, act } from '@testing-library/react'
import { vi } from 'vitest'
import { useTodos } from '../useTodos'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

describe('useTodos', () => {
  beforeEach(() => {
    // Clear localStorage mock
    localStorageMock.getItem.mockReturnValue(null)
    localStorageMock.setItem.mockClear()
    localStorageMock.removeItem.mockClear()
    localStorageMock.clear.mockClear()
  })

  afterEach(() => {
    // Clean up any timers or side effects
    vi.clearAllTimers()
    vi.clearAllMocks()
  })
  it('starts with empty todos list', () => {
    const { result } = renderHook(() => useTodos())

    expect(result.current.todos).toEqual([])
    expect(result.current.activeCount).toBe(0)
    expect(result.current.completedCount).toBe(0)
  })

  it('adds a new todo', () => {
    const { result } = renderHook(() => useTodos())

    act(() => {
      result.current.addTodo('New todo')
    })

    expect(result.current.todos).toHaveLength(1)
    expect(result.current.todos[0].text).toBe('New todo')
    expect(result.current.todos[0].completed).toBe(false)
    expect(result.current.activeCount).toBe(1)
  })

  it('toggles todo completion', () => {
    const { result } = renderHook(() => useTodos())

    act(() => {
      result.current.addTodo('Test todo')
    })

    const todoId = result.current.todos[0].id

    act(() => {
      result.current.toggleTodo(todoId)
    })

    expect(result.current.todos[0].completed).toBe(true)
    expect(result.current.activeCount).toBe(0)
    expect(result.current.completedCount).toBe(1)
  })

  it('deletes a todo', () => {
    const { result } = renderHook(() => useTodos())

    act(() => {
      result.current.addTodo('Todo to delete')
    })

    const todoId = result.current.todos[0].id

    act(() => {
      result.current.deleteTodo(todoId)
    })

    expect(result.current.todos).toHaveLength(0)
  })

  it('edits a todo', () => {
    const { result } = renderHook(() => useTodos())

    act(() => {
      result.current.addTodo('Original text')
    })

    const todoId = result.current.todos[0].id

    act(() => {
      result.current.editTodo(todoId, { text: 'Updated text' })
    })

    expect(result.current.todos[0].text).toBe('Updated text')
  })

  it('filters todos correctly', () => {
    const { result } = renderHook(() => useTodos())

    act(() => {
      result.current.addTodo('Active todo')
      result.current.addTodo('Completed todo')
    })

    // Get the completed todo ID after both todos are added
    let completedId = ''
    act(() => {
      // Find the "Completed todo" by text since order might vary
      const completedTodo = result.current.todos.find(todo => todo.text === 'Completed todo')
      if (completedTodo) {
        completedId = completedTodo.id
        result.current.toggleTodo(completedId)
      }
    })

    // Test active filter
    act(() => {
      result.current.setFilter('active')
    })

    expect(result.current.todos).toHaveLength(1)
    expect(result.current.todos[0].text).toBe('Active todo')

    // Test completed filter
    act(() => {
      result.current.setFilter('completed')
    })

    expect(result.current.todos).toHaveLength(1)
    expect(result.current.todos[0].text).toBe('Completed todo')

    // Test all filter
    act(() => {
      result.current.setFilter('all')
    })

    expect(result.current.todos).toHaveLength(2)
  })

  it('clears completed todos', () => {
    const { result } = renderHook(() => useTodos())

    act(() => {
      result.current.addTodo('Active todo')
      result.current.addTodo('Completed todo')
    })

    let completedId = ''
    act(() => {
      const completedTodo = result.current.todos.find(todo => todo.text === 'Completed todo')
      if (completedTodo) {
        completedId = completedTodo.id
        result.current.toggleTodo(completedId)
      }
    })

    act(() => {
      result.current.clearCompleted()
    })

    expect(result.current.todos).toHaveLength(1)
    expect(result.current.todos[0].text).toBe('Active todo')
  })

  it('toggles all todos', () => {
    const { result } = renderHook(() => useTodos())

    act(() => {
      result.current.addTodo('Todo 1')
      result.current.addTodo('Todo 2')
    })

    // Toggle all to completed
    act(() => {
      result.current.toggleAllTodos()
    })

    expect(result.current.completedCount).toBe(2)
    expect(result.current.activeCount).toBe(0)

    // Toggle all back to active
    act(() => {
      result.current.toggleAllTodos()
    })

    expect(result.current.completedCount).toBe(0)
    expect(result.current.activeCount).toBe(2)
  })
})
