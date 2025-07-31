import React, { useState, useCallback } from 'react'
import type { Todo } from '../types/todo'

interface TodoItemProps {
  todo: Todo
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onEdit?: (todo: Todo) => void // Changed to support full todo editing
  showDeleteConfirm?: boolean
  showProject?: boolean
  showSchedulingStatus?: boolean
}

export const TodoItem: React.FC<TodoItemProps> = ({
  todo,
  onToggle,
  onDelete,
  onEdit,
  showDeleteConfirm = true,
  showProject = false,
  showSchedulingStatus = false,
}) => {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleFullEdit = useCallback(() => {
    if (onEdit) {
      onEdit(todo)
    }
  }, [todo, onEdit])

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

  // Get priority info
  const getPriorityInfo = () => {
    const priorityConfigs = {
      'urgent_important': { label: '緊急重要', color: '#e74c3c', icon: '🔴' },
      'urgent_not_important': { label: '緊急不重要', color: '#f39c12', icon: '🟡' },
      'important_not_urgent': { label: '重要不緊急', color: '#3498db', icon: '🔵' },
      'not_urgent_not_important': { label: '不緊急不重要', color: '#95a5a6', icon: '⚪' }
    }
    return priorityConfigs[todo.priority] || priorityConfigs['not_urgent_not_important']
  }

  const priorityInfo = getPriorityInfo()

  return (
    <div className={`todo-item-enhanced ${todo.completed ? 'completed' : ''} ${isDeleting ? 'deleting' : ''}`}>
      {/* Main Content Area */}
      <div className="todo-main-content">
        {/* Checkbox */}
        <div className="todo-checkbox-area">
          <input
            type="checkbox"
            checked={todo.completed}
            onChange={handleToggle}
            className="todo-checkbox"
            aria-label={`標記"${todo.text}"為${todo.completed ? '未完成' : '已完成'}`}
          />
        </div>

        {/* Task Info */}
        <div className="todo-info">
          <div className="todo-title-row">
            <span className="todo-text" title={todo.text}>
              {todo.text}
            </span>
            
            {/* Priority Badge */}
            <div className="todo-priority-badge" style={{ backgroundColor: priorityInfo.color }}>
              <span className="priority-icon">{priorityInfo.icon}</span>
              <span className="priority-label">{priorityInfo.label}</span>
            </div>
          </div>

          {/* Additional Info Row */}
          <div className="todo-meta-row">
            {showProject && todo.projectId && (
              <span className="todo-project">📁 專案</span>
            )}
            
            {showSchedulingStatus && (
              <span className="todo-scheduling">
                {todo.scheduledSlots && todo.scheduledSlots.length > 0 
                  ? `📅 已排程 ${todo.scheduledSlots.length}/${todo.totalPomodoros || 1}` 
                  : '⏳ 待排程'
                }
              </span>
            )}
            
            {todo.dueDate && (
              <span className="todo-due-date">
                📅 {new Date(todo.dueDate).toLocaleDateString('zh-TW')}
              </span>
            )}
            
            <span className="todo-pomodoros">
              🍅 {todo.totalPomodoros || 1} 個番茄鐘
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons - 分離的按鈕區域防止重疊 */}
      <div className="todo-actions-area">
        <button
          onClick={handleFullEdit}
          className="todo-action-btn edit-btn"
          aria-label="編輯任務"
          title="編輯任務"
        >
          ✏️
        </button>
        
        <button
          onClick={handleDeleteClick}
          className="todo-action-btn delete-btn"
          aria-label="刪除任務"
          title="刪除任務"
          disabled={isDeleting}
        >
          {isDeleting ? '⟳' : '🗑️'}
        </button>
      </div>
      
      {/* Confirm Dialog */}
      {showConfirmDialog && (
        <div className="todo-confirm-overlay">
          <div className="todo-confirm-dialog">
            <div className="confirm-content">
              <p>確定要刪除「{todo.text}」嗎？</p>
              <div className="confirm-actions">
                <button
                  onClick={handleConfirmDelete}
                  className="confirm-delete-btn"
                >
                  確定刪除
                </button>
                <button
                  onClick={handleCancelDelete}
                  className="confirm-cancel-btn"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
