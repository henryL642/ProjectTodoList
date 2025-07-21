import React, { useState, useMemo } from 'react'
import { MonthGridCalendar } from '../calendar/MonthGridCalendar'
import { GanttChart } from '../calendar/GanttChart'
import { CalendarListView } from '../calendar/CalendarListView'
import { TodoEditModal } from '../todo/TodoEditModal'
import { MagicButton } from '../MagicButton'
import { useTodos } from '../../hooks/useTodos'
import { useCalendar } from '../../context/CalendarContext'
import { useProjects } from '../../context/ProjectContext'
import type { CalendarEvent } from '../../types/calendar'
import type { Todo } from '../../types/todo'

export const CalendarView: React.FC = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [projectFilter, setProjectFilter] = useState<string>('all')
  const [timeView, setTimeView] = useState<'month' | 'quarter' | 'year'>('month')
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null)
  
  const { todos, editTodo } = useTodos()
  const { events } = useCalendar()
  const { projects } = useProjects()
  
  // Convert todos to calendar events
  const todoEvents: CalendarEvent[] = useMemo(() => {
    return todos
      .filter(todo => todo.dueDate) // Only todos with due dates
      .filter(todo => projectFilter === 'all' || todo.projectId === projectFilter)
      .map(todo => ({
        id: `todo-${todo.id}`,
        userId: todo.userId || 'unknown',
        title: `📋 ${todo.text}`,
        startDate: todo.dueDate!,
        endDate: todo.dueDate!,
        allDay: true,
        type: 'deadline' as const,
        status: todo.completed ? 'completed' as const : 'scheduled' as const,
        description: `任務: ${todo.text}`,
        projectId: todo.projectId,
        isTask: true,
        reminders: [],
        createdAt: todo.createdAt,
        updatedAt: todo.createdAt
      }))
  }, [todos, projectFilter])
  
  // Filter events by project
  const filteredEvents = useMemo(() => {
    return events.filter(event => 
      projectFilter === 'all' || event.projectId === projectFilter
    )
  }, [events, projectFilter])
  
  // Combine events and todos
  const allCalendarItems = useMemo(() => {
    return [...filteredEvents, ...todoEvents]
  }, [filteredEvents, todoEvents])

  const handleEventClick = (event: CalendarEvent) => {
    if (event.isTask) {
      // Find the original todo for editing
      const todoId = event.id.replace('todo-', '')
      const todo = todos.find(t => t.id === todoId)
      if (todo) {
        setEditingTodo(todo)
      }
    } else {
      setSelectedEvent(event)
    }
  }

  const handleTodoSave = (id: string, updates: Partial<Todo>) => {
    editTodo(id, updates)
    setEditingTodo(null)
  }

  const handleAddEvent = () => {
    // TODO: Implement add event functionality - for now just trigger quick action
    window.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'e',
      metaKey: true
    }))
  }

  return (
    <div className="calendar-view">
      {/* 視圖切換器 */}
      <div className="calendar-view__header">
        <div className="view-title">
          <h2>📅 智能行事曆</h2>
          <p>事件與任務的統一視圖，支援專案過濾</p>
        </div>
        
        <div className="view-controls">
          {/* 專案過濾器 */}
          <div className="project-filter">
            <label>專案過濾：</label>
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="project-select"
            >
              <option value="all">全部專案</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
          
          {/* 時間視圖切換器 */}
          <div className="time-view-switcher">
            <MagicButton
              variant={timeView === 'month' ? 'primary' : 'secondary'}
              size="small"
              onClick={() => setTimeView('month')}
            >
              📅 月
            </MagicButton>
            <MagicButton
              variant={timeView === 'quarter' ? 'primary' : 'secondary'}
              size="small"
              onClick={() => setTimeView('quarter')}
            >
              📊 季
            </MagicButton>
            <MagicButton
              variant={timeView === 'year' ? 'primary' : 'secondary'}
              size="small"
              onClick={() => setTimeView('year')}
            >
              📈 年
            </MagicButton>
          </div>
          
          {/* 視圖切換器 */}
          <div className="view-switcher">
            <MagicButton
              variant={viewMode === 'grid' ? 'primary' : 'secondary'}
              size="small"
              onClick={() => setViewMode('grid')}
            >
              📅 {timeView === 'month' ? '月曆' : '甘特圖'}
            </MagicButton>
            <MagicButton
              variant={viewMode === 'list' ? 'primary' : 'secondary'}
              size="small"
              onClick={() => setViewMode('list')}
            >
              📋 列表視圖
            </MagicButton>
          </div>
        </div>
      </div>

      {/* 主要內容區域 */}
      <div className="calendar-view__content">
        {viewMode === 'grid' ? (
          timeView === 'month' ? (
            <MonthGridCalendar
              events={allCalendarItems}
              onAddEvent={handleAddEvent}
              onEventClick={handleEventClick}
            />
          ) : (
            <GanttChart
              events={allCalendarItems}
              timeView={timeView}
              onEventClick={handleEventClick}
            />
          )
        ) : (
          <div className="list-view-container">
            <CalendarListView
              events={allCalendarItems}
              onEventClick={handleEventClick}
            />
          </div>
        )}
      </div>

      {/* 事件詳情模態框 */}
      {selectedEvent && (
        <div className="event-detail-modal-overlay" onClick={() => setSelectedEvent(null)}>
          <div className="event-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="event-detail-header">
              <h3>{selectedEvent.title}</h3>
              <button
                className="close-button"
                onClick={() => setSelectedEvent(null)}
              >
                ✕
              </button>
            </div>
            
            <div className="event-detail-content">
              <div className="event-detail-row">
                <span className="label">時間：</span>
                <span className="value">
                  {selectedEvent.allDay ? (
                    '全天'
                  ) : (
                    new Date(selectedEvent.startDate).toLocaleString('zh-TW', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  )}
                </span>
              </div>
              
              <div className="event-detail-row">
                <span className="label">類型：</span>
                <span className="value">
                  {selectedEvent.type === 'deadline' && '🎯 截止日期'}
                  {selectedEvent.type === 'meeting' && '👥 會議'}
                  {selectedEvent.type === 'work_block' && '🕒 工作時段'}
                  {selectedEvent.type === 'reminder' && '🔔 提醒'}
                  {selectedEvent.type === 'milestone' && '🏁 里程碑'}
                </span>
              </div>
              
              {selectedEvent.description && (
                <div className="event-detail-row">
                  <span className="label">描述：</span>
                  <span className="value">{selectedEvent.description}</span>
                </div>
              )}
              
              <div className="event-detail-row">
                <span className="label">狀態：</span>
                <span className="value">
                  {selectedEvent.status === 'scheduled' && '🟢 已安排'}
                  {selectedEvent.status === 'completed' && '✅ 已完成'}
                  {selectedEvent.status === 'cancelled' && '❌ 已取消'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 任務編輯模態框 */}
      <TodoEditModal
        todo={editingTodo}
        isOpen={!!editingTodo}
        onClose={() => setEditingTodo(null)}
        onSave={handleTodoSave}
      />
    </div>
  )
}