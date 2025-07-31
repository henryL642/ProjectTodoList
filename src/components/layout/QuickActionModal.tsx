import React, { useState, useEffect } from 'react'
import { MagicButton } from '../MagicButton'
import { useProjects } from '../../context/ProjectContext'
import { preferencesManager } from '../../utils/preferencesManager'
// import { useCalendar } from '../../context/CalendarContext'
import type { Project } from '../../types/project'
import type { CalendarEvent } from '../../types/calendar'
import { Priority, PriorityConfigs, convertOldPriority } from '../../types/priority'

type ActionType = 'addTask' | 'addProject' | 'addEvent'

interface QuickActionModalProps {
  isOpen: boolean
  actionType: ActionType | null
  onClose: () => void
  onTaskAdd?: (task: { text: string; projectId?: string; priority?: Priority | 'low' | 'medium' | 'high'; dueDate?: string; totalPomodoros?: number }) => void
  onProjectAdd?: (project: Partial<Project>) => void
  onEventAdd?: (event: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>) => void
}

export const QuickActionModal: React.FC<QuickActionModalProps> = ({
  isOpen,
  actionType,
  onClose,
  onTaskAdd,
  onProjectAdd,
  onEventAdd
}) => {
  const { projects, currentProject } = useProjects()
  // const { addEvent } = useCalendar()

  // 獲取默認值
  const getDefaults = () => {
    const prefs = preferencesManager.getPreferences()
    // Convert old priority format if needed
    let priority = prefs.defaultPriority
    if (typeof priority === 'string' && ['low', 'medium', 'high'].includes(priority)) {
      priority = convertOldPriority(priority)
    }
    return {
      priority: priority || Priority.IMPORTANT_NOT_URGENT,
      projectId: prefs.defaultProjectId || currentProject?.id || ''
    }
  }

  // 任務表單狀態
  const [taskForm, setTaskForm] = useState({
    text: '',
    projectId: getDefaults().projectId,
    priority: getDefaults().priority,
    dueDate: '',
    totalPomodoros: 1
  })

  // 專案表單狀態
  const [projectForm, setProjectForm] = useState({
    name: '',
    description: '',
    color: '#667eea',
    icon: '📁',
    dueDate: ''
  })

  // 事件表單狀態
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    type: 'reminder' as CalendarEvent['type'],
    startDate: new Date().toISOString().slice(0, 16),
    allDay: false
  })

  // 重置表單
  useEffect(() => {
    if (isOpen) {
      const defaults = getDefaults()
      setTaskForm({
        text: '',
        projectId: defaults.projectId,
        priority: defaults.priority,
        dueDate: '',
        totalPomodoros: 1
      })
      setProjectForm({
        name: '',
        description: '',
        color: '#667eea',
        icon: '📁',
        dueDate: ''
      })
      setEventForm({
        title: '',
        description: '',
        type: 'reminder',
        startDate: new Date().toISOString().slice(0, 16),
        allDay: false
      })
    }
  }, [isOpen, currentProject])

  // ESC 鍵關閉
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    
    if (isOpen) {
      window.addEventListener('keydown', handleEsc)
      return () => window.removeEventListener('keydown', handleEsc)
    }
  }, [isOpen, onClose])

  const handleTaskSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (taskForm.text.trim() && onTaskAdd) {
      // Use the form's selected project, or fall back to current project
      // Make sure empty string is treated as no selection
      const selectedProjectId = taskForm.projectId?.trim() || null
      const projectIdToUse = selectedProjectId || currentProject?.id
      
      
      onTaskAdd({
        text: taskForm.text.trim(),
        projectId: projectIdToUse,
        priority: taskForm.priority,
        dueDate: taskForm.dueDate || undefined,
        totalPomodoros: taskForm.totalPomodoros
      })
      onClose()
    }
  }

  const handleProjectSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (projectForm.name.trim() && onProjectAdd) {
      onProjectAdd({
        name: projectForm.name.trim(),
        description: projectForm.description.trim() || undefined,
        color: projectForm.color,
        icon: projectForm.icon
      })
      onClose()
    }
  }

  // 統一的按鈕點擊處理，避免重複調用
  const handleTaskButtonSubmit = () => {
    handleTaskSubmit()
  }

  const handleProjectButtonSubmit = () => {
    handleProjectSubmit()
  }

  const handleEventSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (eventForm.title.trim() && onEventAdd) {
      onEventAdd({
        userId: '', // 將在父組件中設置
        title: eventForm.title.trim(),
        description: eventForm.description.trim() || undefined,
        type: eventForm.type,
        startDate: new Date(eventForm.startDate),
        allDay: eventForm.allDay,
        reminders: [{ type: 'popup', minutesBefore: 15 }],
        status: 'scheduled'
      })
      onClose()
    }
  }

  const renderTaskForm = () => (
    <div className="quick-action-form">
      <div className="quick-action-form__header">
        <h3>➕ 新增任務</h3>
        <p>快速添加待辦事項到您的任務列表</p>
      </div>

      <div className="form-group">
        <label className="form-label">任務內容 *</label>
        <input
          type="text"
          className="form-input"
          placeholder="今天要做什麼？"
          value={taskForm.text}
          onChange={(e) => setTaskForm(prev => ({ ...prev, text: e.target.value }))}
          autoFocus
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">專案</label>
          <select
            className="form-select"
            value={taskForm.projectId}
            onChange={(e) => setTaskForm(prev => ({ ...prev, projectId: e.target.value }))}
          >
            <option value="">選擇專案（可選）</option>
            {projects.map(project => (
              <option key={project.id} value={project.id}>
                {project.icon} {project.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">優先級</label>
          <select
            className="form-select"
            value={taskForm.priority}
            onChange={(e) => setTaskForm(prev => ({ ...prev, priority: e.target.value as Priority }))}
          >
            {Object.entries(PriorityConfigs).map(([key, config]) => (
              <option key={key} value={key}>
                {config.icon} {config.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">截止日期（可選）</label>
        <input
          type="date"
          className="form-input"
          value={taskForm.dueDate}
          onChange={(e) => setTaskForm(prev => ({ ...prev, dueDate: e.target.value }))}
        />
      </div>

      <div className="form-actions">
        <MagicButton variant="primary" disabled={!taskForm.text.trim()} onClick={handleTaskButtonSubmit}>
          ✅ 添加任務
        </MagicButton>
        <MagicButton variant="secondary" onClick={onClose}>
          取消
        </MagicButton>
      </div>
    </div>
  )

  const renderProjectForm = () => (
    <div className="quick-action-form">
      <div className="quick-action-form__header">
        <h3>📂 新建專案</h3>
        <p>創建新的工作專案來組織您的任務</p>
      </div>

      <div className="form-group">
        <label className="form-label">專案名稱 *</label>
        <input
          type="text"
          className="form-input"
          placeholder="輸入專案名稱"
          value={projectForm.name}
          onChange={(e) => setProjectForm(prev => ({ ...prev, name: e.target.value }))}
          autoFocus
        />
      </div>

      <div className="form-group">
        <label className="form-label">專案描述</label>
        <textarea
          className="form-textarea"
          placeholder="簡單描述這個專案的目標"
          rows={3}
          value={projectForm.description}
          onChange={(e) => setProjectForm(prev => ({ ...prev, description: e.target.value }))}
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">圖標</label>
          <select
            className="form-select"
            value={projectForm.icon}
            onChange={(e) => setProjectForm(prev => ({ ...prev, icon: e.target.value }))}
          >
            <option value="📁">📁 文件夾</option>
            <option value="💼">💼 工作</option>
            <option value="🎯">🎯 目標</option>
            <option value="🚀">🚀 項目</option>
            <option value="💡">💡 創意</option>
            <option value="🏗️">🏗️ 建設</option>
            <option value="🎨">🎨 設計</option>
            <option value="💻">💻 開發</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">顏色主題</label>
          <input
            type="color"
            className="form-color"
            value={projectForm.color}
            onChange={(e) => setProjectForm(prev => ({ ...prev, color: e.target.value }))}
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">截止日期（可選）</label>
        <input
          type="date"
          className="form-input"
          value={projectForm.dueDate}
          onChange={(e) => setProjectForm(prev => ({ ...prev, dueDate: e.target.value }))}
        />
      </div>

      <div className="form-actions">
        <MagicButton variant="primary" disabled={!projectForm.name.trim()} onClick={handleProjectButtonSubmit}>
          🎯 創建專案
        </MagicButton>
        <MagicButton variant="secondary" onClick={onClose}>
          取消
        </MagicButton>
      </div>
    </div>
  )

  const renderEventForm = () => (
    <form onSubmit={handleEventSubmit} className="quick-action-form">
      <div className="quick-action-form__header">
        <h3>📅 添加事件</h3>
        <p>安排會議、提醒或其他重要事件</p>
      </div>

      <div className="form-group">
        <label className="form-label">事件標題 *</label>
        <input
          type="text"
          className="form-input"
          placeholder="會議主題或事件名稱"
          value={eventForm.title}
          onChange={(e) => setEventForm(prev => ({ ...prev, title: e.target.value }))}
          autoFocus
        />
      </div>

      <div className="form-group">
        <label className="form-label">事件描述</label>
        <textarea
          className="form-textarea"
          placeholder="會議議程或詳細說明"
          rows={3}
          value={eventForm.description}
          onChange={(e) => setEventForm(prev => ({ ...prev, description: e.target.value }))}
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">事件類型</label>
          <select
            className="form-select"
            value={eventForm.type}
            onChange={(e) => setEventForm(prev => ({ ...prev, type: e.target.value as CalendarEvent['type'] }))}
          >
            <option value="reminder">🔔 提醒</option>
            <option value="meeting">👥 會議</option>
            <option value="work_block">🕒 工作時段</option>
            <option value="deadline">🎯 截止日期</option>
            <option value="milestone">🏁 里程碑</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">
            <input
              type="checkbox"
              checked={eventForm.allDay}
              onChange={(e) => setEventForm(prev => ({ ...prev, allDay: e.target.checked }))}
            />
            全天事件
          </label>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">開始時間</label>
        <input
          type={eventForm.allDay ? "date" : "datetime-local"}
          className="form-input"
          value={eventForm.allDay ? eventForm.startDate.slice(0, 10) : eventForm.startDate}
          onChange={(e) => setEventForm(prev => ({ ...prev, startDate: e.target.value }))}
        />
      </div>

      <div className="form-actions">
        <MagicButton variant="primary" disabled={!eventForm.title.trim()} onClick={() => handleEventSubmit({ preventDefault: () => {} } as React.FormEvent)}>
          📅 添加事件
        </MagicButton>
        <MagicButton variant="secondary" onClick={onClose}>
          取消
        </MagicButton>
      </div>
    </form>
  )

  if (!isOpen || !actionType) return null

  const getModalContent = () => {
    switch (actionType) {
      case 'addTask':
        return renderTaskForm()
      case 'addProject':
        return renderProjectForm()
      case 'addEvent':
        return renderEventForm()
      default:
        return null
    }
  }

  return (
    <div className="quick-action-modal-overlay" onClick={onClose}>
      <div className="quick-action-modal" onClick={(e) => e.stopPropagation()}>
        <button className="quick-action-modal__close" onClick={onClose}>
          ✕
        </button>
        {getModalContent()}
      </div>
    </div>
  )
}