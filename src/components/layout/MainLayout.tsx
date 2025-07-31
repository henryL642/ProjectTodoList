import React, { useState, useCallback } from 'react'
import { Sidebar, type SidebarView } from './Sidebar'
import { QuickActionModal } from './QuickActionModal'
import { FloatingPomodoroTimer } from '../productivity/FloatingPomodoroTimer'
import { DashboardView } from '../views/DashboardView'
import { TodayTasksView } from '../views/TodayTasksView'
import { TodayFocusView } from '../views/TodayFocusView'
import { ProjectsView } from '../views/ProjectsView'
import { CalendarView } from '../views/CalendarView'
import { FocusView } from '../views/FocusView'
import { SettingsView } from '../views/SettingsView'
import { ThemeToggle } from '../ThemeToggle'
import { useUser } from '../../context/UserContext'
import { useProjects } from '../../context/ProjectContext'
import { useCalendar } from '../../context/CalendarContext'
import { useTodos } from '../../hooks/useTodos'
import type { Project } from '../../types/project'

export const MainLayout: React.FC = () => {
  const { user } = useUser()
  const { createProject } = useProjects()
  const { addEvent } = useCalendar()
  const { addTodo } = useTodos()

  const [currentView, setCurrentView] = useState<SidebarView>('today')
  const [settingsInitialTab, setSettingsInitialTab] = useState<'profile' | 'preferences' | 'notifications' | 'data'>('profile')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [quickActionModal, setQuickActionModal] = useState<{
    isOpen: boolean
    actionType: 'addTask' | 'addProject' | 'addEvent' | null
  }>({
    isOpen: false,
    actionType: null
  })

  // 處理視圖切換
  const handleViewChange = useCallback((view: SidebarView) => {
    setCurrentView(view)
  }, [])

  // 處理側邊欄摺疊
  const handleToggleCollapse = useCallback(() => {
    setSidebarCollapsed(prev => !prev)
  }, [])

  // 處理快速操作
  const handleQuickAction = useCallback((action: 'addTask' | 'addProject' | 'addEvent') => {
    setQuickActionModal({
      isOpen: true,
      actionType: action
    })
  }, [])

  // 關閉快速操作模態
  const handleCloseQuickAction = useCallback(() => {
    setQuickActionModal({
      isOpen: false,
      actionType: null
    })
  }, [])

  // 處理任務添加
  const handleTaskAdd = useCallback((task: { text: string; projectId?: string; priority?: 'low' | 'medium' | 'high'; dueDate?: string }) => {
    addTodo(task.text, task.projectId, task.priority, task.dueDate)
    
    // 如果當前不在今日任務視圖，自動切換
    if (currentView !== 'today') {
      setCurrentView('today')
    }
  }, [addTodo, currentView])

  // 處理專案添加
  const handleProjectAdd = useCallback(async (projectData: Partial<Project>) => {
    try {
      await createProject(projectData as Omit<Project, 'id' | 'createdAt' | 'updatedAt'>)
      
      // 自動切換到專案視圖
      setCurrentView('projects')
    } catch (error) {
      console.error('Failed to create project:', error)
    }
  }, [createProject])

  // 處理事件添加
  const handleEventAdd = useCallback((eventData: any) => {
    if (user) {
      addEvent({
        ...eventData,
        userId: user.id
      })
      
      // 自動切換到行事曆視圖
      setCurrentView('calendar')
    }
  }, [addEvent, user])

  // 渲染主要內容
  const renderMainContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView onNavigate={handleViewChange} onQuickAction={handleQuickAction} />
      case 'today':
        return <TodayFocusView />
      case 'projects':
        return <ProjectsView />
      case 'calendar':
        return <CalendarView />
      case 'focus':
        return <FocusView onNavigateToSettings={() => {
          setSettingsInitialTab('preferences')
          setCurrentView('settings')
        }} />
      case 'settings':
        return <SettingsView initialTab={settingsInitialTab} />
      default:
        return <DashboardView onNavigate={handleViewChange} onQuickAction={handleQuickAction} />
    }
  }

  return (
    <div className={`main-layout ${sidebarCollapsed ? 'main-layout--sidebar-collapsed' : ''}`}>
      {/* 側邊欄 */}
      <Sidebar
        currentView={currentView}
        onViewChange={handleViewChange}
        onQuickAction={handleQuickAction}
        collapsed={sidebarCollapsed}
        onToggleCollapse={handleToggleCollapse}
      />

      {/* 主內容區域 */}
      <div className="main-layout__content">
        {/* 頂部操作欄 */}
        <header className="main-layout__header">
          <div className="main-layout__header-left">
            {sidebarCollapsed && (
              <button
                className="main-layout__sidebar-toggle"
                onClick={handleToggleCollapse}
                title="展開側邊欄"
              >
                ☰
              </button>
            )}
            <h1 className="main-layout__title">
              {getViewTitle(currentView)}
            </h1>
          </div>
          
          <div className="main-layout__header-right">
            <ThemeToggle />
            <div className="user-menu">
              <div className="user-menu__avatar">
                {user?.username.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* 主要內容 */}
        <main className="main-layout__main">
          {renderMainContent()}
        </main>
      </div>

      {/* 快速操作模態 */}
      <QuickActionModal
        isOpen={quickActionModal.isOpen}
        actionType={quickActionModal.actionType}
        onClose={handleCloseQuickAction}
        onTaskAdd={handleTaskAdd}
        onProjectAdd={handleProjectAdd}
        onEventAdd={handleEventAdd}
      />

      {/* 浮動番茄鐘 */}
      <FloatingPomodoroTimer />
    </div>
  )
}

// 獲取視圖標題
const getViewTitle = (view: SidebarView): string => {
  const titles: Record<SidebarView, string> = {
    dashboard: '🏠 概覽',
    today: '🏠 今日焦點',
    projects: '📁 專案',
    calendar: '📅 行事曆',
    focus: '🍅 專注',
    settings: '⚙️ 設定'
  }
  return titles[view]
}