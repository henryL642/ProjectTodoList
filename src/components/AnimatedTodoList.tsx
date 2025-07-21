import React, { useRef, useEffect } from 'react'
import type { Todo } from '../types/todo'
import { TodoItem } from './TodoItem'

interface AnimatedTodoListProps {
  todos: Todo[]
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onEdit: (id: string, text: string) => void
}

export const AnimatedTodoList: React.FC<AnimatedTodoListProps> = ({
  todos,
  onToggle,
  onDelete,
  onEdit,
}) => {
  const listRef = useRef<HTMLUListElement>(null)
  const prevTodosRef = useRef<Todo[]>([])

  useEffect(() => {
    const prevTodos = prevTodosRef.current
    const currentTodos = todos

    // Detect newly added todos
    const newTodos = currentTodos.filter(
      todo => !prevTodos.some(prevTodo => prevTodo.id === todo.id)
    )

    // Detect removed todos (for future animation features)
    // const removedTodos = prevTodos.filter(
    //   prevTodo => !currentTodos.some(todo => todo.id === prevTodo.id)
    // )

    // Animate new todos
    if (newTodos.length > 0 && listRef.current) {
      const newItems = listRef.current.querySelectorAll('.todo-item:last-child')
      newItems.forEach(item => {
        item.classList.add('todo-item--entering')
        setTimeout(() => {
          item.classList.remove('todo-item--entering')
        }, 300)
      })
    }

    // Update ref
    prevTodosRef.current = currentTodos
  }, [todos])

  if (todos.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state__icon">📝</div>
        <div className="empty-state__title">還沒有任務</div>
        <div className="empty-state__subtitle">在上面添加第一個任務吧！</div>
      </div>
    )
  }

  return (
    <ul ref={listRef} className="animated-todo-list">
      {todos.map((todo) => (
        <div key={todo.id} data-todo-id={todo.id}>
          <TodoItem
            todo={todo}
            onToggle={onToggle}
            onDelete={onDelete}
            onEdit={onEdit}
          />
        </div>
      ))}
    </ul>
  )
}