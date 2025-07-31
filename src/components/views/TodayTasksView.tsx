import React, { useState, useEffect } from 'react'
import { TodoFilter } from '../TodoFilter'
import { TodoStats } from '../TodoStats'
import { MagicButton } from '../MagicButton'
import { ProjectSelector } from '../project/ProjectSelector'
import { SmartTaskEditor } from '../todo/SmartTaskEditor'
import { ErrorBoundary } from '../ErrorBoundary'
import { useTodos } from '../../hooks/useTodos'
import { useProjects } from '../../context/ProjectContext'
import { preferencesManager } from '../../utils/preferencesManager'
import type { Todo } from '../../types/todo'

export const TodayTasksView: React.FC = () => {
  const {
    todos,
    filter,
    activeCount,
    completedCount,
    addTodo,
    toggleTodo,
    deleteTodo,
    editTodo,
    clearCompleted,
    toggleAllTodos,
    setFilter,
  } = useTodos()
  
  const { currentProject, projects } = useProjects()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'created' | 'priority' | 'alphabetical' | 'dueDate'>(
    preferencesManager.getPreferences().taskSortBy || 'created'
  )
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null)
  const [showDueDateFilter, setShowDueDateFilter] = useState<'all' | 'today' | 'overdue' | 'upcoming'>('all')
  const [showCompleted, setShowCompleted] = useState(
    preferencesManager.getPreferences().showCompletedTasks
  )

  // 監聽偏好設定變化
  useEffect(() => {
    const handlePreferencesChange = () => {
      const prefs = preferencesManager.getPreferences()
      setSortBy(prefs.taskSortBy)
      setShowCompleted(prefs.showCompletedTasks)
    }

    preferencesManager.addChangeListener(handlePreferencesChange)
    return () => preferencesManager.removeChangeListener(handlePreferencesChange)
  }, [])
  
  const totalTodos = activeCount + completedCount
  const completionRate = totalTodos > 0 ? (completedCount / totalTodos) * 100 : 0

  // Helper functions
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return '☀️ 早安！管理您的任務'
    if (hour < 18) return '🌤️ 下午好！繼續管理任務'
    return '🌙 晚上好！回顧任務成果'
  }
  
  const getDueDateStatus = (dueDate: Date | undefined) => {
    if (!dueDate) return 'none'
    
    const today = new Date()
    const due = new Date(dueDate)
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const dueStart = new Date(due.getFullYear(), due.getMonth(), due.getDate())
    
    if (dueStart < todayStart) return 'overdue'
    if (dueStart.getTime() === todayStart.getTime()) return 'today'
    if (dueStart.getTime() <= todayStart.getTime() + 7 * 24 * 60 * 60 * 1000) return 'upcoming'
    return 'future'
  }
  
  const formatDueDate = (dueDate: Date | undefined) => {
    if (!dueDate) return null
    
    const today = new Date()
    const due = new Date(dueDate)
    const status = getDueDateStatus(dueDate)
    
    if (status === 'today') return '今天'
    if (status === 'overdue') {
      const days = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24))
      return `逾期 ${days} 天`
    }
    
    return due.toLocaleDateString('zh-TW', {
      month: 'short',
      day: 'numeric',
      weekday: 'short'
    })
  }
  
  const getDueDateColor = (dueDate: Date | undefined) => {
    const status = getDueDateStatus(dueDate)
    switch (status) {
      case 'overdue': return '#ef4444'
      case 'today': return '#f59e0b'
      case 'upcoming': return '#3b82f6'
      default: return '#6b7280'
    }
  }

  const getPriorityColor = (priority: 'low' | 'medium' | 'high') => {
    switch (priority) {
      case 'high':
        return '#ef4444'
      case 'medium':
        return '#f59e0b'
      case 'low':
        return '#10b981'
      default:
        return '#6b7280'
    }
  }

  // 過濾和排序任務
  const filteredTodos = todos.filter(todo => {
    const matchesSearch = todo.text.toLowerCase().includes(searchQuery.toLowerCase())
    
    // 日期篩選
    const dueDateStatus = getDueDateStatus(todo.dueDate)
    const matchesDueDate = showDueDateFilter === 'all' || 
      (showDueDateFilter === 'today' && dueDateStatus === 'today') ||
      (showDueDateFilter === 'overdue' && dueDateStatus === 'overdue') ||
      (showDueDateFilter === 'upcoming' && (dueDateStatus === 'today' || dueDateStatus === 'upcoming'))
    
    // 根據偏好設定過濾已完成任務
    const matchesCompleted = showCompleted || !todo.completed
    
    const passes = matchesSearch && matchesDueDate && matchesCompleted
    
    return passes
  }).sort((a, b) => {
    switch (sortBy) {
      case 'priority':
        const priorityOrder = { high: 3, medium: 2, low: 1 }
        return (priorityOrder[b.priority || 'medium'] || 0) - (priorityOrder[a.priority || 'medium'] || 0)
      case 'alphabetical':
        return a.text.localeCompare(b.text)
      case 'dueDate':
        if (!a.dueDate && !b.dueDate) return 0
        if (!a.dueDate) return 1
        if (!b.dueDate) return -1
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      case 'created':
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    }
  })
  

  return (
    <div className="today-tasks-view">
      {/* 頁面標題 */}
      <div className="today-tasks__header">
        <h2 className="today-tasks__greeting">{getGreeting()}</h2>
        <p className="today-tasks__date">
          {new Date().toLocaleDateString('zh-TW', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
          })}
        </p>
      </div>

      {/* 統計區域 */}
      {totalTodos > 0 && (
        <div className="today-tasks__stats">
          <TodoStats
            totalTodos={totalTodos}
            activeTodos={activeCount}
            completedTodos={completedCount}
            completionRate={completionRate}
          />
        </div>
      )}

      {/* 專案選擇器 */}
      <div className="today-tasks__project-selector">
        <ProjectSelector />
      </div>

      {/* 工具欄 */}
      <div className="today-tasks__toolbar">
        <div className="toolbar__left">
          {/* 搜尋框 */}
          <div className="search-box">
            <span className="search-box__icon">🔍</span>
            <input
              type="text"
              className="search-box__input"
              placeholder="搜尋任務..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                className="search-box__clear"
                onClick={() => setSearchQuery('')}
                title="清除搜尋"
              >
                ✕
              </button>
            )}
          </div>

          {/* 篩選器 */}
          <div className="filter-group">
            <label className="filter-label">篩選：</label>
            <TodoFilter
              currentFilter={filter}
              onFilterChange={setFilter}
              activeCount={activeCount}
              completedCount={completedCount}
              onClearCompleted={clearCompleted}
            />
          </div>

          {/* 排序 */}
          <div className="sort-group">
            <label className="sort-label">排序：</label>
            <select
              className="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'created' | 'priority' | 'alphabetical' | 'dueDate')}
            >
              <option value="created">建立時間</option>
              <option value="priority">優先級</option>
              <option value="dueDate">截止日期</option>
              <option value="alphabetical">字母順序</option>
            </select>
          </div>
          
          {/* 日期篩選 */}
          <div className="date-filter-group">
            <label className="filter-label">日期：</label>
            <select
              className="date-filter-select"
              value={showDueDateFilter}
              onChange={(e) => setShowDueDateFilter(e.target.value as 'all' | 'today' | 'overdue' | 'upcoming')}
            >
              <option value="all">全部</option>
              <option value="today">今天</option>
              <option value="overdue">逾期</option>
              <option value="upcoming">即將到期</option>
            </select>
          </div>
        </div>

        <div className="toolbar__right">
          {/* 全選/全不選 */}
          {totalTodos > 0 && (
            <MagicButton
              onClick={toggleAllTodos}
              variant="secondary"
              size="small"
            >
              {activeCount === 0 ? '↩️ 全部未完成' : '✅ 全部完成'}
            </MagicButton>
          )}
        </div>
      </div>

      {/* 任務列表區域 */}
      <div className="today-tasks__content">
        {totalTodos === 0 ? (
          /* 空狀態 */
          <div className="empty-state">
            <div className="empty-state__icon">🎯</div>
            <h3 className="empty-state__title">還沒有任務</h3>
            <p className="empty-state__description">
              {currentProject 
                ? `在「${currentProject.name}」專案中添加第一個任務吧！`
                : '添加第一個任務，開始高效的一天！'
              }
            </p>
            <div className="empty-state__actions">
              <MagicButton
                onClick={() => {
                  // 觸發快速添加任務 - 這裡需要通過 props 或 context 來調用
                  window.dispatchEvent(new KeyboardEvent('keydown', {
                    key: 't',
                    metaKey: true
                  }))
                }}
                variant="primary"
                size="medium"
              >
                ➕ 添加第一個任務
              </MagicButton>
            </div>
          </div>
        ) : searchQuery && filteredTodos.length === 0 ? (
          /* 搜尋無結果 */
          <div className="empty-state">
            <div className="empty-state__icon">🔍</div>
            <h3 className="empty-state__title">找不到相關任務</h3>
            <p className="empty-state__description">
              沒有找到包含「{searchQuery}」的任務
            </p>
            <div className="empty-state__actions">
              <MagicButton
                onClick={() => setSearchQuery('')}
                variant="secondary"
                size="small"
              >
                清除搜尋
              </MagicButton>
            </div>
          </div>
        ) : (
          /* 任務列表 */
          <>
            {/* 進度指示器 */}
            {totalTodos > 0 && (
              <div className="progress-indicator">
                <div className="progress-indicator__bar">
                  <div 
                    className="progress-indicator__fill"
                    style={{ width: `${completionRate}%` }}
                  />
                </div>
                <span className="progress-indicator__text">
                  {completedCount} / {totalTodos} 完成 ({Math.round(completionRate)}%)
                </span>
              </div>
            )}

            {/* 優先級統計 */}
            <div className="priority-stats">
              {['high', 'medium', 'low'].map(priority => {
                const count = filteredTodos.filter(todo => 
                  !todo.completed && (todo.priority || 'medium') === priority
                ).length
                
                if (count === 0) return null
                
                return (
                  <div key={priority} className="priority-stat">
                    <div 
                      className="priority-stat__dot"
                      style={{ backgroundColor: getPriorityColor(priority as 'low' | 'medium' | 'high') }}
                    />
                    <span className="priority-stat__label">
                      {priority === 'high' ? '高' : priority === 'medium' ? '中' : '低'}優先級
                    </span>
                    <span className="priority-stat__count">{count}</span>
                  </div>
                )
              })}
            </div>

            {/* 增強任務列表 */}
            <div className="task-list-container">
              <div className="enhanced-task-list">
                {filteredTodos.map(todo => {
                  const dueStatus = getDueDateStatus(todo.dueDate)
                  const project = projects.find(p => p.id === todo.projectId)
                  
                  return (
                    <div
                      key={todo.id}
                      className={`enhanced-task-item ${todo.completed ? 'enhanced-task-item--completed' : ''} ${dueStatus === 'overdue' ? 'enhanced-task-item--overdue' : ''}`}
                    >
                      <div className="task-item__left">
                        <button
                          className={`task-checkbox ${todo.completed ? 'task-checkbox--checked' : ''}`}
                          onClick={() => toggleTodo(todo.id)}
                        >
                          {todo.completed && <span className="task-checkbox__check">✓</span>}
                        </button>
                        
                        <div className="task-content">
                          <div className="task-content__header">
                            <span className={`task-title ${todo.completed ? 'task-title--completed' : ''}`}>
                              {todo.text}
                            </span>
                            
                            {/* 優先級標籤 */}
                            {todo.priority && todo.priority !== 'medium' && (
                              <span 
                                className="task-priority-badge"
                                style={{ backgroundColor: getPriorityColor(todo.priority) }}
                              >
                                {todo.priority === 'high' ? '高' : '低'}
                              </span>
                            )}
                          </div>
                          
                          <div className="task-content__meta">
                            {/* 專案標籤 */}
                            {project && (
                              <span className="task-project-tag">
                                <span className="task-project-icon">{project.icon}</span>
                                <span className="task-project-name">{project.name}</span>
                              </span>
                            )}
                            
                            {/* 截止日期或建立時間 - 優先顯示截止日期 */}
                            {todo.dueDate ? (
                              <span 
                                className={`task-due-date task-due-date--${dueStatus}`}
                                style={{ color: getDueDateColor(todo.dueDate) }}
                              >
                                <span className="task-due-icon">
                                  {dueStatus === 'overdue' ? '⚠️' : 
                                   dueStatus === 'today' ? '📅' : 
                                   dueStatus === 'upcoming' ? '🔔' : '📆'}
                                </span>
                                {formatDueDate(todo.dueDate)}
                              </span>
                            ) : (
                              <span className="task-created-date">
                                📝 {new Date(todo.createdAt).toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' })}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="task-item__right">
                        <MagicButton
                          onClick={() => setEditingTodo(todo)}
                          variant="secondary"
                          size="small"
                          title="智慧編輯 - 包含基本編輯和智慧排程功能"
                        >
                          🚀
                        </MagicButton>
                        <MagicButton
                          onClick={() => deleteTodo(todo.id)}
                          variant="danger"
                          size="small"
                        >
                          🗑️
                        </MagicButton>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {/* 底部操作 */}
      {totalTodos > 0 && (
        <div className="today-tasks__footer">
          <div className="footer-stats">
            <span className="footer-stat">
              📋 總共 {totalTodos} 個任務
            </span>
            <span className="footer-stat">
              ✅ 已完成 {completedCount} 個
            </span>
            <span className="footer-stat">
              ⏳ 待完成 {activeCount} 個
            </span>
          </div>
          
          {completedCount > 0 && (
            <div className="footer-actions">
              <MagicButton
                onClick={clearCompleted}
                variant="danger"
                size="small"
              >
                🗑️ 清除已完成
              </MagicButton>
            </div>
          )}
        </div>
      )}
      
      {/* 智慧任務編輯器 */}
      <ErrorBoundary>
        <SmartTaskEditor
          todo={editingTodo}
          isOpen={!!editingTodo}
          onClose={() => setEditingTodo(null)}
          onSave={(id, updates) => {
            editTodo(id, updates)
            setEditingTodo(null)
          }}
          onSchedule={(task, schedule) => {
            console.log('📅 智慧排程已應用:', { task, schedule })
            
            // 如果有生成子任務，創建為實際的 Todo 項目
            if (schedule.suggestedSubtasks && schedule.suggestedSubtasks.length > 0) {
              console.log(`🧩 創建 ${schedule.suggestedSubtasks.length} 個子任務`)
              
              schedule.suggestedSubtasks.forEach((subtask, index) => {
                // 計算子任務的截止日期（基於父任務的截止日期和順序）
                const parentDueDate = task.dueDate
                let subtaskDueDate: string | undefined
                
                if (parentDueDate) {
                  const baseDate = new Date(parentDueDate)
                  // 每個子任務間隔一天，按順序分配
                  baseDate.setDate(baseDate.getDate() - (schedule.suggestedSubtasks.length - index - 1))
                  subtaskDueDate = baseDate.toISOString().slice(0, 16)
                }
                
                // 創建子任務作為獨立的 Todo 項目
                addTodo(
                  `📝 ${subtask.name} (${task.text} 的子任務 ${index + 1}/${schedule.suggestedSubtasks.length})`,
                  task.projectId,
                  subtask.priority as 'low' | 'medium' | 'high',
                  subtaskDueDate
                )
              })
              
              alert(`✅ 智慧排程完成！已創建 ${schedule.suggestedSubtasks.length} 個子任務，你可以在任務列表中看到並編輯它們。`)
            } else {
              alert('✅ 智慧排程完成！時間段已安排。')
            }
          }}
        />
      </ErrorBoundary>
    </div>
  )
}