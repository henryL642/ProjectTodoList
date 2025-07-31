/**
 * TimelineConflictManager - Conflict detection and resolution for timeline
 * Part of MVP Implementation Guide Week 2 Day 3-4
 */

import React, { useState, useEffect, useMemo } from 'react'
import type { ScheduleItem, PomodoroSlot } from '../../types/mvp-scheduling'
import { useScheduling } from '../../context/SchedulingContext'
import { MagicButton } from '../MagicButton'

interface TimelineConflict {
  id: string
  type: 'overlap' | 'gap_too_small' | 'outside_working_hours' | 'too_many_sessions'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  affectedItems: string[]
  suggestedResolution: string
  autoFixable: boolean
}

interface ConflictResolution {
  conflictId: string
  action: 'reschedule' | 'merge' | 'split' | 'remove' | 'ignore'
  parameters?: any
}

interface TimelineConflictManagerProps {
  schedule: ScheduleItem[]
  onScheduleUpdate: (newSchedule: ScheduleItem[]) => void
  workingHours?: { start: string; end: string }
  maxSessionsPerDay?: number
  minBreakMinutes?: number
}

export const TimelineConflictManager: React.FC<TimelineConflictManagerProps> = ({
  schedule,
  onScheduleUpdate,
  workingHours = { start: '09:00', end: '18:00' },
  maxSessionsPerDay = 12,
  minBreakMinutes = 5
}) => {
  const [conflicts, setConflicts] = useState<TimelineConflict[]>([])
  const [isResolving, setIsResolving] = useState(false)
  const [showConflicts, setShowConflicts] = useState(false)

  // Detect conflicts whenever schedule changes
  useEffect(() => {
    const detectedConflicts = detectConflicts(schedule, {
      workingHours,
      maxSessionsPerDay,
      minBreakMinutes
    })
    setConflicts(detectedConflicts)
    
    // Auto-show conflicts panel if there are critical conflicts
    if (detectedConflicts.some(c => c.severity === 'critical')) {
      setShowConflicts(true)
    }
  }, [schedule, workingHours, maxSessionsPerDay, minBreakMinutes])

  // Group conflicts by severity
  const conflictsBySeverity = useMemo(() => {
    return conflicts.reduce((acc, conflict) => {
      if (!acc[conflict.severity]) acc[conflict.severity] = []
      acc[conflict.severity].push(conflict)
      return acc
    }, {} as Record<string, TimelineConflict[]>)
  }, [conflicts])

  // Auto-resolve conflicts
  const handleAutoResolve = async () => {
    setIsResolving(true)
    try {
      let updatedSchedule = [...schedule]
      
      // Resolve conflicts in order of severity
      const resolutionOrder = ['critical', 'high', 'medium', 'low']
      
      for (const severity of resolutionOrder) {
        const severityConflicts = conflictsBySeverity[severity] || []
        
        for (const conflict of severityConflicts) {
          if (conflict.autoFixable) {
            updatedSchedule = await resolveConflict(conflict, updatedSchedule)
          }
        }
      }
      
      onScheduleUpdate(updatedSchedule)
      console.log('✅ Auto-resolution completed')
      
    } catch (error) {
      console.error('❌ Auto-resolution failed:', error)
    } finally {
      setIsResolving(false)
    }
  }

  // Manual resolve specific conflict
  const handleManualResolve = async (conflict: TimelineConflict, resolution: ConflictResolution) => {
    setIsResolving(true)
    try {
      const updatedSchedule = await applyResolution(conflict, resolution, schedule)
      onScheduleUpdate(updatedSchedule)
      console.log(`✅ Conflict resolved: ${conflict.id}`)
      
    } catch (error) {
      console.error('❌ Manual resolution failed:', error)
    } finally {
      setIsResolving(false)
    }
  }

  if (conflicts.length === 0) {
    return (
      <div className="timeline-conflict-manager no-conflicts">
        <div className="no-conflicts-indicator">
          <span className="status-icon">✅</span>
          <span className="status-text">時間軸無衝突</span>
        </div>
      </div>
    )
  }

  return (
    <div className="timeline-conflict-manager">
      {/* Conflict Summary */}
      <div className="conflict-summary">
        <div className="summary-header">
          <div className="conflict-count">
            <span className="warning-icon">⚠️</span>
            <span className="count-text">發現 {conflicts.length} 個時間衝突</span>
          </div>
          
          <div className="summary-actions">
            <button
              className="toggle-conflicts-btn"
              onClick={() => setShowConflicts(!showConflicts)}
            >
              {showConflicts ? '隱藏詳情' : '顯示詳情'}
            </button>
            
            <MagicButton
              variant="primary"
              size="small"
              onClick={handleAutoResolve}
              disabled={isResolving || !conflicts.some(c => c.autoFixable)}
            >
              {isResolving ? '解決中...' : '自動解決'}
            </MagicButton>
          </div>
        </div>

        {/* Severity Indicators */}
        <div className="severity-indicators">
          {Object.entries(conflictsBySeverity).map(([severity, severityConflicts]) => (
            <div key={severity} className={`severity-indicator ${severity}`}>
              <span className="severity-icon">{getSeverityIcon(severity)}</span>
              <span className="severity-count">{severityConflicts.length}</span>
              <span className="severity-label">{getSeverityLabel(severity)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed Conflicts */}
      {showConflicts && (
        <div className="conflicts-detail">
          {Object.entries(conflictsBySeverity).map(([severity, severityConflicts]) => (
            <div key={severity} className="severity-group">
              <h4 className={`severity-header ${severity}`}>
                {getSeverityIcon(severity)} {getSeverityLabel(severity)} ({severityConflicts.length})
              </h4>
              
              <div className="conflicts-list">
                {severityConflicts.map(conflict => (
                  <ConflictItem
                    key={conflict.id}
                    conflict={conflict}
                    onResolve={(resolution) => handleManualResolve(conflict, resolution)}
                    isResolving={isResolving}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Individual conflict item component
 */
interface ConflictItemProps {
  conflict: TimelineConflict
  onResolve: (resolution: ConflictResolution) => void
  isResolving: boolean
}

const ConflictItem: React.FC<ConflictItemProps> = ({ conflict, onResolve, isResolving }) => {
  const [showResolutions, setShowResolutions] = useState(false)

  const resolutionOptions = getResolutionOptions(conflict)

  return (
    <div className={`conflict-item ${conflict.severity}`}>
      <div className="conflict-header">
        <div className="conflict-info">
          <span className="conflict-type">{getConflictTypeLabel(conflict.type)}</span>
          <span className="conflict-description">{conflict.description}</span>
        </div>
        
        <div className="conflict-actions">
          <button
            className="show-resolutions-btn"
            onClick={() => setShowResolutions(!showResolutions)}
          >
            {showResolutions ? '隱藏選項' : '解決方案'}
          </button>
        </div>
      </div>

      {showResolutions && (
        <div className="resolution-options">
          <div className="suggested-resolution">
            <strong>建議方案:</strong> {conflict.suggestedResolution}
          </div>
          
          <div className="resolution-buttons">
            {resolutionOptions.map(option => (
              <MagicButton
                key={option.action}
                size="small"
                variant={option.primary ? 'primary' : 'secondary'}
                onClick={() => onResolve({ conflictId: conflict.id, action: option.action })}
                disabled={isResolving}
              >
                {option.label}
              </MagicButton>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Helper functions for conflict detection
function detectConflicts(
  schedule: ScheduleItem[],
  options: {
    workingHours: { start: string; end: string }
    maxSessionsPerDay: number
    minBreakMinutes: number
  }
): TimelineConflict[] {
  const conflicts: TimelineConflict[] = []
  
  // Sort schedule by time
  const sortedSchedule = [...schedule].sort((a, b) => 
    timeToMinutes(a.time) - timeToMinutes(b.time)
  )

  // Check for overlaps
  for (let i = 0; i < sortedSchedule.length - 1; i++) {
    const current = sortedSchedule[i]
    const next = sortedSchedule[i + 1]
    
    const currentEnd = timeToMinutes(current.time) + 25 // Assuming 25-minute sessions
    const nextStart = timeToMinutes(next.time)
    
    if (currentEnd > nextStart) {
      conflicts.push({
        id: `overlap_${current.id}_${next.id}`,
        type: 'overlap',
        severity: 'critical',
        description: `${current.time} 和 ${next.time} 的時段重疊`,
        affectedItems: [current.id, next.id],
        suggestedResolution: '重新安排其中一個時段',
        autoFixable: true
      })
    }
    
    // Check for insufficient breaks
    const breakTime = nextStart - currentEnd
    if (breakTime > 0 && breakTime < options.minBreakMinutes) {
      conflicts.push({
        id: `break_${current.id}_${next.id}`,
        type: 'gap_too_small',
        severity: 'medium',
        description: `${current.time} 和 ${next.time} 之間休息時間不足 (${breakTime}分鐘)`,
        affectedItems: [current.id, next.id],
        suggestedResolution: `延後後續時段或增加 ${options.minBreakMinutes - breakTime} 分鐘間隔`,
        autoFixable: true
      })
    }
  }

  // Check working hours violations
  sortedSchedule.forEach(item => {
    const itemTime = timeToMinutes(item.time)
    const workStart = timeToMinutes(options.workingHours.start)
    const workEnd = timeToMinutes(options.workingHours.end)
    
    if (itemTime < workStart || itemTime + 25 > workEnd) {
      conflicts.push({
        id: `hours_${item.id}`,
        type: 'outside_working_hours',
        severity: 'high',
        description: `${item.time} 超出工作時間 (${options.workingHours.start}-${options.workingHours.end})`,
        affectedItems: [item.id],
        suggestedResolution: '重新安排到工作時間內',
        autoFixable: true
      })
    }
  })

  // Check session count
  if (schedule.length > options.maxSessionsPerDay) {
    conflicts.push({
      id: 'too_many_sessions',
      type: 'too_many_sessions',
      severity: 'medium',
      description: `今日安排了 ${schedule.length} 個時段，超過建議的 ${options.maxSessionsPerDay} 個`,
      affectedItems: schedule.map(item => item.id),
      suggestedResolution: '將部分任務延後到其他日期',
      autoFixable: false
    })
  }

  return conflicts
}

// Conflict resolution functions
async function resolveConflict(conflict: TimelineConflict, schedule: ScheduleItem[]): Promise<ScheduleItem[]> {
  switch (conflict.type) {
    case 'overlap':
      return resolveOverlapConflict(conflict, schedule)
    case 'gap_too_small':
      return resolveGapConflict(conflict, schedule)
    case 'outside_working_hours':
      return resolveWorkingHoursConflict(conflict, schedule)
    default:
      return schedule
  }
}

function resolveOverlapConflict(conflict: TimelineConflict, schedule: ScheduleItem[]): ScheduleItem[] {
  // Move the second item to a later time
  const [firstId, secondId] = conflict.affectedItems
  const firstItem = schedule.find(item => item.id === firstId)
  const secondItem = schedule.find(item => item.id === secondId)
  
  if (firstItem && secondItem) {
    const newTime = addMinutesToTime(firstItem.time, 30) // 25 min + 5 min break
    
    return schedule.map(item => 
      item.id === secondId 
        ? { ...item, time: newTime }
        : item
    )
  }
  
  return schedule
}

function resolveGapConflict(conflict: TimelineConflict, schedule: ScheduleItem[]): ScheduleItem[] {
  // Add proper break time
  const [firstId, secondId] = conflict.affectedItems
  const secondItem = schedule.find(item => item.id === secondId)
  
  if (secondItem) {
    const firstEndTime = addMinutesToTime(
      schedule.find(item => item.id === firstId)?.time || '09:00', 
      25
    )
    const newTime = addMinutesToTime(firstEndTime, 5) // Add 5-minute break
    
    return schedule.map(item => 
      item.id === secondId 
        ? { ...item, time: newTime }
        : item
    )
  }
  
  return schedule
}

function resolveWorkingHoursConflict(conflict: TimelineConflict, schedule: ScheduleItem[]): ScheduleItem[] {
  // Move to next available slot within working hours
  const itemId = conflict.affectedItems[0]
  const nextAvailableTime = findNextAvailableTimeSlot(schedule, '09:30') // Start after 9:30
  
  return schedule.map(item => 
    item.id === itemId 
      ? { ...item, time: nextAvailableTime }
      : item
  )
}

async function applyResolution(
  conflict: TimelineConflict, 
  resolution: ConflictResolution, 
  schedule: ScheduleItem[]
): Promise<ScheduleItem[]> {
  switch (resolution.action) {
    case 'reschedule':
      return resolveConflict(conflict, schedule)
    case 'remove':
      return schedule.filter(item => !conflict.affectedItems.includes(item.id))
    case 'ignore':
      return schedule // No changes
    default:
      return schedule
  }
}

// Helper functions
function timeToMinutes(timeString: string): number {
  const [hours, minutes] = timeString.split(':').map(Number)
  return hours * 60 + minutes
}

function addMinutesToTime(timeString: string, minutes: number): string {
  const totalMinutes = timeToMinutes(timeString) + minutes
  const hours = Math.floor(totalMinutes / 60)
  const mins = totalMinutes % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}

function findNextAvailableTimeSlot(schedule: ScheduleItem[], startTime: string): string {
  let currentTime = startTime
  const occupiedSlots = schedule.map(item => ({
    start: timeToMinutes(item.time),
    end: timeToMinutes(item.time) + 25
  }))
  
  while (true) {
    const currentMinutes = timeToMinutes(currentTime)
    const isOccupied = occupiedSlots.some(slot => 
      currentMinutes >= slot.start && currentMinutes < slot.end
    )
    
    if (!isOccupied) {
      return currentTime
    }
    
    currentTime = addMinutesToTime(currentTime, 30) // Try next 30-minute slot
    
    // Prevent infinite loop
    if (timeToMinutes(currentTime) > 18 * 60) {
      break
    }
  }
  
  return startTime // Fallback
}

function getSeverityIcon(severity: string): string {
  const icons = {
    critical: '🚨',
    high: '⚠️',
    medium: '🟡',
    low: '🔵'
  }
  return icons[severity as keyof typeof icons] || '❓'
}

function getSeverityLabel(severity: string): string {
  const labels = {
    critical: '嚴重',
    high: '高',
    medium: '中',
    low: '低'
  }
  return labels[severity as keyof typeof labels] || '未知'
}

function getConflictTypeLabel(type: string): string {
  const labels = {
    overlap: '時間重疊',
    gap_too_small: '休息不足',
    outside_working_hours: '超出工作時間',
    too_many_sessions: '時段過多'
  }
  return labels[type as keyof typeof labels] || '未知衝突'
}

function getResolutionOptions(conflict: TimelineConflict) {
  const baseOptions = [
    { action: 'ignore' as const, label: '忽略', primary: false }
  ]
  
  switch (conflict.type) {
    case 'overlap':
      return [
        { action: 'reschedule' as const, label: '重新排程', primary: true },
        { action: 'remove' as const, label: '移除其中一個', primary: false },
        ...baseOptions
      ]
    case 'gap_too_small':
      return [
        { action: 'reschedule' as const, label: '調整時間', primary: true },
        ...baseOptions
      ]
    case 'outside_working_hours':
      return [
        { action: 'reschedule' as const, label: '移到工作時間', primary: true },
        { action: 'remove' as const, label: '移除時段', primary: false },
        ...baseOptions
      ]
    default:
      return baseOptions
  }
}