import React, { useState, useEffect } from 'react'
import { MagicButton } from '../MagicButton'
import { useProjects } from '../../context/ProjectContext'
import type { Todo } from '../../types/todo'
import { Priority, PriorityConfigs, convertOldPriority } from '../../types/priority'

interface TodoEditModalProps {
  todo: Todo | null
  isOpen: boolean
  onClose: () => void
  onSave: (id: string, updates: Partial<Todo>) => void
}

export const TodoEditModal: React.FC<TodoEditModalProps> = ({
  todo,
  isOpen,
  onClose,
  onSave
}) => {
  const { projects } = useProjects()
  const [formData, setFormData] = useState({
    text: '',
    priority: Priority.IMPORTANT_NOT_URGENT as Priority,
    dueDate: '',
    projectId: '',
    totalPomodoros: 1
  })
  const [error, setError] = useState<string | null>(null)

  // Initialize form data when todo changes
  useEffect(() => {
    setError(null)
    if (todo) {
      try {
        let dueDateString = ''
        if (todo.dueDate) {
          // Handle both Date objects and date strings
          const date = todo.dueDate instanceof Date ? todo.dueDate : new Date(todo.dueDate)
          if (!isNaN(date.getTime())) {
            dueDateString = date.toISOString().slice(0, 16)
          }
        }
        
        // Handle priority migration for backwards compatibility
        let todoPriority = todo.priority
        if (typeof todo.priority === 'string' && ['low', 'medium', 'high'].includes(todo.priority)) {
          todoPriority = convertOldPriority(todo.priority as 'low' | 'medium' | 'high')
        }
        
        setFormData({
          text: todo.text,
          priority: todoPriority || Priority.IMPORTANT_NOT_URGENT,
          dueDate: dueDateString,
          projectId: todo.projectId || '',
          totalPomodoros: todo.totalPomodoros || 1
        })
      } catch (err) {
        console.error('Error initializing form data:', err)
        setError('無法載入任務資料')
      }
    }
  }, [todo])

  const handleSubmit = () => {
    if (!todo) return

    try {
      const updates: Partial<Todo> = {
        text: formData.text.trim(),
        priority: formData.priority,
        dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
        deadline: formData.dueDate ? new Date(formData.dueDate) : undefined,
        projectId: formData.projectId || undefined,
        totalPomodoros: formData.totalPomodoros,
        updatedAt: new Date()
      }

      onSave(todo.id, updates)
      onClose()
    } catch (err) {
      console.error('Error saving todo:', err)
      setError('儲存任務時發生錯誤')
    }
  }

  const handleCancel = () => {
    onClose()
  }

  if (!isOpen || !todo) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content todo-edit-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>📝 編輯任務</h3>
          <button className="close-button" onClick={onClose}>✕</button>
        </div>

        <div className="todo-edit-form">
          {error && (
            <div className="error-message" style={{ color: 'red', marginBottom: '16px' }}>
              ⚠️ {error}
            </div>
          )}
          
          <div className="form-group">
            <label htmlFor="task-text">任務內容 *</label>
            <input
              id="task-text"
              type="text"
              value={formData.text}
              onChange={(e) => setFormData(prev => ({ ...prev, text: e.target.value }))}
              placeholder="輸入任務內容..."
              required
              autoFocus
              className="form-input"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="task-priority">優先級</label>
              <select
                id="task-priority"
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  priority: e.target.value as Priority 
                }))}
                className="form-select"
              >
                {Object.entries(PriorityConfigs).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.label}
                  </option>
                ))}
              </select>
              <small className="form-hint">
                {PriorityConfigs[formData.priority].actionHint}
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="task-project">所屬專案</label>
              <select
                id="task-project"
                value={formData.projectId}
                onChange={(e) => setFormData(prev => ({ ...prev, projectId: e.target.value }))}
                className="form-select"
              >
                <option value="">無專案</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="task-due-date">截止日期</label>
              <input
                id="task-due-date"
                type="datetime-local"
                value={formData.dueDate}
                onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                className="form-input"
              />
              <small className="form-hint">
                設置截止日期後，任務會在行事曆中顯示
              </small>
            </div>
            
            <div className="form-group">
              <label htmlFor="task-pomodoros">預估番茄鐘數</label>
              <input
                id="task-pomodoros"
                type="number"
                min="1"
                max="50"
                value={formData.totalPomodoros}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  totalPomodoros: Math.max(1, parseInt(e.target.value) || 1)
                }))}
                className="form-input"
              />
              <small className="form-hint">
                每個番茄鐘為 25 分鐘的專注時間
              </small>
            </div>
          </div>

          <div className="form-group">
            <div className="task-status">
              <label>
                <input
                  type="checkbox"
                  checked={todo.completed}
                  readOnly
                  disabled
                />
                任務狀態：{todo.completed ? '✅ 已完成' : '⏳ 進行中'}
              </label>
            </div>
          </div>

          <div className="modal-actions">
            <MagicButton
              variant="secondary"
              onClick={handleCancel}
            >
              取消
            </MagicButton>
            <MagicButton
              variant="primary"
              disabled={!formData.text.trim()}
              onClick={handleSubmit}
            >
              保存變更
            </MagicButton>
          </div>
        </div>
      </div>
    </div>
  )
}