/**
 * UrgentTasksSection - Alert section for unscheduled urgent tasks
 * Part of MVP Implementation Guide Week 2 Day 1-2
 */

import React, { useState } from 'react'
import type { Todo } from '../../types/todo'
import { MagicButton } from '../MagicButton'
import { SchedulingIndicator } from '../scheduling/SchedulingIndicator'

interface UrgentTasksSectionProps {
  urgentTasks: Todo[]
  onScheduleTask: (todoId: string) => Promise<any>
  className?: string
}

export const UrgentTasksSection: React.FC<UrgentTasksSectionProps> = ({
  urgentTasks,
  onScheduleTask,
  className = ''
}) => {
  const [schedulingTaskId, setSchedulingTaskId] = useState<string | null>(null)
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set())

  // Handle scheduling a single task
  const handleScheduleTask = async (taskId: string) => {
    setSchedulingTaskId(taskId)
    try {
      const result = await onScheduleTask(taskId)
      if (result.success) {
        console.log('✅ 緊急任務已排程')
      } else {
        console.warn('⚠️ 緊急任務排程失敗:', result.message)
      }
    } catch (error) {
      console.error('❌ 排程緊急任務失敗:', error)
    } finally {
      setSchedulingTaskId(null)
    }
  }

  // Handle scheduling all urgent tasks
  const handleScheduleAll = async () => {
    setSchedulingTaskId('all')
    try {
      const results = await Promise.all(
        urgentTasks.map(task => onScheduleTask(task.id))
      )
      const successCount = results.filter(result => result.success).length
      
      if (successCount === urgentTasks.length) {
        console.log('✅ 所有緊急任務已排程')
      } else {
        console.warn(`⚠️ 部分緊急任務排程成功: ${successCount}/${urgentTasks.length}`)
      }
    } catch (error) {
      console.error('❌ 批量排程緊急任務失敗:', error)
    } finally {
      setSchedulingTaskId(null)
    }
  }

  // Toggle task expansion
  const toggleTaskExpansion = (taskId: string) => {
    const newExpanded = new Set(expandedTasks)
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId)
    } else {
      newExpanded.add(taskId)
    }
    setExpandedTasks(newExpanded)
  }

  // Calculate estimated time for all urgent tasks
  const totalPomodoros = urgentTasks.reduce((sum, task) => sum + task.totalPomodoros, 0)
  const estimatedTime = totalPomodoros * 25 // 25 minutes per pomodoro

  const formatTime = (minutes: number): string => {
    if (minutes < 60) return `${minutes}分鐘`
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0 ? `${hours}小時${remainingMinutes}分鐘` : `${hours}小時`
  }

  if (urgentTasks.length === 0) {
    return null
  }

  return (
    <section className={`urgent-tasks-section ${className}`}>
      <div className="urgent-header">
        <div className="urgent-title">
          <h2>⚠️ 未安排的緊急任務</h2>
          <div className="urgent-badge">
            {urgentTasks.length} 個任務
          </div>
        </div>
        
        <div className="urgent-summary">
          <div className="summary-item">
            <span className="summary-label">預估時間:</span>
            <span className="summary-value">{formatTime(estimatedTime)}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">番茄鐘數:</span>
            <span className="summary-value">{totalPomodoros} 個</span>
          </div>
        </div>
      </div>

      <div className="urgent-description">
        <p>
          以下任務被標記為「重要且緊急」，建議立即安排時間處理。
          您可以單獨排程每個任務，或使用「全部排程」一次性安排。
        </p>
      </div>

      <div className="urgent-actions">
        <MagicButton
          variant="danger"
          onClick={handleScheduleAll}
          disabled={schedulingTaskId !== null}
          className="schedule-all-btn"
        >
          {schedulingTaskId === 'all' ? '排程中...' : `全部排程 (${urgentTasks.length}個)`}
        </MagicButton>
        
        <div className="urgent-stats">
          <span>需要優先處理</span>
        </div>
      </div>

      <div className="urgent-tasks-list">
        {urgentTasks.map((task, index) => {
          const isExpanded = expandedTasks.has(task.id)
          const isScheduling = schedulingTaskId === task.id
          
          return (
            <div 
              key={task.id} 
              className={`urgent-task-item ${isExpanded ? 'expanded' : ''}`}
            >
              <div className="task-main" onClick={() => toggleTaskExpansion(task.id)}>
                <div className="task-index">
                  {index + 1}
                </div>
                
                <div className="task-content">
                  <h3 className="task-title">{task.text}</h3>
                  
                  <div className="task-meta">
                    <span className="task-pomodoros">
                      🍅 {task.totalPomodoros} 個番茄鐘
                    </span>
                    <span className="task-time">
                      ⏱️ 約 {formatTime(task.totalPomodoros * 25)}
                    </span>
                    {task.dueDate && (
                      <span className="task-deadline">
                        📅 {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="task-actions" onClick={(e) => e.stopPropagation()}>
                  <SchedulingIndicator todo={task} />
                  
                  <MagicButton
                    size="small"
                    variant="primary"
                    onClick={() => handleScheduleTask(task.id)}
                    disabled={isScheduling || schedulingTaskId !== null}
                  >
                    {isScheduling ? '排程中...' : '排程'}
                  </MagicButton>
                </div>

                <div className="expand-indicator">
                  <span className={`expand-arrow ${isExpanded ? 'expanded' : ''}`}>
                    ▼
                  </span>
                </div>
              </div>

              {isExpanded && (
                <div className="task-details">
                  <div className="details-grid">
                    <div className="detail-item">
                      <span className="detail-label">創建時間:</span>
                      <span className="detail-value">
                        {new Date(task.createdAt).toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="detail-item">
                      <span className="detail-label">優先級:</span>
                      <span className="detail-value priority-urgent">
                        🔴 重要且緊急
                      </span>
                    </div>
                    
                    <div className="detail-item">
                      <span className="detail-label">完成進度:</span>
                      <span className="detail-value">
                        {task.completedPomodoros}/{task.totalPomodoros} 完成
                      </span>
                    </div>
                    
                    {task.projectId && (
                      <div className="detail-item">
                        <span className="detail-label">所屬專案:</span>
                        <span className="detail-value">📁 專案</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="task-suggestions">
                    <h4>💡 建議</h4>
                    <ul>
                      <li>立即安排時間處理此任務</li>
                      <li>考慮拆分為更小的子任務</li>
                      <li>設定專注時間，避免干擾</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="urgent-footer">
        <div className="footer-tip">
          💡 <strong>提示:</strong> 緊急任務會自動優先排程在最早的可用時間。
          建議完成這些任務後，再關注重要但不緊急的任務。
        </div>
      </div>
    </section>
  )
}