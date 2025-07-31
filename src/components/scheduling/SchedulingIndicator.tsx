/**
 * SchedulingIndicator - Shows scheduling status for todos
 * Part of MVP Implementation Guide Day 3-4
 */

import React from 'react'
import { PriorityConfigs, shouldAutoSchedule } from '../../types/priority'
import type { Todo } from '../../types/todo'

interface SchedulingIndicatorProps {
  todo: Todo
  showDetails?: boolean
  className?: string
}

export const SchedulingIndicator: React.FC<SchedulingIndicatorProps> = ({
  todo,
  showDetails = false,
  className = ''
}) => {
  const hasScheduledSlots = todo.scheduledSlots && todo.scheduledSlots.length > 0
  const canAutoSchedule = shouldAutoSchedule(todo.priority)
  const priorityConfig = PriorityConfigs[todo.priority]

  // Calculate scheduling status
  const getSchedulingStatus = () => {
    if (hasScheduledSlots) {
      const scheduledCount = todo.scheduledSlots!.length
      const totalNeeded = todo.totalPomodoros
      const isFullyScheduled = scheduledCount >= totalNeeded
      
      return {
        type: isFullyScheduled ? 'fully-scheduled' : 'partially-scheduled',
        icon: isFullyScheduled ? '✅' : '⏰',
        text: `${scheduledCount}/${totalNeeded} 已排程`,
        color: isFullyScheduled ? '#4CAF50' : '#FF9800'
      }
    }
    
    if (canAutoSchedule) {
      return {
        type: 'can-schedule',
        icon: '📅',
        text: '可自動排程',
        color: '#2196F3'
      }
    }
    
    return {
      type: 'manual-only',
      icon: '⚪',
      text: '手動安排',
      color: '#9E9E9E'
    }
  }

  const status = getSchedulingStatus()

  if (!showDetails) {
    return (
      <span 
        className={`scheduling-indicator ${className}`}
        style={{ color: status.color }}
        title={status.text}
      >
        {status.icon}
      </span>
    )
  }

  return (
    <div className={`scheduling-indicator-detailed ${className}`}>
      <div className="scheduling-status">
        <span 
          className="status-icon"
          style={{ color: status.color }}
        >
          {status.icon}
        </span>
        <span className="status-text">{status.text}</span>
      </div>
      
      {hasScheduledSlots && (
        <div className="scheduling-details">
          <div className="pomodoro-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ 
                  width: `${(todo.scheduledSlots!.length / todo.totalPomodoros) * 100}%`,
                  backgroundColor: status.color
                }}
              />
            </div>
            <span className="progress-text">
              {todo.scheduledSlots!.length}/{todo.totalPomodoros} 番茄鐘
            </span>
          </div>
          
          {todo.scheduledSlots!.length > 0 && (
            <div className="next-session">
              <span className="next-label">下次:</span>
              <span className="next-time">
                {todo.scheduledSlots![0].startTime} - {todo.scheduledSlots![0].endTime}
              </span>
            </div>
          )}
        </div>
      )}
      
      <div className="priority-info">
        <span 
          className="priority-label"
          style={{ color: priorityConfig.color }}
        >
          {priorityConfig.label}
        </span>
      </div>
    </div>
  )
}

// Component for showing today's schedule summary
interface TodayScheduleSummaryProps {
  className?: string
}

export const TodayScheduleSummary: React.FC<TodayScheduleSummaryProps> = ({ 
  className = '' 
}) => {
  // This would integrate with useScheduling to show today's schedule
  // For now, it's a placeholder
  return (
    <div className={`today-schedule-summary ${className}`}>
      <h3>🗓️ 今日排程</h3>
      <div className="schedule-summary">
        <div className="summary-item">
          <span className="summary-label">預定番茄鐘:</span>
          <span className="summary-value">0</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">已完成:</span>
          <span className="summary-value">0</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">剩餘:</span>
          <span className="summary-value">0</span>
        </div>
      </div>
    </div>
  )
}

// Quick action button for scheduling
interface QuickScheduleButtonProps {
  todo: Todo
  onSchedule: (todoId: string) => Promise<void>
  disabled?: boolean
  className?: string
}

export const QuickScheduleButton: React.FC<QuickScheduleButtonProps> = ({
  todo,
  onSchedule,
  disabled = false,
  className = ''
}) => {
  const hasScheduledSlots = todo.scheduledSlots && todo.scheduledSlots.length > 0
  const canAutoSchedule = shouldAutoSchedule(todo.priority)

  const handleClick = async () => {
    if (!disabled && canAutoSchedule) {
      await onSchedule(todo.id)
    }
  }

  if (hasScheduledSlots) {
    return (
      <button 
        className={`quick-schedule-button scheduled ${className}`}
        disabled
        title="已排程"
      >
        ✅ 已排程
      </button>
    )
  }

  if (!canAutoSchedule) {
    return (
      <button 
        className={`quick-schedule-button manual ${className}`}
        disabled
        title="此優先級不支援自動排程"
      >
        ⚪ 手動安排
      </button>
    )
  }

  return (
    <button 
      className={`quick-schedule-button schedulable ${className}`}
      onClick={handleClick}
      disabled={disabled}
      title="點擊自動排程"
    >
      📅 排程
    </button>
  )
}