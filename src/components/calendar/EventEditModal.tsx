/**
 * EventEditModal - 事件編輯模態框組件
 * 用於編輯和創建行事曆事件
 */

import React, { useState, useEffect } from 'react'
import { MagicButton } from '../MagicButton'
import { useProjects } from '../../context/ProjectContext'
import type { CalendarEvent } from '../../types/calendar'

interface EventEditModalProps {
  event: CalendarEvent | null
  isOpen: boolean
  onClose: () => void
  onSave: (id: string, updates: Partial<CalendarEvent>) => void
  onDelete?: (id: string) => void
  mode?: 'edit' | 'create'
}

const EVENT_TYPES = [
  { value: 'deadline', label: '🎯 截止日期', description: '任務或專案的最後期限' },
  { value: 'meeting', label: '👥 會議', description: '團隊會議或討論' },
  { value: 'work_block', label: '🕒 工作時段', description: '專注工作的時間區塊' },
  { value: 'reminder', label: '🔔 提醒', description: '重要事項提醒' },
  { value: 'milestone', label: '🏁 里程碑', description: '專案重要節點' }
] as const

const EVENT_STATUS = [
  { value: 'scheduled', label: '🟢 已安排', description: '事件已排程' },
  { value: 'in_progress', label: '🔄 進行中', description: '事件正在進行' },
  { value: 'completed', label: '✅ 已完成', description: '事件已完成' },
  { value: 'cancelled', label: '❌ 已取消', description: '事件已取消' }
] as const

const REMINDER_OPTIONS = [
  { value: 5, label: '5 分鐘前' },
  { value: 15, label: '15 分鐘前' },
  { value: 30, label: '30 分鐘前' },
  { value: 60, label: '1 小時前' },
  { value: 1440, label: '1 天前' },
  { value: 2880, label: '2 天前' },
  { value: 10080, label: '1 週前' }
]

export const EventEditModal: React.FC<EventEditModalProps> = ({
  event,
  isOpen,
  onClose,
  onSave,
  onDelete,
  mode = 'edit'
}) => {
  const { projects } = useProjects()
  const [error, setError] = useState<string>()

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'work_block' as CalendarEvent['type'],
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    allDay: false,
    projectId: '',
    status: 'scheduled' as CalendarEvent['status'],
    reminderMinutes: [30], // 預設 30 分鐘前提醒
    recurrenceType: 'none' as 'none' | 'daily' | 'weekly' | 'monthly',
    recurrenceInterval: 1,
    recurrenceEndDate: ''
  })

  // 初始化表單數據
  useEffect(() => {
    if (event && mode === 'edit') {
      const startDate = new Date(event.startDate)
      const endDate = event.endDate ? new Date(event.endDate) : startDate

      setFormData({
        title: event.title,
        description: event.description || '',
        type: event.type,
        startDate: startDate.toISOString().slice(0, 10), // YYYY-MM-DD
        startTime: event.allDay ? '' : startDate.toTimeString().slice(0, 5), // HH:MM
        endDate: endDate.toISOString().slice(0, 10),
        endTime: event.allDay ? '' : endDate.toTimeString().slice(0, 5),
        allDay: event.allDay,
        projectId: event.projectId || '',
        status: event.status,
        reminderMinutes: event.reminders.map(r => r.minutesBefore),
        recurrenceType: event.recurrence?.type || 'none',
        recurrenceInterval: event.recurrence?.interval || 1,
        recurrenceEndDate: event.recurrence?.endDate 
          ? new Date(event.recurrence.endDate).toISOString().slice(0, 10) 
          : ''
      })
    } else if (mode === 'create') {
      // 創建模式的預設值
      const now = new Date()
      const defaultStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + 1, 0)
      const defaultEnd = new Date(defaultStart.getTime() + 60 * 60 * 1000) // 1小時後

      setFormData({
        title: '',
        description: '',
        type: 'work_block',
        startDate: defaultStart.toISOString().slice(0, 10),
        startTime: defaultStart.toTimeString().slice(0, 5),
        endDate: defaultEnd.toISOString().slice(0, 10),
        endTime: defaultEnd.toTimeString().slice(0, 5),
        allDay: false,
        projectId: '',
        status: 'scheduled',
        reminderMinutes: [30],
        recurrenceType: 'none',
        recurrenceInterval: 1,
        recurrenceEndDate: ''
      })
    }

    setError(undefined)
  }, [event, mode, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(undefined)

    try {
      // 驗證必填欄位
      if (!formData.title.trim()) {
        setError('請輸入事件標題')
        return
      }

      // 構建開始和結束時間
      let startDate: Date
      let endDate: Date | undefined

      if (formData.allDay) {
        startDate = new Date(`${formData.startDate}T00:00:00`)
        endDate = formData.endDate 
          ? new Date(`${formData.endDate}T23:59:59`)
          : undefined
      } else {
        if (!formData.startTime) {
          setError('請選擇開始時間')
          return
        }
        startDate = new Date(`${formData.startDate}T${formData.startTime}:00`)
        endDate = formData.endDate && formData.endTime
          ? new Date(`${formData.endDate}T${formData.endTime}:00`)
          : undefined
      }

      // 驗證時間邏輯
      if (endDate && endDate <= startDate) {
        setError('結束時間必須晚於開始時間')
        return
      }

      // 構建更新數據
      const updates: Partial<CalendarEvent> = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        type: formData.type,
        startDate,
        endDate,
        allDay: formData.allDay,
        projectId: formData.projectId || undefined,
        status: formData.status,
        reminders: formData.reminderMinutes.map(minutes => ({
          type: 'popup' as const,
          minutesBefore: minutes
        })),
        recurrence: formData.recurrenceType !== 'none' ? {
          type: formData.recurrenceType as 'daily' | 'weekly' | 'monthly',
          interval: formData.recurrenceInterval,
          endDate: formData.recurrenceEndDate 
            ? new Date(`${formData.recurrenceEndDate}T23:59:59`)
            : undefined
        } : undefined,
        updatedAt: new Date()
      }

      if (mode === 'edit' && event) {
        onSave(event.id, updates)
      } else {
        // 創建新事件（需要在父組件中處理）
        onSave('new', updates)
      }

      onClose()
    } catch (err) {
      console.error('Error saving event:', err)
      setError('儲存事件時發生錯誤')
    }
  }

  const handleDelete = () => {
    if (event && onDelete) {
      const confirmed = window.confirm(`確定要刪除事件「${event.title}」嗎？`)
      if (confirmed) {
        onDelete(event.id)
        onClose()
      }
    }
  }

  const handleReminderChange = (minutes: number, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        reminderMinutes: [...prev.reminderMinutes, minutes].sort((a, b) => a - b)
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        reminderMinutes: prev.reminderMinutes.filter(m => m !== minutes)
      }))
    }
  }

  if (!isOpen) return null

  return (
    <div className="event-edit-modal-overlay" onClick={onClose}>
      <div className="event-edit-modal" onClick={(e) => e.stopPropagation()}>
        <div className="event-edit-modal__header">
          <h3>
            {mode === 'create' ? '📅 新增事件' : '✏️ 編輯事件'}
          </h3>
          <button
            className="event-edit-modal__close"
            onClick={onClose}
            type="button"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="event-edit-form">
          {error && (
            <div className="event-edit-error">
              ⚠️ {error}
            </div>
          )}

          {/* 基本信息 */}
          <div className="form-section">
            <h4>📝 基本信息</h4>
            
            <div className="form-group">
              <label htmlFor="event-title">事件標題 *</label>
              <input
                id="event-title"
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="輸入事件標題..."
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="event-description">描述</label>
              <textarea
                id="event-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="輸入事件描述（可選）..."
                className="form-textarea"
                rows={3}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="event-type">事件類型</label>
                <select
                  id="event-type"
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as CalendarEvent['type'] }))}
                  className="form-select"
                >
                  {EVENT_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="event-status">狀態</label>
                <select
                  id="event-status"
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as CalendarEvent['status'] }))}
                  className="form-select"
                >
                  {EVENT_STATUS.map(status => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {projects.length > 0 && (
              <div className="form-group">
                <label htmlFor="event-project">關聯專案</label>
                <select
                  id="event-project"
                  value={formData.projectId}
                  onChange={(e) => setFormData(prev => ({ ...prev, projectId: e.target.value }))}
                  className="form-select"
                >
                  <option value="">無關聯專案</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.icon} {project.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* 時間設定 */}
          <div className="form-section">
            <h4>⏰ 時間設定</h4>
            
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.allDay}
                  onChange={(e) => setFormData(prev => ({ ...prev, allDay: e.target.checked }))}
                />
                <span className="checkbox-text">全天事件</span>
              </label>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="start-date">開始日期 *</label>
                <input
                  id="start-date"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  className="form-input"
                  required
                />
              </div>

              {!formData.allDay && (
                <div className="form-group">
                  <label htmlFor="start-time">開始時間</label>
                  <input
                    id="start-time"
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                    className="form-input"
                  />
                </div>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="end-date">結束日期</label>
                <input
                  id="end-date"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  className="form-input"
                />
              </div>

              {!formData.allDay && (
                <div className="form-group">
                  <label htmlFor="end-time">結束時間</label>
                  <input
                    id="end-time"
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                    className="form-input"
                  />
                </div>
              )}
            </div>
          </div>

          {/* 提醒設定 */}
          <div className="form-section">
            <h4>🔔 提醒設定</h4>
            
            <div className="reminder-options">
              {REMINDER_OPTIONS.map(option => (
                <label key={option.value} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.reminderMinutes.includes(option.value)}
                    onChange={(e) => handleReminderChange(option.value, e.target.checked)}
                  />
                  <span className="checkbox-text">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 重複設定 */}
          <div className="form-section">
            <h4>🔄 重複設定</h4>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="recurrence-type">重複類型</label>
                <select
                  id="recurrence-type"
                  value={formData.recurrenceType}
                  onChange={(e) => setFormData(prev => ({ ...prev, recurrenceType: e.target.value as any }))}
                  className="form-select"
                >
                  <option value="none">不重複</option>
                  <option value="daily">每日</option>
                  <option value="weekly">每週</option>
                  <option value="monthly">每月</option>
                </select>
              </div>

              {formData.recurrenceType !== 'none' && (
                <>
                  <div className="form-group">
                    <label htmlFor="recurrence-interval">間隔</label>
                    <input
                      id="recurrence-interval"
                      type="number"
                      min="1"
                      max="30"
                      value={formData.recurrenceInterval}
                      onChange={(e) => setFormData(prev => ({ ...prev, recurrenceInterval: parseInt(e.target.value) || 1 }))}
                      className="form-input"
                    />
                  </div>
                </>
              )}
            </div>

            {formData.recurrenceType !== 'none' && (
              <div className="form-group">
                <label htmlFor="recurrence-end">重複結束日期</label>
                <input
                  id="recurrence-end"
                  type="date"
                  value={formData.recurrenceEndDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, recurrenceEndDate: e.target.value }))}
                  className="form-input"
                  min={formData.startDate}
                />
              </div>
            )}
          </div>

          {/* 操作按鈕 */}
          <div className="event-edit-modal__actions">
            <div className="actions-left">
              {mode === 'edit' && onDelete && (
                <MagicButton
                  type="button"
                  variant="danger"
                  size="medium"
                  onClick={handleDelete}
                >
                  🗑️ 刪除事件
                </MagicButton>
              )}
            </div>
            
            <div className="actions-right">
              <MagicButton
                type="button"
                variant="secondary"
                size="medium"
                onClick={onClose}
              >
                取消
              </MagicButton>
              
              <MagicButton
                type="submit"
                variant="primary"
                size="medium"
              >
                {mode === 'create' ? '✅ 創建事件' : '💾 保存變更'}
              </MagicButton>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EventEditModal