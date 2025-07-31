/**
 * TodayFocusView - Main today focus page component
 * Part of MVP Implementation Guide Week 2 Day 1-2
 */

import React, { useState, useEffect } from 'react'
import { useTodosWithScheduling } from '../../hooks/useTodosWithScheduling'
import { useScheduling, useTodaySchedule } from '../../context/SchedulingContext'
import { Priority, PriorityConfigs } from '../../types/priority'
import { TimelineView } from '../productivity/TimelineView'
import { ProgressBar } from '../productivity/ProgressBar'
import { UrgentTasksSection } from '../productivity/UrgentTasksSection'
import { QuickActions } from '../productivity/QuickActions'
import { MagicButton } from '../MagicButton'
import { TodoEditModal } from '../todo/TodoEditModal'
import { TodoItem } from '../TodoItem'
import { QuickActionModal } from '../layout/QuickActionModal'
import type { Todo } from '../../types/todo'

export const TodayFocusView: React.FC = () => {
  const { todosWithSchedulingStatus, scheduleExistingTodo, editTodo, toggleTodo, deleteTodo, addTodoWithScheduling } = useTodosWithScheduling()
  const { getDaySchedule, scheduleTodos, isScheduling, setScheduledSlots } = useScheduling()
  const [isSmartScheduling, setIsSmartScheduling] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null)
  const [showQuickAddModal, setShowQuickAddModal] = useState(false)
  const [isFocusMode, setIsFocusMode] = useState(false)

  // Get today's date
  const today = new Date()
  const todaySchedule = getDaySchedule(today)

  // Filter urgent unscheduled tasks
  const unscheduledUrgent = todosWithSchedulingStatus.filter(todo => 
    todo.priority === Priority.URGENT_IMPORTANT && 
    !todo.isScheduled &&
    !todo.completed
  )

  // Filter important tasks that should be scheduled today
  const importantTasks = todosWithSchedulingStatus.filter(todo =>
    [Priority.URGENT_IMPORTANT, Priority.IMPORTANT_NOT_URGENT].includes(todo.priority) &&
    !todo.completed
  )

  // Calculate daily stats
  const totalScheduled = todaySchedule.length
  const completedSlots = todaySchedule.filter(item => item.status === 'completed').length
  const currentTime = new Date()
  const currentTimeString = `${currentTime.getHours().toString().padStart(2, '0')}:${currentTime.getMinutes().toString().padStart(2, '0')}`

  // Find current/next task
  const currentTask = todaySchedule.find(item => {
    const itemTime = item.time
    const itemEndTime = calculateEndTime(itemTime, 25) // Assuming 25-minute slots
    return itemTime <= currentTimeString && currentTimeString < itemEndTime
  })

  const nextTask = todaySchedule.find(item => item.time > currentTimeString)

  // Handle schedule updates from conflict resolution
  const handleScheduleUpdate = (newSchedule: any[]) => {
    // Update the scheduled slots in the context
    // This will refresh the timeline and resolve conflicts
    const updatedSlots = newSchedule.map(item => ({
      id: item.id,
      todoId: item.task.id,
      startTime: item.time,
      date: today,
      status: item.status,
      actualStart: item.actualStart,
      actualEnd: item.actualEnd
    }))
    
    setScheduledSlots(updatedSlots)
    setRefreshTrigger(prev => prev + 1) // Trigger UI refresh
    console.log('📅 Schedule updated with conflict resolution')
  }

  // Smart scheduling handler
  const handleSmartSchedule = async () => {
    setIsSmartScheduling(true)
    try {
      const unscheduledTasks = todosWithSchedulingStatus.filter(todo => 
        !todo.isScheduled && 
        !todo.completed &&
        todo.canAutoSchedule
      )

      if (unscheduledTasks.length === 0) {
        alert('沒有需要排程的任務')
        return
      }

      const result = await scheduleTodos(unscheduledTasks)
      
      if (result.success) {
        alert(`✅ 成功排程 ${result.scheduledSlots.length} 個番茄鐘！`)
        setRefreshTrigger(prev => prev + 1) // Trigger refresh
      } else {
        alert(`⚠️ 排程部分成功：${result.message}`)
      }
    } catch (error) {
      console.error('Smart scheduling failed:', error)
      alert('❌ 智能排程失敗，請稍後再試')
    } finally {
      setIsSmartScheduling(false)
    }
  }

  // Format date helper
  const formatDate = (date: Date): string => {
    const days = ['日', '一', '二', '三', '四', '五', '六']
    const dayName = days[date.getDay()]
    return `${date.getMonth() + 1}月${date.getDate()}日 (${dayName})`
  }

  // Calculate end time helper
  const calculateEndTime = (startTime: string, durationMinutes: number): string => {
    const [hours, minutes] = startTime.split(':').map(Number)
    const totalMinutes = hours * 60 + minutes + durationMinutes
    const endHours = Math.floor(totalMinutes / 60)
    const endMinutes = totalMinutes % 60
    return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`
  }

  // Quick Actions handlers
  const handleQuickAddTask = () => {
    setShowQuickAddModal(true)
  }

  const handleEnterFocusMode = () => {
    setIsFocusMode(!isFocusMode)
    if (!isFocusMode) {
      // 進入專注模式：隱藏非核心元素
      document.body.classList.add('focus-mode-active')
      alert('🎯 深度專注模式已開啟！\n\n• 隱藏所有分心元素\n• 僅顯示當前任務\n• 開啟專注音效提醒')
    } else {
      // 退出專注模式
      document.body.classList.remove('focus-mode-active')
      alert('✨ 專注模式已關閉，歡迎回來！')
    }
  }

  const handleStartPomodoro = () => {
    const currentTask = todaySchedule.find(item => {
      const itemTime = item.time
      const itemEndTime = calculateEndTime(itemTime, 25)
      return itemTime <= currentTimeString && currentTimeString < itemEndTime
    })
    
    if (currentTask) {
      alert(`🍅 開始番茄鐘專注工作！\n\n任務：${currentTask.task.title}\n時長：25 分鐘\n\n請專心工作，25分鐘後系統會提醒您休息。`)
      // 這裡可以開始倒計時邏輯
    } else {
      alert('⏰ 目前沒有安排的任務時段')
    }
  }

  const handleQuickBreak = () => {
    alert('☕ 開始 5 分鐘短休息\n\n• 離開螢幕休息眼睛\n• 做些簡單伸展\n• 補充水分\n\n5分鐘後回來繼續工作！')
  }

  const handleTaskAdd = async (task: { text: string; projectId?: string; priority?: any; dueDate?: string; totalPomodoros?: number }) => {
    try {
      await addTodoWithScheduling({
        text: task.text,
        projectId: task.projectId,
        priority: task.priority,
        dueDate: task.dueDate,
        totalPomodoros: task.totalPomodoros || 1,
        autoSchedule: true
      })
      setRefreshTrigger(prev => prev + 1)
    } catch (error) {
      console.error('Failed to add task:', error)
    }
  }

  return (
    <div className="today-focus">
      {/* Header Section */}
      <header className="today-header">
        <div className="header-main">
          <h1>🎯 今日焦點</h1>
          <div className="today-date">
            📅 {formatDate(today)}
          </div>
          <div className="focus-explanation">
            <small>專注執行 • 實時追蹤 • 深度分析</small>
          </div>
        </div>
        
        <div className="today-stats">
          <ProgressBar 
            completed={completedSlots} 
            total={totalScheduled}
            label="今日進度"
          />
          
          <div className="stats-summary">
            <div className="stat-item">
              <span className="stat-number">{totalScheduled}</span>
              <span className="stat-label">已排程</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{completedSlots}</span>
              <span className="stat-label">已完成</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{importantTasks.length}</span>
              <span className="stat-label">重要任務</span>
            </div>
          </div>
        </div>
      </header>

      {/* Current Status */}
      <section className="current-status">
        {currentTask ? (
          <div className="current-task">
            <div className="status-indicator current">🔄 進行中</div>
            <div className="task-info">
              <h3>{currentTask.task.title}</h3>
              <div className="time-info">
                {currentTask.time} - {calculateEndTime(currentTask.time, 25)}
              </div>
            </div>
          </div>
        ) : nextTask ? (
          <div className="next-task">
            <div className="status-indicator next">⏰ 即將開始</div>
            <div className="task-info">
              <h3>{nextTask.task.title}</h3>
              <div className="time-info">
                {nextTask.time} - {calculateEndTime(nextTask.time, 25)}
              </div>
            </div>
          </div>
        ) : (
          <div className="no-current-task">
            <div className="status-indicator idle">✨ 空閒時間</div>
            <div className="idle-message">
              目前沒有安排任務，可以休息一下或處理其他事務
            </div>
          </div>
        )}
      </section>

      {/* 今日焦點專屬快速操作 */}
      <section className="focus-quick-actions">
        <div className="focus-actions-header">
          <h3>⚡ 專注操作</h3>
          <p>針對今日執行的專門操作</p>
        </div>
        
        <div className="focus-actions-grid">
          {/* 番茄鐘控制 */}
          <div className="focus-action-card primary">
            <div className="action-icon">🍅</div>
            <div className="action-info">
              <h4>開始番茄鐘</h4>
              <p>專注工作 25 分鐘</p>
            </div>
            <button 
              className="action-btn primary"
              onClick={handleStartPomodoro}
              disabled={!currentTask}
            >
              {currentTask ? '開始專注' : '無當前任務'}
            </button>
          </div>

          {/* 深度專注模式 */}
          <div className="focus-action-card">
            <div className="action-icon">🎯</div>
            <div className="action-info">
              <h4>深度專注模式</h4>
              <p>隱藏干擾，純粹專注</p>
            </div>
            <button 
              className={`action-btn ${isFocusMode ? 'active' : ''}`}
              onClick={handleEnterFocusMode}
            >
              {isFocusMode ? '退出專注' : '進入專注'}
            </button>
          </div>

          {/* 快速休息 */}
          <div className="focus-action-card">
            <div className="action-icon">☕</div>
            <div className="action-info">
              <h4>快速休息</h4>
              <p>5 分鐘恢復能量</p>
            </div>
            <button 
              className="action-btn secondary"
              onClick={handleQuickBreak}
            >
              開始休息
            </button>
          </div>

          {/* 智能排程 */}
          <div className="focus-action-card">
            <div className="action-icon">🤖</div>
            <div className="action-info">
              <h4>智能排程</h4>
              <p>自動安排剩餘任務</p>
              {unscheduledUrgent.length > 0 && (
                <span className="urgent-badge">{unscheduledUrgent.length} 個待排程</span>
              )}
            </div>
            <button 
              className="action-btn"
              onClick={handleSmartSchedule}
              disabled={isSmartScheduling || unscheduledUrgent.length === 0}
            >
              {isSmartScheduling ? '排程中...' : '開始排程'}
            </button>
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="timeline-section">
        <div className="section-header">
          <h2>⏰ 今日時間軸</h2>
          <div className="timeline-stats">
            {totalScheduled > 0 ? (
              <span>{totalScheduled} 個時段已排程</span>
            ) : (
              <span className="no-schedule">暂無排程</span>
            )}
          </div>
        </div>
        
        {totalScheduled > 0 ? (
          <TimelineView 
            schedule={todaySchedule}
            currentTime={currentTimeString}
            onScheduleUpdate={handleScheduleUpdate}
            onTimeChange={(itemId: string, newTime: string) => {
              // Handle timeline drag and drop time changes
              console.log(`Moving item ${itemId} to ${newTime}`)
              handleScheduleUpdate(todaySchedule.map(item => 
                item.id === itemId ? { ...item, time: newTime } : item
              ))
            }}
            showConflictManager={true}
            enableDragDrop={true}
            enableKeyboardShortcuts={true}
            historicalData={[]} // Could be populated from localStorage in the future
            key={refreshTrigger} // Force re-render when schedule updates
          />
        ) : (
          <div className="empty-timeline">
            <div className="empty-state">
              <div className="empty-icon">📅</div>
              <h3>今日暫無排程</h3>
              <p>點擊上方的「智能排程」按鈕來自動安排您的任務</p>
            </div>
          </div>
        )}
      </section>

      {/* Urgent Tasks Alert */}
      {unscheduledUrgent.length > 0 && (
        <UrgentTasksSection 
          urgentTasks={unscheduledUrgent}
          onScheduleTask={scheduleExistingTodo}
        />
      )}

      {/* Task Management Section */}
      <section className="task-management">
        <div className="section-header">
          <h2>📋 任務管理</h2>
          <div className="task-count">
            {todosWithSchedulingStatus.filter(t => !t.completed).length} 個任務
          </div>
        </div>
        
        <div className="task-list">
          {todosWithSchedulingStatus.filter(t => !t.completed).length > 0 ? (
            todosWithSchedulingStatus
              .filter(todo => !todo.completed)
              .sort((a, b) => {
                // Sort by priority first (urgent -> important -> not urgent)
                const priorityOrder = {
                  [Priority.URGENT_IMPORTANT]: 4,
                  [Priority.URGENT_NOT_IMPORTANT]: 3,
                  [Priority.IMPORTANT_NOT_URGENT]: 2,
                  [Priority.NOT_URGENT_NOT_IMPORTANT]: 1
                }
                return priorityOrder[b.priority] - priorityOrder[a.priority]
              })
              .map(todo => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  onToggle={() => toggleTodo(todo.id)}
                  onEdit={() => setEditingTodo(todo)}
                  onDelete={() => deleteTodo(todo.id)}
                  showProject={true}
                  showSchedulingStatus={true}
                />
              ))
          ) : (
            <div className="empty-tasks">
              <div className="empty-icon">✨</div>
              <h3>所有任務已完成！</h3>
              <p>恭喜您完成了所有任務，可以休息一下了</p>
            </div>
          )}
        </div>
      </section>

      {/* Additional Today Info */}
      <section className="today-summary">
        <div className="summary-cards">
          <div className="summary-card priority-breakdown">
            <h3>📊 優先級分佈</h3>
            <div className="priority-stats">
              {Object.entries(Priority).map(([key, priority]) => {
                const count = todosWithSchedulingStatus.filter(t => 
                  t.priority === priority && !t.completed
                ).length
                const config = PriorityConfigs[priority]
                
                return (
                  <div key={key} className="priority-stat">
                    <span 
                      className="priority-dot"
                      style={{ backgroundColor: config.color }}
                    />
                    <span className="priority-name">{config.label}</span>
                    <span className="priority-count">{count}</span>
                  </div>
                )
              })}
            </div>
          </div>
          
          <div className="summary-card scheduling-tips">
            <h3>💡 今日建議</h3>
            <div className="tips-list">
              {unscheduledUrgent.length > 0 && (
                <div className="tip urgent">
                  ⚠️ 有 {unscheduledUrgent.length} 個緊急任務需要安排
                </div>
              )}
              {totalScheduled === 0 && importantTasks.length > 0 && (
                <div className="tip schedule">
                  📅 建議使用智能排程安排您的 {importantTasks.length} 個重要任務
                </div>
              )}
              {totalScheduled > 0 && completedSlots === 0 && (
                <div className="tip start">
                  🚀 開始您的第一個番茄鐘吧！
                </div>
              )}
              {completedSlots > 0 && completedSlots === totalScheduled && (
                <div className="tip complete">
                  🎉 今日所有任務已完成！辛苦了！
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Edit Modal */}
      {editingTodo && (
        <TodoEditModal
          todo={editingTodo}
          isOpen={true}
          onClose={() => setEditingTodo(null)}
          onSave={(id, updates) => {
            editTodo(id, updates)
            setEditingTodo(null)
          }}
        />
      )}

      {/* Quick Add Modal */}
      <QuickActionModal
        isOpen={showQuickAddModal}
        actionType="addTask"
        onClose={() => setShowQuickAddModal(false)}
        onTaskAdd={handleTaskAdd}
      />
    </div>
  )
}