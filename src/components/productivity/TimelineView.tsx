/**
 * TimelineView - Enhanced daily schedule timeline component
 * Part of MVP Implementation Guide Week 2 Day 3-4
 */

import React, { useState } from 'react'
import type { ScheduleItem } from '../../types/mvp-scheduling'
import { TimeSlot } from './TimeSlot'
import { TimelineConflictManager } from './TimelineConflictManager'
import { TimelineStatusManager } from './TimelineStatusManager'
import { TimelineExportPanel } from './TimelineExportPanel'
import { TimelineAnalytics } from './TimelineAnalytics'
import TimelineKeyboardShortcuts from './TimelineKeyboardShortcuts'
import { MagicButton } from '../MagicButton'

interface TimelineViewProps {
  schedule: ScheduleItem[]
  currentTime?: string
  onStatusChange?: (itemId: string, status: any) => void
  onScheduleUpdate?: (newSchedule: ScheduleItem[]) => void
  onTimeChange?: (itemId: string, newTime: string) => void
  className?: string
  showConflictManager?: boolean
  enableDragDrop?: boolean
  enableKeyboardShortcuts?: boolean
  historicalData?: ScheduleItem[][]
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  schedule,
  currentTime,
  onStatusChange,
  onScheduleUpdate,
  onTimeChange,
  className = '',
  showConflictManager = true,
  enableDragDrop = true,
  enableKeyboardShortcuts = true,
  historicalData = []
}) => {
  const [viewMode, setViewMode] = useState<'compact' | 'detailed'>('detailed')
  const [showExportPanel, setShowExportPanel] = useState(false)
  const [showAnalytics, setShowAnalytics] = useState(false)

  // Sort schedule by time
  const sortedSchedule = [...schedule].sort((a, b) => {
    const timeA = a.time.split(':').map(Number)
    const timeB = b.time.split(':').map(Number)
    const minutesA = timeA[0] * 60 + timeA[1]
    const minutesB = timeB[0] * 60 + timeB[1]
    return minutesA - minutesB
  })

  // Group consecutive items of the same type
  const groupedSchedule = groupConsecutiveItems(sortedSchedule)

  // Handle status change
  const handleStatusChange = (itemId: string, newStatus: any) => {
    if (onStatusChange) {
      onStatusChange(itemId, newStatus)
    }
  }

  // Handle time change from drag and drop
  const handleTimeChange = (itemId: string, newTime: string) => {
    if (onTimeChange) {
      onTimeChange(itemId, newTime)
    }
    
    // Also trigger schedule update if handler is available
    if (onScheduleUpdate) {
      const updatedSchedule = schedule.map(item => 
        item.id === itemId ? { ...item, time: newTime } : item
      )
      onScheduleUpdate(updatedSchedule)
    }
  }

  // Determine if a time slot is current
  const isCurrentSlot = (startTime: string, endTime?: string): boolean => {
    if (!currentTime) return false
    
    const current = timeToMinutes(currentTime)
    const start = timeToMinutes(startTime)
    const end = endTime ? timeToMinutes(endTime) : start + 25 // Default 25 minutes
    
    return current >= start && current < end
  }

  // Determine if a time slot is past
  const isPastSlot = (startTime: string): boolean => {
    if (!currentTime) return false
    return timeToMinutes(currentTime) > timeToMinutes(startTime) + 25
  }

  if (sortedSchedule.length === 0) {
    return (
      <div className={`timeline-view empty ${className}`}>
        <div className="empty-timeline">
          <div className="empty-icon">⏰</div>
          <p>今日暫無安排</p>
        </div>
      </div>
    )
  }

  return (
    <TimelineStatusManager>
      {({ handleStatusChange: statusHandler, isUpdating, lastUpdate }) => (
        <div className={`timeline-view ${viewMode} ${className}`}>
          {/* Conflict Manager */}
          {showConflictManager && onScheduleUpdate && (
            <TimelineConflictManager
              schedule={schedule}
              onScheduleUpdate={onScheduleUpdate}
              workingHours={{ start: '09:00', end: '18:00' }}
              maxSessionsPerDay={12}
              minBreakMinutes={5}
            />
          )}

          {/* Status Update Indicator */}
          {isUpdating && (
            <div className="timeline-updating-banner">
              <span className="updating-spinner">🔄</span>
              <span>正在更新時間軸...</span>
            </div>
          )}

          {/* Last Update Info */}
          {lastUpdate && !isUpdating && (
            <div className="timeline-last-update-banner">
              <span className="update-icon">✅</span>
              <span>最近更新: {new Date(lastUpdate.timestamp).toLocaleTimeString()}</span>
            </div>
          )}

          {/* Timeline Controls */}
          <div className="timeline-controls">
        <div className="view-mode-toggle">
          <button
            className={viewMode === 'detailed' ? 'active' : ''}
            onClick={() => setViewMode('detailed')}
          >
            詳細
          </button>
          <button
            className={viewMode === 'compact' ? 'active' : ''}
            onClick={() => setViewMode('compact')}
          >
            緊湊
          </button>
        </div>
        
        <div className="timeline-features">
          {enableDragDrop && (
            <div className="drag-drop-hint">
              <span className="hint-icon">🖱️</span>
              <span className="hint-text">拖拽時段來重新安排</span>
            </div>
          )}
          
          <div className="timeline-actions">
            <MagicButton
              size="small"
              variant="ghost"
              onClick={() => setShowAnalytics(true)}
              title="查看時間軸分析 (Alt+A)"
            >
              📊 分析
            </MagicButton>
            
            <MagicButton
              size="small"
              variant="ghost"
              onClick={() => setShowExportPanel(true)}
              title="導出時間軸 (Alt+E)"
            >
              📤 導出
            </MagicButton>
            
            {enableKeyboardShortcuts && (
              <MagicButton
                size="small"
                variant="ghost"
                onClick={() => {
                  // Trigger help display
                  const helpEvent = new KeyboardEvent('keydown', { key: '?' })
                  document.dispatchEvent(helpEvent)
                }}
                title="鍵盤快捷鍵 (?)"
              >
                ⌨️
              </MagicButton>
            )}
          </div>
          
          <div className="timeline-info">
            <span className="total-items">{sortedSchedule.length} 個時段</span>
          </div>
        </div>
      </div>

      {/* Timeline Container */}
      <div className="timeline-container">
        {/* Time Indicator Line */}
        {currentTime && (
          <div 
            className="current-time-indicator"
            style={{ top: calculateTimelinePosition(currentTime, sortedSchedule) }}
          >
            <div className="time-line" />
            <div className="time-label">
              {currentTime} 現在
            </div>
          </div>
        )}

        {/* Timeline Items */}
        <div className="timeline-items">
          {groupedSchedule.map((group, index) => (
            <div key={index} className="timeline-group">
              {group.items.map((item, itemIndex) => {
                const isCurrent = isCurrentSlot(item.time)
                const isPast = isPastSlot(item.time)
                const isUpcoming = !isCurrent && !isPast
                
                return (
                  <div key={item.id} data-timeline-item={item.id}>
                    <TimeSlot
                      item={item}
                      isCurrent={isCurrent}
                      isPast={isPast}
                      isUpcoming={isUpcoming}
                      viewMode={viewMode}
                      onStatusChange={async (itemId: string, status: any) => {
                        // Use enhanced status handler from TimelineStatusManager
                        await statusHandler(itemId, status)
                        // Also call original handler if provided
                        if (onStatusChange) {
                          onStatusChange(itemId, status)
                        }
                      }}
                      onTimeChange={enableDragDrop ? handleTimeChange : undefined}
                      isDraggable={enableDragDrop}
                      showConnector={itemIndex < group.items.length - 1}
                    />
                  </div>
                )
              })}
              
              {/* Break indicator between groups */}
              {index < groupedSchedule.length - 1 && (
                <div className="timeline-break">
                  <div className="break-line" />
                  <span className="break-label">休息時間</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Timeline Summary */}
      <div className="timeline-summary">
        <div className="summary-stats">
          <div className="stat">
            <span className="stat-value">
              {sortedSchedule.filter(item => item.status === 'completed').length}
            </span>
            <span className="stat-label">已完成</span>
          </div>
          <div className="stat">
            <span className="stat-value">
              {sortedSchedule.filter(item => item.type === 'pomodoro').length}
            </span>
            <span className="stat-label">番茄鐘</span>
          </div>
          <div className="stat">
            <span className="stat-value">
              {calculateTotalDuration(sortedSchedule)}
            </span>
            <span className="stat-label">總時長</span>
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts Handler */}
      {enableKeyboardShortcuts && (
        <TimelineKeyboardShortcuts
          schedule={sortedSchedule}
          currentTime={currentTime}
          onStatusChange={handleStatusChange}
          onTimeChange={handleTimeChange}
          onExportRequest={() => setShowExportPanel(true)}
          onAnalyticsRequest={() => setShowAnalytics(true)}
          onViewModeToggle={() => setViewMode(prev => prev === 'detailed' ? 'compact' : 'detailed')}
          isEnabled={true}
        />
      )}

      {/* Export Panel */}
      <TimelineExportPanel
        schedule={sortedSchedule}
        isOpen={showExportPanel}
        onClose={() => setShowExportPanel(false)}
        currentDate={new Date()}
      />

      {/* Analytics Panel */}
      <TimelineAnalytics
        schedule={sortedSchedule}
        isOpen={showAnalytics}
        onClose={() => setShowAnalytics(false)}
        currentDate={new Date()}
        historicalData={historicalData}
      />
    </div>
      )}
    </TimelineStatusManager>
  )
}

// Helper functions

function timeToMinutes(timeString: string): number {
  const [hours, minutes] = timeString.split(':').map(Number)
  return hours * 60 + minutes
}

function groupConsecutiveItems(schedule: ScheduleItem[]): { type: string; items: ScheduleItem[] }[] {
  const groups: { type: string; items: ScheduleItem[] }[] = []
  let currentGroup: { type: string; items: ScheduleItem[] } | null = null

  for (const item of schedule) {
    if (!currentGroup || currentGroup.type !== item.type) {
      // Start a new group
      currentGroup = { type: item.type, items: [item] }
      groups.push(currentGroup)
    } else {
      // Add to current group
      currentGroup.items.push(item)
    }
  }

  return groups
}

function calculateTimelinePosition(currentTime: string, schedule: ScheduleItem[]): string {
  if (schedule.length === 0) return '0px'
  
  const currentMinutes = timeToMinutes(currentTime)
  const firstSlotMinutes = timeToMinutes(schedule[0].time)
  const lastSlotMinutes = timeToMinutes(schedule[schedule.length - 1].time) + 25 // Assuming 25-minute slots
  
  // Calculate relative position
  const totalDuration = lastSlotMinutes - firstSlotMinutes
  const relativePosition = (currentMinutes - firstSlotMinutes) / totalDuration
  
  // Convert to pixel position (assuming timeline height)
  const timelineHeight = schedule.length * 80 // Approximate height per slot
  return `${Math.max(0, Math.min(timelineHeight, relativePosition * timelineHeight))}px`
}

function calculateTotalDuration(schedule: ScheduleItem[]): string {
  const pomodoroSlots = schedule.filter(item => item.type === 'pomodoro').length
  const totalMinutes = pomodoroSlots * 25 // 25 minutes per pomodoro
  
  if (totalMinutes < 60) {
    return `${totalMinutes}分鐘`
  } else {
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    return minutes > 0 ? `${hours}小時${minutes}分鐘` : `${hours}小時`
  }
}