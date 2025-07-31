import React, { useState, useEffect } from 'react'
import { MagicButton } from '../MagicButton'
import { useProjects } from '../../context/ProjectContext'
import { BasicSchedulingEngine } from '../../algorithms/basic-scheduling'
import { MockDataFactory } from '../../utils/__tests__/mockData'
import type { Todo } from '../../types/todo'
import type { 
  PomodoroTask
} from '../../types/pomodoro-task'

import type { 
  SchedulingResult
} from '../../types/scheduling'

interface SmartTaskEditorProps {
  todo: Todo | null
  isOpen: boolean
  onClose: () => void
  onSave: (id: string, updates: Partial<Todo>) => void
  onSchedule?: (task: PomodoroTask, schedule: SchedulingResult) => void
}

/**
 * 智慧任務編輯器
 * 結合基礎任務編輯與智慧排程功能
 */
export const SmartTaskEditor: React.FC<SmartTaskEditorProps> = ({
  todo,
  isOpen,
  onClose,
  onSave,
  onSchedule
}) => {
  const { projects } = useProjects()
  const [schedulingEngine] = useState(new BasicSchedulingEngine())
  
  // 基礎表單狀態
  const [formData, setFormData] = useState({
    text: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    dueDate: '',
    projectId: '',
    // 智慧排程相關欄位
    estimatedPomodoros: 4,
    enableSmartScheduling: false,
    maxDailyPomodoros: 6,
    preferredStartTime: '09:00'
  })
  
  // 排程狀態
  const [schedulingResult, setSchedulingResult] = useState<SchedulingResult | null>(null)
  const [isScheduling, setIsScheduling] = useState(false)
  const [showSchedulingPreview, setShowSchedulingPreview] = useState(false)
  
  // 錯誤處理
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'basic' | 'scheduling'>('basic')

  // 初始化表單數據
  useEffect(() => {
    setError(null)
    setSchedulingResult(null)
    setShowSchedulingPreview(false)
    
    if (todo) {
      try {
        let dueDateString = ''
        if (todo.dueDate) {
          const date = todo.dueDate instanceof Date ? todo.dueDate : new Date(todo.dueDate)
          if (!isNaN(date.getTime())) {
            dueDateString = date.toISOString().slice(0, 16)
          }
        }
        
        setFormData({
          text: todo.text,
          priority: todo.priority || 'medium',
          dueDate: dueDateString,
          projectId: todo.projectId || '',
          estimatedPomodoros: 4, // 預設值
          enableSmartScheduling: false,
          maxDailyPomodoros: 6,
          preferredStartTime: '09:00'
        })
      } catch (err) {
        console.error('Error initializing form data:', err)
        setError('無法載入任務資料')
      }
    }
  }, [todo])

  /**
   * 執行智慧排程預覽
   */
  const executeSmartScheduling = async () => {
    if (!todo || !formData.dueDate) {
      setError('請先設定截止日期才能使用智慧排程')
      return
    }

    setIsScheduling(true)
    setError(null)

    try {
      // 建立 PomodoroTask 物件
      const pomodoroTask = MockDataFactory.createMockPomodoroTask({
        id: todo.id,
        text: formData.text,
        estimatedPomodoros: formData.estimatedPomodoros,
        dueDate: new Date(formData.dueDate),
        priority: formData.priority,
        isAutoScheduled: true,
        scheduledSlots: [],
        subtasks: [],
        isSubdivided: false
      })

      // 執行排程
      const result = await schedulingEngine.scheduleTask(
        pomodoroTask,
        new Date(formData.dueDate),
        {
          maxDailyPomodoros: formData.maxDailyPomodoros,
          preferredDistributionStrategy: 'even',
          allowOvertimeScheduling: false,
          preferredWorkingHours: {
            start: formData.preferredStartTime,
            end: '18:00'
          }
        }
      )

      setSchedulingResult(result)
      setShowSchedulingPreview(true)

      if (result.success) {
        console.log('✅ 智慧排程成功:', result)
      } else {
        setError(`排程失敗: ${result.message}`)
      }

    } catch (err) {
      console.error('❌ 智慧排程錯誤:', err)
      setError(`排程執行失敗: ${err instanceof Error ? err.message : '未知錯誤'}`)
    } finally {
      setIsScheduling(false)
    }
  }

  /**
   * 確認並應用排程
   */
  const applyScheduling = () => {
    if (!schedulingResult || !todo) return

    // 建立完整的 PomodoroTask
    const pomodoroTask = MockDataFactory.createMockPomodoroTask({
      id: todo.id,
      text: formData.text,
      estimatedPomodoros: formData.estimatedPomodoros,
      dueDate: new Date(formData.dueDate),
      priority: formData.priority,
      isAutoScheduled: true,
      scheduledSlots: schedulingResult.scheduledSlots,
      subtasks: schedulingResult.suggestedSubtasks,
      isSubdivided: schedulingResult.suggestedSubtasks.length > 0
    })

    // 回調給父組件
    if (onSchedule) {
      onSchedule(pomodoroTask, schedulingResult)
    }

    // 保存基礎任務資料
    handleSave()

    console.log('✅ 智慧排程已應用:', pomodoroTask)
  }

  /**
   * 保存任務
   */
  const handleSave = () => {
    if (!todo) return

    try {
      const updates: Partial<Todo> = {
        text: formData.text.trim(),
        priority: formData.priority,
        dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
        projectId: formData.projectId || undefined
      }

      onSave(todo.id, updates)
      
      if (!formData.enableSmartScheduling) {
        onClose()
      }
    } catch (err) {
      console.error('Error saving todo:', err)
      setError('儲存任務時發生錯誤')
    }
  }

  /**
   * 取消編輯
   */
  const handleCancel = () => {
    setSchedulingResult(null)
    setShowSchedulingPreview(false)
    onClose()
  }

  if (!isOpen || !todo) return null

  return (
    <div 
      className="modal-overlay" 
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}
    >
      <div 
        className="modal-content smart-task-editor" 
        onClick={(e) => e.stopPropagation()}
        style={{ 
          maxWidth: '900px', 
          width: '95vw',
          maxHeight: '90vh',
          backgroundColor: '#1a202c',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          border: '1px solid #2d3748'
        }}
      >
        {/* 標題欄 */}
        <div 
          className="modal-header"
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '20px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <h3 style={{ 
            color: 'white', 
            margin: 0, 
            fontSize: '1.5rem',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            🚀 智慧任務編輯器
          </h3>
          <button 
            className="close-button" 
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              color: 'white',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              cursor: 'pointer',
              fontSize: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => (e.target as HTMLElement).style.backgroundColor = 'rgba(255, 255, 255, 0.3)'}
            onMouseOut={(e) => (e.target as HTMLElement).style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
          >
            ✕
          </button>
        </div>

        {/* 分頁導航 */}
        <div 
          className="tab-navigation" 
          style={{ 
            display: 'flex', 
            backgroundColor: '#2d3748',
            borderBottom: '1px solid #4a5568'
          }}
        >
          <button 
            className={`tab-button ${activeTab === 'basic' ? 'active' : ''}`}
            onClick={() => setActiveTab('basic')}
            style={{
              flex: 1,
              padding: '16px 24px',
              border: 'none',
              background: activeTab === 'basic' 
                ? 'linear-gradient(135deg, #4299e1 0%, #667eea 100%)' 
                : 'transparent',
              color: activeTab === 'basic' ? 'white' : '#a0aec0',
              cursor: 'pointer',
              fontWeight: activeTab === 'basic' ? 'bold' : 'normal',
              fontSize: '16px',
              transition: 'all 0.3s ease',
              borderBottom: activeTab === 'basic' ? '3px solid #4299e1' : '3px solid transparent'
            }}
            onMouseOver={(e) => {
              if (activeTab !== 'basic') {
                (e.target as HTMLElement).style.backgroundColor = 'rgba(66, 153, 225, 0.1)';
                (e.target as HTMLElement).style.color = '#cbd5e0'
              }
            }}
            onMouseOut={(e) => {
              if (activeTab !== 'basic') {
                (e.target as HTMLElement).style.backgroundColor = 'transparent';
                (e.target as HTMLElement).style.color = '#a0aec0'
              }
            }}
          >
            📝 基本資訊
          </button>
          <button 
            className={`tab-button ${activeTab === 'scheduling' ? 'active' : ''}`}
            onClick={() => setActiveTab('scheduling')}
            style={{
              flex: 1,
              padding: '16px 24px',
              border: 'none',
              background: activeTab === 'scheduling' 
                ? 'linear-gradient(135deg, #4299e1 0%, #667eea 100%)' 
                : 'transparent',
              color: activeTab === 'scheduling' ? 'white' : '#a0aec0',
              cursor: 'pointer',
              fontWeight: activeTab === 'scheduling' ? 'bold' : 'normal',
              fontSize: '16px',
              transition: 'all 0.3s ease',
              borderBottom: activeTab === 'scheduling' ? '3px solid #4299e1' : '3px solid transparent'
            }}
            onMouseOver={(e) => {
              if (activeTab !== 'scheduling') {
                (e.target as HTMLElement).style.backgroundColor = 'rgba(66, 153, 225, 0.1)';
                (e.target as HTMLElement).style.color = '#cbd5e0'
              }
            }}
            onMouseOut={(e) => {
              if (activeTab !== 'scheduling') {
                (e.target as HTMLElement).style.backgroundColor = 'transparent';
                (e.target as HTMLElement).style.color = '#a0aec0'
              }
            }}
          >
            🍅 智慧排程
          </button>
        </div>

        <div 
          className="smart-task-editor-content"
          style={{
            padding: '24px',
            backgroundColor: '#1a202c',
            maxHeight: 'calc(90vh - 140px)',
            overflowY: 'auto'
          }}
        >
          {error && (
            <div className="error-message" style={{ 
              color: '#fc8181',
              background: 'rgba(252, 129, 129, 0.1)',
              padding: '16px',
              borderRadius: '12px',
              marginBottom: '20px',
              border: '1px solid rgba(252, 129, 129, 0.3)',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              ⚠️ {error}
            </div>
          )}

          {/* 基本資訊分頁 */}
          {activeTab === 'basic' && (
            <div className="basic-info-tab">
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label 
                  htmlFor="task-text" 
                  style={{ 
                    color: '#e2e8f0', 
                    fontSize: '14px', 
                    fontWeight: '600',
                    marginBottom: '8px',
                    display: 'block'
                  }}
                >
                  任務內容 *
                </label>
                <input
                  id="task-text"
                  type="text"
                  value={formData.text}
                  onChange={(e) => setFormData(prev => ({ ...prev, text: e.target.value }))}
                  placeholder="輸入任務內容..."
                  required
                  style={{ 
                    width: '100%',
                    padding: '14px 16px',
                    backgroundColor: '#2d3748',
                    border: '2px solid #4a5568',
                    borderRadius: '10px',
                    fontSize: '16px',
                    color: '#e2e8f0',
                    outline: 'none',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#4299e1'
                    e.target.style.boxShadow = '0 0 0 3px rgba(66, 153, 225, 0.1)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#4a5568'
                    e.target.style.boxShadow = 'none'
                  }}
                />
              </div>

              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div className="form-group">
                  <label 
                    htmlFor="task-priority" 
                    style={{ 
                      color: '#e2e8f0', 
                      fontSize: '14px', 
                      fontWeight: '600',
                      marginBottom: '8px',
                      display: 'block'
                    }}
                  >
                    優先級
                  </label>
                  <select
                    id="task-priority"
                    value={formData.priority}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      priority: e.target.value as 'low' | 'medium' | 'high' 
                    }))}
                    style={{ 
                      width: '100%',
                      padding: '14px 16px',
                      backgroundColor: '#2d3748',
                      border: '2px solid #4a5568',
                      borderRadius: '10px',
                      fontSize: '16px',
                      color: '#e2e8f0',
                      outline: 'none',
                      cursor: 'pointer',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="low">🟢 低</option>
                    <option value="medium">🟡 中</option>
                    <option value="high">🔴 高</option>
                  </select>
                </div>

                <div className="form-group">
                  <label 
                    htmlFor="task-project" 
                    style={{ 
                      color: '#e2e8f0', 
                      fontSize: '14px', 
                      fontWeight: '600',
                      marginBottom: '8px',
                      display: 'block'
                    }}
                  >
                    所屬專案
                  </label>
                  <select
                    id="task-project"
                    value={formData.projectId}
                    onChange={(e) => setFormData(prev => ({ ...prev, projectId: e.target.value }))}
                    style={{ 
                      width: '100%',
                      padding: '14px 16px',
                      backgroundColor: '#2d3748',
                      border: '2px solid #4a5568',
                      borderRadius: '10px',
                      fontSize: '16px',
                      color: '#e2e8f0',
                      outline: 'none',
                      cursor: 'pointer',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="">無專案</option>
                    {projects.map(project => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label 
                  htmlFor="task-due-date" 
                  style={{ 
                    color: '#e2e8f0', 
                    fontSize: '14px', 
                    fontWeight: '600',
                    marginBottom: '8px',
                    display: 'block'
                  }}
                >
                  截止日期
                </label>
                <input
                  id="task-due-date"
                  type="datetime-local"
                  value={formData.dueDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                  style={{ 
                    width: '100%',
                    padding: '14px 16px',
                    backgroundColor: '#2d3748',
                    border: '2px solid #4a5568',
                    borderRadius: '10px',
                    fontSize: '16px',
                    color: '#e2e8f0',
                    outline: 'none',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#4299e1'
                    e.target.style.boxShadow = '0 0 0 3px rgba(66, 153, 225, 0.1)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#4a5568'
                    e.target.style.boxShadow = 'none'
                  }}
                />
                <small style={{ color: '#a0aec0', fontSize: '12px', marginTop: '6px', display: 'block' }}>
                  設置截止日期後可使用智慧排程功能
                </small>
              </div>

              <div className="form-group">
                <div style={{ 
                  background: 'rgba(66, 153, 225, 0.1)',
                  padding: '16px',
                  borderRadius: '10px',
                  border: '1px solid rgba(66, 153, 225, 0.3)'
                }}>
                  <label style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px',
                    color: '#e2e8f0',
                    fontSize: '14px'
                  }}>
                    <input
                      type="checkbox"
                      checked={todo.completed}
                      readOnly
                      disabled
                      style={{
                        width: '18px',
                        height: '18px',
                        accentColor: '#4299e1'
                      }}
                    />
                    <span>
                      任務狀態：{todo.completed ? '✅ 已完成' : '⏳ 進行中'}
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* 智慧排程分頁 */}
          {activeTab === 'scheduling' && (
            <div className="scheduling-tab">
              <div className="scheduling-settings" style={{ marginBottom: '28px' }}>
                <h4 style={{ 
                  marginBottom: '20px', 
                  color: '#e2e8f0',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  🧠 排程設定
                </h4>
                
                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                  <div className="form-group">
                    <label 
                      htmlFor="estimated-pomodoros"
                      style={{ 
                        color: '#e2e8f0', 
                        fontSize: '14px', 
                        fontWeight: '600',
                        marginBottom: '8px',
                        display: 'block'
                      }}
                    >
                      預估番茄鐘數量
                    </label>
                    <input
                      id="estimated-pomodoros"
                      type="number"
                      min="1"
                      max="50"
                      value={formData.estimatedPomodoros}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        estimatedPomodoros: parseInt(e.target.value) || 1 
                      }))}
                      style={{ 
                        width: '100%',
                        padding: '14px 16px',
                        backgroundColor: '#2d3748',
                        border: '2px solid #4a5568',
                        borderRadius: '10px',
                        fontSize: '16px',
                        color: '#e2e8f0',
                        outline: 'none',
                        transition: 'border-color 0.2s, box-shadow 0.2s',
                        boxSizing: 'border-box'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#4299e1'
                        e.target.style.boxShadow = '0 0 0 3px rgba(66, 153, 225, 0.1)'
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#4a5568'
                        e.target.style.boxShadow = 'none'
                      }}
                    />
                    <small style={{ color: '#a0aec0', fontSize: '12px', marginTop: '6px', display: 'block' }}>
                      約 {formData.estimatedPomodoros * 25} 分鐘
                    </small>
                  </div>

                  <div className="form-group">
                    <label 
                      htmlFor="max-daily-pomodoros"
                      style={{ 
                        color: '#e2e8f0', 
                        fontSize: '14px', 
                        fontWeight: '600',
                        marginBottom: '8px',
                        display: 'block'
                      }}
                    >
                      每日最大番茄鐘
                    </label>
                    <input
                      id="max-daily-pomodoros"
                      type="number"
                      min="1"
                      max="12"
                      value={formData.maxDailyPomodoros}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        maxDailyPomodoros: parseInt(e.target.value) || 6 
                      }))}
                      style={{ 
                        width: '100%',
                        padding: '14px 16px',
                        backgroundColor: '#2d3748',
                        border: '2px solid #4a5568',
                        borderRadius: '10px',
                        fontSize: '16px',
                        color: '#e2e8f0',
                        outline: 'none',
                        transition: 'border-color 0.2s, box-shadow 0.2s',
                        boxSizing: 'border-box'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#4299e1'
                        e.target.style.boxShadow = '0 0 0 3px rgba(66, 153, 225, 0.1)'
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#4a5568'
                        e.target.style.boxShadow = 'none'
                      }}
                    />
                  </div>

                  <div className="form-group">
                    <label 
                      htmlFor="preferred-start-time"
                      style={{ 
                        color: '#e2e8f0', 
                        fontSize: '14px', 
                        fontWeight: '600',
                        marginBottom: '8px',
                        display: 'block'
                      }}
                    >
                      偏好開始時間
                    </label>
                    <input
                      id="preferred-start-time"
                      type="time"
                      value={formData.preferredStartTime}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        preferredStartTime: e.target.value 
                      }))}
                      style={{ 
                        width: '100%',
                        padding: '14px 16px',
                        backgroundColor: '#2d3748',
                        border: '2px solid #4a5568',
                        borderRadius: '10px',
                        fontSize: '16px',
                        color: '#e2e8f0',
                        outline: 'none',
                        transition: 'border-color 0.2s, box-shadow 0.2s',
                        boxSizing: 'border-box'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#4299e1'
                        e.target.style.boxShadow = '0 0 0 3px rgba(66, 153, 225, 0.1)'
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#4a5568'
                        e.target.style.boxShadow = 'none'
                      }}
                    />
                  </div>
                </div>

                <div className="scheduling-actions" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div
                    style={{
                      background: !formData.dueDate || isScheduling 
                        ? '#4a5568' 
                        : 'linear-gradient(135deg, #4299e1 0%, #667eea 100%)',
                      border: 'none',
                      color: 'white',
                      padding: '12px 24px',
                      borderRadius: '10px',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: !formData.dueDate || isScheduling ? 'not-allowed' : 'pointer',
                      transition: 'all 0.3s ease',
                      boxShadow: !formData.dueDate || isScheduling ? 'none' : '0 4px 15px rgba(66, 153, 225, 0.4)',
                      display: 'inline-block'
                    }}
                  >
                    <MagicButton
                      onClick={executeSmartScheduling}
                      disabled={!formData.dueDate || isScheduling}
                      variant="primary"
                    >
                      {isScheduling ? '🔄 排程中...' : '🚀 生成智慧排程'}
                    </MagicButton>
                  </div>
                  
                  {schedulingResult && (
                    <div
                      style={{
                        background: 'transparent',
                        border: '2px solid #4299e1',
                        color: '#4299e1',
                        padding: '12px 20px',
                        borderRadius: '10px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        display: 'inline-block'
                      }}
                      onMouseOver={(e) => {
                        (e.target as HTMLElement).style.backgroundColor = 'rgba(66, 153, 225, 0.1)'
                      }}
                      onMouseOut={(e) => {
                        (e.target as HTMLElement).style.backgroundColor = 'transparent'
                      }}
                    >
                      <MagicButton
                        onClick={() => setShowSchedulingPreview(!showSchedulingPreview)}
                        variant="secondary"
                      >
                        {showSchedulingPreview ? '👁️ 隱藏預覽' : '👁️ 顯示預覽'}
                      </MagicButton>
                    </div>
                  )}
                </div>
              </div>

              {/* 排程結果預覽 */}
              {showSchedulingPreview && schedulingResult && (
                <div className="scheduling-preview" style={{
                  background: schedulingResult.success 
                    ? 'linear-gradient(135deg, rgba(56, 178, 172, 0.1) 0%, rgba(66, 153, 225, 0.1) 100%)'
                    : 'rgba(252, 129, 129, 0.1)',
                  border: `2px solid ${schedulingResult.success ? '#38b2ac' : '#fc8181'}`,
                  borderRadius: '16px',
                  padding: '24px',
                  marginBottom: '24px',
                  backdropFilter: 'blur(10px)'
                }}>
                  <h4 style={{ 
                    color: schedulingResult.success ? '#38b2ac' : '#fc8181',
                    marginBottom: '20px',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    📊 排程預覽結果
                  </h4>

                  {schedulingResult.success ? (
                    <div className="success-preview">
                      <div className="result-summary" style={{ 
                        background: 'rgba(45, 55, 72, 0.8)',
                        padding: '20px',
                        borderRadius: '12px',
                        marginBottom: '20px',
                        border: '1px solid #4a5568'
                      }}>
                        <div style={{ fontWeight: 'bold', color: '#e2e8f0', marginBottom: '12px', fontSize: '16px' }}>
                          ✅ {schedulingResult.message}
                        </div>
                        <div style={{ 
                          display: 'grid', 
                          gridTemplateColumns: 'repeat(3, 1fr)', 
                          gap: '16px', 
                          fontSize: '14px',
                          color: '#cbd5e0'
                        }}>
                          <div style={{ 
                            padding: '8px 12px', 
                            background: 'rgba(66, 153, 225, 0.2)', 
                            borderRadius: '8px',
                            textAlign: 'center'
                          }}>
                            <div style={{ fontSize: '12px', marginBottom: '2px' }}>信心度</div>
                            <div style={{ fontWeight: 'bold', color: '#4299e1' }}>
                              {(schedulingResult.confidence * 100).toFixed(1)}%
                            </div>
                          </div>
                          <div style={{ 
                            padding: '8px 12px', 
                            background: 'rgba(56, 178, 172, 0.2)', 
                            borderRadius: '8px',
                            textAlign: 'center'
                          }}>
                            <div style={{ fontSize: '12px', marginBottom: '2px' }}>複雜度</div>
                            <div style={{ fontWeight: 'bold', color: '#38b2ac' }}>
                              {schedulingResult.complexity.category}
                            </div>
                          </div>
                          <div style={{ 
                            padding: '8px 12px', 
                            background: 'rgba(102, 126, 234, 0.2)', 
                            borderRadius: '8px',
                            textAlign: 'center'
                          }}>
                            <div style={{ fontSize: '12px', marginBottom: '2px' }}>時間段</div>
                            <div style={{ fontWeight: 'bold', color: '#667eea' }}>
                              {schedulingResult.scheduledSlots.length} 個
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="schedule-timeline" style={{ maxHeight: '320px', overflowY: 'auto' }}>
                        <h5 style={{ 
                          marginBottom: '16px', 
                          color: '#e2e8f0',
                          fontSize: '16px',
                          fontWeight: 'bold'
                        }}>
                          📅 時間安排
                        </h5>
                        {schedulingResult.scheduledSlots.map((slot, index) => (
                          <div key={slot.id} style={{
                            background: 'rgba(45, 55, 72, 0.8)',
                            border: '1px solid #4a5568',
                            borderRadius: '12px',
                            padding: '16px',
                            marginBottom: '12px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            transition: 'transform 0.2s ease',
                            cursor: 'pointer'
                          }}
                          onMouseOver={(e) => (e.target as HTMLElement).style.transform = 'translateY(-2px)'}
                          onMouseOut={(e) => (e.target as HTMLElement).style.transform = 'translateY(0)'}
                          >
                            <div>
                              <div style={{ 
                                fontWeight: 'bold', 
                                color: '#e2e8f0',
                                marginBottom: '4px',
                                fontSize: '15px'
                              }}>
                                第 {index + 1} 天 - {slot.date.toLocaleDateString('zh-TW', { 
                                  month: 'short', 
                                  day: 'numeric',
                                  weekday: 'short'
                                })}
                              </div>
                              <div style={{ 
                                fontSize: '13px', 
                                color: '#a0aec0',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                              }}>
                                <span>🕒 {slot.startTime} - {slot.endTime}</span>
                                <span>⏱️ {slot.pomodoroCount * 25 + (slot.pomodoroCount - 1) * 5} 分鐘</span>
                              </div>
                            </div>
                            <div style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '12px',
                              background: 'rgba(66, 153, 225, 0.2)',
                              padding: '8px 12px',
                              borderRadius: '8px'
                            }}>
                              <span style={{ fontSize: '16px' }}>
                                {Array.from({ length: slot.pomodoroCount }, () => '🍅').join('')}
                              </span>
                              <span style={{ 
                                fontSize: '14px', 
                                color: '#4299e1',
                                fontWeight: 'bold'
                              }}>
                                {slot.pomodoroCount} 個
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="apply-scheduling" style={{ marginTop: '20px' }}>
                        <div
                          style={{ 
                            width: '100%',
                            background: 'linear-gradient(135deg, #38b2ac 0%, #4299e1 100%)',
                            border: 'none',
                            color: 'white',
                            padding: '16px 24px',
                            borderRadius: '12px',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 6px 20px rgba(56, 178, 172, 0.4)'
                          }}
                          onMouseOver={(e) => {
                            (e.target as HTMLElement).style.transform = 'translateY(-2px)';
                            (e.target as HTMLElement).style.boxShadow = '0 8px 25px rgba(56, 178, 172, 0.5)'
                          }}
                          onMouseOut={(e) => {
                            (e.target as HTMLElement).style.transform = 'translateY(0)';
                            (e.target as HTMLElement).style.boxShadow = '0 6px 20px rgba(56, 178, 172, 0.4)'
                          }}
                        >
                          <MagicButton
                            onClick={applyScheduling}
                            variant="success"
                          >
                            ✅ 確認並應用此排程
                          </MagicButton>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="error-preview" style={{ 
                      color: '#fc8181',
                      padding: '16px',
                      background: 'rgba(45, 55, 72, 0.8)',
                      borderRadius: '10px',
                      fontSize: '15px'
                    }}>
                      ❌ {schedulingResult.message}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 底部操作按鈕 */}
          <div className="modal-actions" style={{ 
            display: 'flex', 
            justifyContent: 'flex-end',
            gap: '16px',
            marginTop: '32px',
            paddingTop: '24px',
            borderTop: '1px solid #4a5568'
          }}>
            <div
              style={{
                background: 'transparent',
                border: '2px solid #718096',
                color: '#718096',
                padding: '12px 24px',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'inline-block'
              }}
              onMouseOver={(e) => {
                (e.target as HTMLElement).style.backgroundColor = 'rgba(113, 128, 150, 0.1)';
                (e.target as HTMLElement).style.color = '#a0aec0'
              }}
              onMouseOut={(e) => {
                (e.target as HTMLElement).style.backgroundColor = 'transparent';
                (e.target as HTMLElement).style.color = '#718096'
              }}
            >
              <MagicButton
                variant="secondary"
                onClick={handleCancel}
              >
                取消
              </MagicButton>
            </div>
            <div
              style={{
                background: !formData.text.trim() 
                  ? '#4a5568' 
                  : 'linear-gradient(135deg, #4299e1 0%, #667eea 100%)',
                border: 'none',
                color: 'white',
                padding: '12px 28px',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: !formData.text.trim() ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: !formData.text.trim() 
                  ? 'none' 
                  : '0 4px 15px rgba(66, 153, 225, 0.4)',
                display: 'inline-block'
              }}
              onMouseOver={(e) => {
                if (formData.text.trim()) {
                  (e.target as HTMLElement).style.transform = 'translateY(-1px)';
                  (e.target as HTMLElement).style.boxShadow = '0 6px 20px rgba(66, 153, 225, 0.5)'
                }
              }}
              onMouseOut={(e) => {
                if (formData.text.trim()) {
                  (e.target as HTMLElement).style.transform = 'translateY(0)';
                  (e.target as HTMLElement).style.boxShadow = '0 4px 15px rgba(66, 153, 225, 0.4)'
                }
              }}
            >
              <MagicButton
                variant="primary"
                disabled={!formData.text.trim()}
                onClick={handleSave}
              >
                {schedulingResult ? '💾 保存任務' : '💾 保存變更'}
              </MagicButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}