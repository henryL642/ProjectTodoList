/**
 * TimelineStatusManager - Enhanced status management for timeline components
 * Part of MVP Implementation Guide Week 2 Day 3-4
 */

import React, { useCallback, useState } from 'react'
import { useScheduling } from '../../context/SchedulingContext'
import { useTodosWithScheduling } from '../../hooks/useTodosWithScheduling'
import { PomodoroSlotStatus } from '../../types/mvp-scheduling'

interface TimelineStatusManagerProps {
  children: (props: TimelineStatusManagerChildProps) => React.ReactNode
}

interface TimelineStatusManagerChildProps {
  handleStatusChange: (itemId: string, newStatus: string) => Promise<void>
  isUpdating: boolean
  lastUpdate: { itemId: string; status: string; timestamp: Date } | null
  updateHistory: Array<{ itemId: string; status: string; timestamp: Date }>
}

export const TimelineStatusManager: React.FC<TimelineStatusManagerProps> = ({ children }) => {
  const { scheduledSlots, setScheduledSlots } = useScheduling()
  const { editTodo, todosWithSchedulingStatus } = useTodosWithScheduling()
  const [isUpdating, setIsUpdating] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<{ itemId: string; status: string; timestamp: Date } | null>(null)
  const [updateHistory, setUpdateHistory] = useState<Array<{ itemId: string; status: string; timestamp: Date }>>([])

  /**
   * Handle status change for timeline items
   */
  const handleStatusChange = useCallback(async (itemId: string, newStatus: string) => {
    setIsUpdating(true)
    
    try {
      // Find the scheduled slot
      const slot = scheduledSlots.find(s => s.id === itemId)
      if (!slot) {
        console.warn('Slot not found:', itemId)
        return
      }

      // Map timeline status to pomodoro slot status
      const mappedStatus = mapTimelineStatusToPomodoroStatus(newStatus)
      
      // Update the scheduled slot
      const updatedSlots = scheduledSlots.map(s => 
        s.id === itemId 
          ? { 
              ...s, 
              status: mappedStatus,
              actualStart: newStatus === 'in_progress' ? new Date() : s.actualStart,
              actualEnd: newStatus === 'completed' ? new Date() : s.actualEnd
            }
          : s
      )
      
      setScheduledSlots(updatedSlots)

      // Update todo completion status if all pomodoros are completed
      const todo = todosWithSchedulingStatus.find(t => t.id === slot.todoId)
      if (todo && newStatus === 'completed') {
        const todoSlots = updatedSlots.filter(s => s.todoId === slot.todoId)
        const completedSlots = todoSlots.filter(s => s.status === PomodoroSlotStatus.COMPLETED)
        
        // Update todo's completed pomodoros count
        await editTodo(todo.id, {
          completedPomodoros: completedSlots.length,
          completed: completedSlots.length >= todo.totalPomodoros
        })
      }

      // Record the update
      const updateRecord = { itemId, status: newStatus, timestamp: new Date() }
      setLastUpdate(updateRecord)
      setUpdateHistory(prev => [updateRecord, ...prev.slice(0, 9)]) // Keep last 10 updates

      console.log(`✅ Status updated: ${itemId} → ${newStatus}`)
      
    } catch (error) {
      console.error('❌ Failed to update status:', error)
      // Revert UI state on error
      throw error
    } finally {
      setIsUpdating(false)
    }
  }, [scheduledSlots, setScheduledSlots, todosWithSchedulingStatus, editTodo])

  return (
    <>
      {children({
        handleStatusChange,
        isUpdating,
        lastUpdate,
        updateHistory
      })}
    </>
  )
}

/**
 * Map timeline status strings to PomodoroSlotStatus enum
 */
function mapTimelineStatusToPomodoroStatus(timelineStatus: string): PomodoroSlotStatus {
  switch (timelineStatus) {
    case 'scheduled':
      return PomodoroSlotStatus.SCHEDULED
    case 'in_progress':
      return PomodoroSlotStatus.IN_PROGRESS
    case 'completed':
      return PomodoroSlotStatus.COMPLETED
    case 'missed':
      return PomodoroSlotStatus.MISSED
    case 'cancelled':
      return PomodoroSlotStatus.CANCELLED
    default:
      return PomodoroSlotStatus.SCHEDULED
  }
}

/**
 * Enhanced Timeline View with integrated status management
 */
interface EnhancedTimelineViewProps {
  schedule: any[]
  currentTime?: string
  className?: string
  showStatusHistory?: boolean
}

export const EnhancedTimelineView: React.FC<EnhancedTimelineViewProps> = ({
  schedule,
  currentTime,
  className = '',
  showStatusHistory = false
}) => {
  return (
    <TimelineStatusManager>
      {({ handleStatusChange, isUpdating, lastUpdate, updateHistory }) => (
        <div className={`enhanced-timeline-view ${className}`}>
          {/* Status Update Indicator */}
          {isUpdating && (
            <div className="timeline-updating">
              <div className="updating-indicator">
                <span className="updating-spinner">🔄</span>
                <span>更新中...</span>
              </div>
            </div>
          )}

          {/* Last Update Info */}
          {lastUpdate && !isUpdating && (
            <div className="timeline-last-update">
              <span className="update-icon">✅</span>
              <span className="update-text">
                最近更新: {new Date(lastUpdate.timestamp).toLocaleTimeString()}
              </span>
            </div>
          )}

          {/* Timeline Component */}
          <div className="timeline-container">
            {schedule.map(item => (
              <EnhancedTimeSlot
                key={item.id}
                item={item}
                currentTime={currentTime}
                onStatusChange={handleStatusChange}
                isUpdating={isUpdating}
              />
            ))}
          </div>

          {/* Update History */}
          {showStatusHistory && updateHistory.length > 0 && (
            <div className="timeline-update-history">
              <h4>最近更新</h4>
              <div className="update-history-list">
                {updateHistory.slice(0, 5).map((update, index) => (
                  <div key={index} className="history-item">
                    <span className="history-time">
                      {new Date(update.timestamp).toLocaleTimeString()}
                    </span>
                    <span className="history-status">{update.status}</span>
                    <span className="history-item-id">{update.itemId.slice(-6)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </TimelineStatusManager>
  )
}

/**
 * Enhanced TimeSlot with better status management
 */
interface EnhancedTimeSlotProps {
  item: any
  currentTime?: string
  onStatusChange: (itemId: string, status: string) => Promise<void>
  isUpdating: boolean
}

const EnhancedTimeSlot: React.FC<EnhancedTimeSlotProps> = ({
  item,
  currentTime,
  onStatusChange,
  isUpdating
}) => {
  const [isProcessing, setIsProcessing] = useState(false)

  const handleStatusClick = async (newStatus: string) => {
    if (isUpdating || isProcessing) return
    
    setIsProcessing(true)
    try {
      await onStatusChange(item.id, newStatus)
    } catch (error) {
      console.error('Failed to change status:', error)
      // Could show error toast here
    } finally {
      setIsProcessing(false)
    }
  }

  const isCurrentSlot = currentTime && isTimeInRange(currentTime, item.time, 25)
  const isPastSlot = currentTime && isTimePast(currentTime, item.time, 25)
  const isUpcoming = !isCurrentSlot && !isPastSlot

  return (
    <div className={`enhanced-time-slot ${item.status} ${isCurrentSlot ? 'current' : isPastSlot ? 'past' : 'upcoming'}`}>
      <div className="slot-time">
        <div className="time-display">{item.time}</div>
        <div className="time-duration">25分鐘</div>
      </div>
      
      <div className="slot-content">
        <h3 className="slot-title">{item.task.title}</h3>
        <div className="slot-meta">
          {item.task.projectId && <span className="slot-project">📁 專案</span>}
          <span className="slot-type">🍅 番茄鐘</span>
        </div>
      </div>

      <div className="slot-actions">
        {item.status === 'scheduled' && isCurrentSlot && (
          <button 
            className="status-btn start-btn"
            onClick={() => handleStatusClick('in_progress')}
            disabled={isProcessing}
          >
            {isProcessing ? '⏳' : '▶️'} 開始
          </button>
        )}
        
        {item.status === 'in_progress' && (
          <>
            <button 
              className="status-btn complete-btn"
              onClick={() => handleStatusClick('completed')}
              disabled={isProcessing}
            >
              {isProcessing ? '⏳' : '✅'} 完成
            </button>
            <button 
              className="status-btn skip-btn"
              onClick={() => handleStatusClick('missed')}
              disabled={isProcessing}
            >
              {isProcessing ? '⏳' : '⏭️'} 跳過
            </button>
          </>
        )}
        
        {item.status === 'scheduled' && isUpcoming && (
          <button 
            className="status-btn cancel-btn"
            onClick={() => handleStatusClick('cancelled')}
            disabled={isProcessing}
          >
            {isProcessing ? '⏳' : '❌'} 取消
          </button>
        )}
      </div>

      <div className="slot-status-indicator">
        {getStatusIcon(item.status)}
      </div>
    </div>
  )
}

// Helper functions
function isTimeInRange(currentTime: string, slotTime: string, durationMinutes: number): boolean {
  const current = timeToMinutes(currentTime)
  const start = timeToMinutes(slotTime)
  const end = start + durationMinutes
  return current >= start && current < end
}

function isTimePast(currentTime: string, slotTime: string, durationMinutes: number): boolean {
  const current = timeToMinutes(currentTime)
  const end = timeToMinutes(slotTime) + durationMinutes
  return current >= end
}

function timeToMinutes(timeString: string): number {
  const [hours, minutes] = timeString.split(':').map(Number)
  return hours * 60 + minutes
}

function getStatusIcon(status: string): string {
  switch (status) {
    case 'completed': return '✅'
    case 'in_progress': return '🔄'
    case 'missed': return '❌'
    case 'cancelled': return '🚫'
    case 'scheduled':
    default: return '⏰'
  }
}