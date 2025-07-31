import React, { useState, useMemo } from 'react'
import { MonthGridCalendar } from '../calendar/MonthGridCalendar'
import { GanttChart } from '../calendar/GanttChart'
import { CalendarListView } from '../calendar/CalendarListView'
import { SmartTaskEditor } from '../todo/SmartTaskEditor'
import { EventEditModal } from '../calendar/EventEditModal'
import { MagicButton } from '../MagicButton'
import { useTodos } from '../../hooks/useTodos'
import { useCalendar } from '../../context/CalendarContext'
import { useProjects } from '../../context/ProjectContext'
import { useUser } from '../../context/UserContext'
import type { CalendarEvent } from '../../types/calendar'
import type { Todo } from '../../types/todo'

export const CalendarView: React.FC = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [projectFilter, setProjectFilter] = useState<string>('all')
  const [timeView, setTimeView] = useState<'month' | 'quarter' | 'year'>('month')
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null)
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)
  const [showCreateEvent, setShowCreateEvent] = useState(false)
  
  const { todos, editTodo, addTodo } = useTodos()
  const { events, addEvent, updateEvent, deleteEvent } = useCalendar()
  const { projects } = useProjects()
  const { user } = useUser()
  
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
      // For regular events, open the event edit modal
      setEditingEvent(event)
    }
  }

  const handleTodoSave = (id: string, updates: Partial<Todo>) => {
    editTodo(id, updates)
    setEditingTodo(null)
  }

  const handleAddEvent = () => {
    setShowCreateEvent(true)
  }

  const handleEventSave = (id: string, updates: Partial<CalendarEvent>) => {
    if (id === 'new') {
      // Create new event
      if (user) {
        const eventData = {
          ...updates,
          userId: user.id
        } as Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>
        
        addEvent(eventData)
        console.log('✅ 新事件已創建')
      }
    } else {
      // Update existing event
      updateEvent(id, updates)
      console.log('✅ 事件已更新')
    }
  }

  const handleEventDelete = (id: string) => {
    deleteEvent(id)
    console.log('🗑️ 事件已刪除')
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
          {/* 新增事件按鈕 */}
          <div className="add-event-section">
            <MagicButton
              variant="primary"
              size="medium"
              onClick={handleAddEvent}
            >
              ➕ 新增事件
            </MagicButton>
          </div>

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

      {/* 事件編輯模態框 */}
      <EventEditModal
        event={editingEvent}
        isOpen={!!editingEvent}
        mode="edit"
        onClose={() => setEditingEvent(null)}
        onSave={handleEventSave}
        onDelete={handleEventDelete}
      />

      {/* 創建事件模態框 */}
      <EventEditModal
        event={null}
        isOpen={showCreateEvent}
        mode="create"
        onClose={() => setShowCreateEvent(false)}
        onSave={handleEventSave}
      />

      {/* 智慧任務編輯器 */}
      <SmartTaskEditor
        todo={editingTodo}
        isOpen={!!editingTodo}
        onClose={() => setEditingTodo(null)}
        onSave={handleTodoSave}
        onSchedule={(task, schedule) => {
          console.log('📅 智慧排程已應用於行事曆:', { task, schedule })
          
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
            
            alert(`✅ 智慧排程完成！已創建 ${schedule.suggestedSubtasks.length} 個子任務，你可以在任務列表和行事曆中看到並編輯它們。`)
          } else {
            alert('✅ 智慧排程完成！時間段已安排，可在行事曆中查看。')
          }
        }}
      />
    </div>
  )
}