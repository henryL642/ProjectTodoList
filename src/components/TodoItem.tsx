import React, { useState, useCallback } from 'react'
import type { Todo } from '../types/todo'

interface TodoItemProps {
  todo: Todo
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onEdit: (id: string, text: string) => void
  showDeleteConfirm?: boolean
}

export const TodoItem: React.FC<TodoItemProps> = ({
  todo,
  onToggle,
  onDelete,
  onEdit,
  showDeleteConfirm = true,
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(todo.text)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleEdit = useCallback(() => {
    const trimmedText = editText.trim()
    if (trimmedText && trimmedText !== todo.text) {
      onEdit(todo.id, trimmedText)
    }
    setIsEditing(false)
  }, [editText, todo.id, todo.text, onEdit])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleEdit()
    } else if (e.key === 'Escape') {
      setEditText(todo.text)
      setIsEditing(false)
    }
  }, [handleEdit, todo.text])

  const handleConfirmDelete = useCallback(() => {
    setIsDeleting(true)
    setTimeout(() => {
      onDelete(todo.id)
      setIsDeleting(false)
      setShowConfirmDialog(false)
    }, 150) // Small delay for animation
  }, [todo.id, onDelete])

  const handleDeleteClick = useCallback(() => {
    if (showDeleteConfirm) {
      setShowConfirmDialog(true)
    } else {
      handleConfirmDelete()
    }
  }, [showDeleteConfirm, handleConfirmDelete])

  const handleCancelDelete = useCallback(() => {
    setShowConfirmDialog(false)
  }, [])

  const handleToggle = useCallback(() => {
    onToggle(todo.id)
  }, [todo.id, onToggle])

  const handleStartEdit = useCallback(() => {
    setIsEditing(true)
    setEditText(todo.text)
  }, [todo.text])

  return (
    <li className={`todo-item ${todo.completed ? 'completed' : ''} ${isDeleting ? 'deleting' : ''}`}>
      {isEditing ? (
        <div className="edit-container">
          <input
            type="text"
            value={editText}
            onChange={e => setEditText(e.target.value)}
            onBlur={handleEdit}
            onKeyDown={handleKeyDown}
            className="edit-input"
            autoFocus
            maxLength={255}
          />
          <div className="edit-actions">
            <button
              onClick={handleEdit}
              className="save-button"
              disabled={!editText.trim()}
              aria-label="保存編輯"
            >
              ✓
            </button>
            <button
              onClick={() => {
                setEditText(todo.text)
                setIsEditing(false)
              }}
              className="cancel-button"
              aria-label="取消編輯"
            >
              ✕
            </button>
          </div>
        </div>
      ) : (
        <>
          <input
            type="checkbox"
            checked={todo.completed}
            onChange={handleToggle}
            className="todo-checkbox"
            aria-label={`標記"${todo.text}"為${todo.completed ? '未完成' : '已完成'}`}
          />
          <span className="todo-text" onDoubleClick={handleStartEdit} title="雙擊編輯">
            {todo.text}
          </span>
          
          <div className="todo-actions">
            <button
              onClick={handleStartEdit}
              className="edit-button"
              aria-label="編輯任務"
              title="編輯"
            >
              ✏️
            </button>
            <button
              onClick={handleDeleteClick}
              className="delete-button"
              aria-label="刪除任務"
              title="刪除"
              disabled={isDeleting}
            >
              {isDeleting ? '⟳' : '🗑️'}
            </button>
          </div>
        </>
      )}
      
      {showConfirmDialog && (
        <div className="confirm-dialog">
          <div className="confirm-content">
            <p>確定要刪除這個任務嗎？</p>
            <div className="confirm-actions">
              <button
                onClick={handleConfirmDelete}
                className="confirm-delete"
              >
                確定刪除
              </button>
              <button
                onClick={handleCancelDelete}
                className="cancel-delete"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </li>
  )
}
