/**
 * SchedulingDemo - Demonstration component for scheduling functionality
 * Part of MVP Implementation Guide Day 3-4
 */

import React, { useState } from 'react'
import { useTodosWithScheduling } from '../../hooks/useTodosWithScheduling'
import { useScheduling } from '../../context/SchedulingContext'
import { SchedulingIndicator, QuickScheduleButton, TodayScheduleSummary } from './SchedulingIndicator'
import { Priority } from '../../types/priority'
import { MagicButton } from '../MagicButton'

interface SchedulingDemoProps {
  className?: string
}

export const SchedulingDemo: React.FC<SchedulingDemoProps> = ({ className = '' }) => {
  const { todosWithSchedulingStatus, addTodoWithScheduling, scheduleExistingTodo } = useTodosWithScheduling()
  const { isScheduling, lastSchedulingResult, preferences, updatePreferences } = useScheduling()
  const [demoTask, setDemoTask] = useState('')

  const handleCreateScheduledTask = async () => {
    if (!demoTask.trim()) return

    try {
      const result = await addTodoWithScheduling({
        text: demoTask,
        priority: Priority.IMPORTANT_NOT_URGENT,
        totalPomodoros: 2,
        autoSchedule: true
      })

      if (result.schedulingResult?.success) {
        console.log('✅ 任務已創建並排程', result)
        setDemoTask('')
      } else {
        console.warn('⚠️ 任務已創建但排程失敗', result)
      }
    } catch (error) {
      console.error('❌ 創建任務失敗', error)
    }
  }

  const handleScheduleExisting = async (todoId: string) => {
    try {
      const result = await scheduleExistingTodo(todoId)
      if (result.success) {
        console.log('✅ 任務排程成功', result)
      } else {
        console.warn('⚠️ 任務排程失敗', result)
      }
    } catch (error) {
      console.error('❌ 排程失敗', error)
    }
  }

  const handleUpdateWorkingHours = () => {
    updatePreferences({
      workingHours: {
        start: '10:00',
        end: '17:00'
      }
    })
  }

  return (
    <div className={`scheduling-demo ${className}`}>
      <div className="demo-header">
        <h2>🤖 智能排程系統演示</h2>
        <p>使用番茄鐘技術自動安排任務時間</p>
      </div>

      {/* Today's Schedule Summary */}
      <TodayScheduleSummary />

      {/* Demo Task Creation */}
      <div className="demo-section">
        <h3>📝 創建自動排程任務</h3>
        <div className="task-creator">
          <input
            type="text"
            value={demoTask}
            onChange={(e) => setDemoTask(e.target.value)}
            placeholder="輸入任務名稱..."
            className="demo-input"
            onKeyPress={(e) => e.key === 'Enter' && handleCreateScheduledTask()}
          />
          <MagicButton
            onClick={handleCreateScheduledTask}
            disabled={!demoTask.trim() || isScheduling}
            variant="primary"
          >
            {isScheduling ? '排程中...' : '創建 + 排程'}
          </MagicButton>
        </div>
        
        {lastSchedulingResult && (
          <div className={`scheduling-result ${lastSchedulingResult.success ? 'success' : 'error'}`}>
            <strong>{lastSchedulingResult.success ? '✅' : '❌'}</strong>
            <span>{lastSchedulingResult.message}</span>
            {lastSchedulingResult.conflicts.length > 0 && (
              <ul className="conflicts-list">
                {lastSchedulingResult.conflicts.map((conflict, index) => (
                  <li key={index}>{conflict}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Existing Todos with Scheduling */}
      <div className="demo-section">
        <h3>📋 現有任務排程狀態</h3>
        <div className="todos-list">
          {todosWithSchedulingStatus.length === 0 ? (
            <p className="no-todos">暫無任務</p>
          ) : (
            todosWithSchedulingStatus.slice(0, 5).map(todo => (
              <div key={todo.id} className="todo-item-with-scheduling">
                <div className="todo-main">
                  <span className="todo-text">{todo.text}</span>
                  <SchedulingIndicator todo={todo} />
                </div>
                
                <div className="todo-scheduling-actions">
                  <SchedulingIndicator todo={todo} showDetails />
                  
                  {!todo.isScheduled && todo.canAutoSchedule && (
                    <QuickScheduleButton
                      todo={todo}
                      onSchedule={handleScheduleExisting}
                      disabled={isScheduling}
                    />
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Preferences Demo */}
      <div className="demo-section">
        <h3>⚙️ 排程偏好設定</h3>
        <div className="preferences-demo">
          <div className="preference-item">
            <label>工作時間:</label>
            <span>{preferences.workingHours.start} - {preferences.workingHours.end}</span>
            <MagicButton
              onClick={handleUpdateWorkingHours}
              variant="secondary"
              size="small"
            >
              改為 10:00-17:00
            </MagicButton>
          </div>
          
          <div className="preference-item">
            <label>每日最大番茄鐘數:</label>
            <span>{preferences.maxPomodorosPerDay}</span>
          </div>
          
          <div className="preference-item">
            <label>偏好批次大小:</label>
            <span>{preferences.preferredBatchSize} 個連續番茄鐘</span>
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="demo-section">
        <h3>📊 系統狀態</h3>
        <div className="system-status">
          <div className="status-item">
            <span className="status-label">排程服務:</span>
            <span className={`status-value ${isScheduling ? 'busy' : 'ready'}`}>
              {isScheduling ? '🔄 處理中' : '✅ 就緒'}
            </span>
          </div>
          
          <div className="status-item">
            <span className="status-label">已排程任務:</span>
            <span className="status-value">
              {todosWithSchedulingStatus.filter(t => t.isScheduled).length} 個
            </span>
          </div>
          
          <div className="status-item">
            <span className="status-label">可自動排程:</span>
            <span className="status-value">
              {todosWithSchedulingStatus.filter(t => t.canAutoSchedule && !t.isScheduled).length} 個
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Additional styles for the demo component
const demoStyles = `
.scheduling-demo {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.demo-header {
  text-align: center;
  margin-bottom: 32px;
}

.demo-header h2 {
  margin: 0 0 8px 0;
  color: var(--text-primary, #212529);
}

.demo-header p {
  margin: 0;
  color: var(--text-secondary, #6c757d);
}

.demo-section {
  margin: 24px 0;
  padding: 20px;
  background: var(--bg-secondary, #f8f9fa);
  border-radius: 12px;
  border: 1px solid var(--border-color, #e1e5e9);
}

.demo-section h3 {
  margin: 0 0 16px 0;
  font-size: 1.1em;
  color: var(--text-primary, #212529);
}

.task-creator {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.demo-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid var(--border-color, #e1e5e9);
  border-radius: 6px;
  font-size: 1em;
}

.scheduling-result {
  padding: 12px;
  border-radius: 6px;
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.scheduling-result.success {
  background: rgba(76, 175, 80, 0.1);
  border: 1px solid rgba(76, 175, 80, 0.3);
  color: #2e7d32;
}

.scheduling-result.error {
  background: rgba(244, 67, 54, 0.1);
  border: 1px solid rgba(244, 67, 54, 0.3);
  color: #c62828;
}

.conflicts-list {
  margin: 8px 0 0 24px;
  font-size: 0.9em;
}

.todos-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.no-todos {
  text-align: center;
  color: var(--text-secondary, #6c757d);
  font-style: italic;
}

.todo-item-with-scheduling {
  padding: 12px;
  background: var(--bg-primary, #ffffff);
  border: 1px solid var(--border-color, #e1e5e9);
  border-radius: 8px;
}

.todo-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.todo-text {
  font-weight: 500;
}

.todo-scheduling-actions {
  border-top: 1px solid var(--border-light, #f1f3f4);
  padding-top: 8px;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.preferences-demo,
.system-status {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.preference-item,
.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid var(--border-light, #f1f3f4);
}

.preference-item:last-child,
.status-item:last-child {
  border-bottom: none;
}

.status-label {
  font-weight: 500;
}

.status-value.busy {
  color: #ff9800;
}

.status-value.ready {
  color: #4caf50;
}
`

// Inject styles if not already present
if (typeof document !== 'undefined' && !document.querySelector('#scheduling-demo-styles')) {
  const styleSheet = document.createElement('style')
  styleSheet.id = 'scheduling-demo-styles'
  styleSheet.textContent = demoStyles
  document.head.appendChild(styleSheet)
}