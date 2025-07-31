/**
 * TimeSlot - Individual time slot component for timeline
 * Part of MVP Implementation Guide Week 2 Day 3-4
 */

import React, { useState, useRef } from 'react'
import type { ScheduleItem } from '../../types/mvp-scheduling'
import { MagicButton } from '../MagicButton'

interface TimeSlotProps {
  item: ScheduleItem
  isCurrent?: boolean
  isPast?: boolean
  isUpcoming?: boolean
  viewMode?: 'compact' | 'detailed'
  onStatusChange?: (itemId: string, status: any) => void
  onTimeChange?: (itemId: string, newTime: string) => void
  showConnector?: boolean
  className?: string
  isDraggable?: boolean
}

export const TimeSlot: React.FC<TimeSlotProps> = ({
  item,
  isCurrent = false,
  isPast = false,
  isUpcoming = false,
  viewMode = 'detailed',
  onStatusChange,
  onTimeChange,
  showConnector = false,
  className = '',
  isDraggable = true
}) => {
  const [isHovered, setIsHovered] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const dragRef = useRef<HTMLDivElement>(null)

  // Calculate end time (assuming 25-minute pomodoros, 5-minute breaks)
  const getEndTime = (startTime: string, type: string): string => {
    const [hours, minutes] = startTime.split(':').map(Number)
    const duration = type === 'pomodoro' ? 25 : type === 'break' ? 5 : 15
    const totalMinutes = hours * 60 + minutes + duration
    const endHours = Math.floor(totalMinutes / 60)
    const endMinutes = totalMinutes % 60
    return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`
  }

  // Get status-specific styling
  const getStatusClass = (): string => {
    const classes = []
    
    if (isCurrent) classes.push('current')
    else if (isPast) classes.push('past')
    else if (isUpcoming) classes.push('upcoming')
    
    if (item.status === 'completed') classes.push('completed')
    else if (item.status === 'in_progress') classes.push('in-progress')
    else if (item.status === 'missed') classes.push('missed')
    else classes.push('scheduled')
    
    return classes.join(' ')
  }

  // Get type-specific icon and color
  const getTypeInfo = () => {
    switch (item.type) {
      case 'pomodoro':
        return { icon: '🍅', color: '#e74c3c', label: '番茄鐘' }
      case 'break':
        return { icon: '☕', color: '#3498db', label: '短休息' }
      case 'buffer':
        return { icon: '⏳', color: '#95a5a6', label: '緩衝時間' }
      default:
        return { icon: '📝', color: '#9b59b6', label: '任務' }
    }
  }

  const typeInfo = getTypeInfo()
  const endTime = getEndTime(item.time, item.type)

  // Handle status change
  const handleStatusChange = (newStatus: string) => {
    if (onStatusChange) {
      onStatusChange(item.id, newStatus)
    }
  }

  // Handle start/complete actions
  const handleStart = () => {
    handleStatusChange('in_progress')
  }

  const handleComplete = () => {
    handleStatusChange('completed')
  }

  const handleSkip = () => {
    handleStatusChange('missed')
  }

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent) => {
    if (!isDraggable || isCurrent || item.status === 'in_progress') return
    
    setIsDragging(true)
    e.dataTransfer.setData('text/plain', JSON.stringify({
      itemId: item.id,
      originalTime: item.time,
      taskTitle: item.task.title
    }))
    e.dataTransfer.effectAllowed = 'move'
    
    // Set drag image
    if (dragRef.current) {
      const dragImage = dragRef.current.cloneNode(true) as HTMLElement
      dragImage.style.transform = 'rotate(5deg)'
      dragImage.style.opacity = '0.8'
      e.dataTransfer.setDragImage(dragImage, 50, 20)
    }
  }

  const handleDragEnd = () => {
    setIsDragging(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    if (!isDraggable) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    try {
      const dragData = JSON.parse(e.dataTransfer.getData('text/plain'))
      const { itemId, originalTime } = dragData
      
      if (itemId !== item.id && onTimeChange) {
        // Calculate new time based on drop position
        const newTime = calculateDropTime(e, item.time)
        onTimeChange(itemId, newTime)
      }
    } catch (error) {
      console.error('Error handling drop:', error)
    }
  }

  const calculateDropTime = (e: React.DragEvent, targetTime: string): string => {
    // Simple implementation - use target time
    // In a more sophisticated version, we could calculate based on mouse position
    return targetTime
  }

  return (
    <div 
      ref={dragRef}
      className={`time-slot ${getStatusClass()} ${viewMode} ${className} ${isDragging ? 'dragging' : ''} ${isDragOver ? 'drag-over' : ''}`}
      draggable={isDraggable && !isCurrent && item.status !== 'in_progress'}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag Handle */}
      {isDraggable && !isCurrent && item.status !== 'in_progress' && (
        <div className="drag-handle" title="拖拽來重新安排時間">
          <span className="drag-dots">⋮⋮</span>
        </div>
      )}

      {/* Time Indicator */}
      <div className="time-indicator">
        <div 
          className="time-dot"
          style={{ backgroundColor: typeInfo.color }}
        >
          <span className="time-icon">{typeInfo.icon}</span>
        </div>
        <div className="time-info">
          <div className="time-range">
            {item.time} - {endTime}
          </div>
          {viewMode === 'detailed' && (
            <div className="time-duration">
              {item.type === 'pomodoro' ? '25分鐘' : item.type === 'break' ? '5分鐘' : '15分鐘'}
            </div>
          )}
        </div>
      </div>

      {/* Task Content */}
      <div className="slot-content">
        <div className="task-info">
          <h3 className="task-title">
            {item.task.title}
          </h3>
          
          {viewMode === 'detailed' && (
            <div className="task-meta">
              <span className="task-type">{typeInfo.label}</span>
              {item.task.projectId && (
                <span className="task-project">📁 專案</span>
              )}
            </div>
          )}
        </div>

        {/* Status Actions */}
        {viewMode === 'detailed' && (isCurrent || isHovered) && (
          <div className="slot-actions">
            {item.status === 'scheduled' && isCurrent && (
              <MagicButton
                size="small"
                variant="primary"
                onClick={handleStart}
              >
                開始
              </MagicButton>
            )}
            
            {item.status === 'in_progress' && (
              <>
                <MagicButton
                  size="small"
                  variant="success"
                  onClick={handleComplete}
                >
                  完成
                </MagicButton>
                <MagicButton
                  size="small"
                  variant="secondary"
                  onClick={handleSkip}
                >
                  跳過
                </MagicButton>
              </>
            )}
            
            {item.status === 'scheduled' && isUpcoming && (
              <MagicButton
                size="small"
                variant="outline"
                onClick={handleSkip}
              >
                跳過
              </MagicButton>
            )}
          </div>
        )}
      </div>

      {/* Status Badge */}
      <div className="status-badge">
        {item.status === 'completed' && <span className="status-icon">✅</span>}
        {item.status === 'in_progress' && <span className="status-icon">🔄</span>}
        {item.status === 'missed' && <span className="status-icon">❌</span>}
        {item.status === 'scheduled' && isCurrent && <span className="status-icon pulse">⏰</span>}
        {item.status === 'scheduled' && isUpcoming && <span className="status-icon">⏳</span>}
        {item.status === 'scheduled' && isPast && <span className="status-icon">⏸️</span>}
      </div>

      {/* Connection Line */}
      {showConnector && (
        <div className="slot-connector">
          <div className="connector-line" />
        </div>
      )}

      {/* Current Time Indicator */}
      {isCurrent && (
        <div className="current-indicator">
          <div className="current-pulse" />
          <span className="current-label">進行中</span>
        </div>
      )}
    </div>
  )
}