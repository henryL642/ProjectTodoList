import React, { useState } from 'react'
import { MagicButton } from '../MagicButton'
import { useUser } from '../../context/UserContext'
import { useProjects } from '../../context/ProjectContext'
import { useTodos } from '../../hooks/useTodos'

export type SidebarView = 'dashboard' | 'today' | 'projects' | 'calendar' | 'focus' | 'settings'

interface SidebarProps {
  currentView: SidebarView
  onViewChange: (view: SidebarView) => void
  onQuickAction: (action: 'addTask' | 'addProject' | 'addEvent') => void
  collapsed?: boolean
  onToggleCollapse?: () => void
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onViewChange,
  onQuickAction,
  collapsed = false,
  onToggleCollapse
}) => {
  const { user } = useUser()
  const { projects, currentProject, selectProject } = useProjects()
  const { activeCount } = useTodos()
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false)

  // 重新組織為邏輯層次：概覽 → 工作 → 工具 → 設定
  const navigationItems = [
    {
      id: 'dashboard' as SidebarView,
      icon: '📊',
      label: '概覽',
      category: 'overview',
      badge: activeCount > 0 ? activeCount.toString() : undefined
    },
    {
      id: 'today' as SidebarView,
      icon: '🏠',
      label: '今日焦點',
      category: 'overview',
      badge: activeCount > 0 ? activeCount.toString() : undefined
    },
    {
      id: 'projects' as SidebarView,
      icon: '📁',
      label: '專案',
      category: 'work',
      badge: projects.length > 0 ? projects.length.toString() : undefined
    },
    {
      id: 'calendar' as SidebarView,
      icon: '📅',
      label: '行事曆',
      category: 'tools'
    },
    {
      id: 'focus' as SidebarView,
      icon: '🍅',
      label: '專注',
      category: 'tools'
    },
    {
      id: 'settings' as SidebarView,
      icon: '⚙️',
      label: '設定',
      category: 'meta'
    }
  ]


  const handleNavigation = (view: SidebarView) => {
    onViewChange(view)
  }

  const handleQuickAction = (action: 'addTask' | 'addProject' | 'addEvent') => {
    onQuickAction(action)
  }

  // 鍵盤快捷鍵支持
  React.useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        switch (e.key.toLowerCase()) {
          case 't':
            e.preventDefault()
            handleQuickAction('addTask')
            break
          case 'p':
            e.preventDefault()
            handleQuickAction('addProject')
            break
          case 'e':
            e.preventDefault()
            handleQuickAction('addEvent')
            break
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [])

  if (collapsed) {
    return (
      <aside className="sidebar sidebar--collapsed">
        <div className="sidebar__header">
          <button
            className="sidebar__toggle"
            onClick={onToggleCollapse}
            title="展開側邊欄"
          >
            ☰
          </button>
        </div>

        <nav className="sidebar__nav">
          {navigationItems.map(item => (
            <button
              key={item.id}
              className={`sidebar__nav-item sidebar__nav-item--collapsed ${
                currentView === item.id ? 'sidebar__nav-item--active' : ''
              }`}
              onClick={() => handleNavigation(item.id)}
              title={item.label}
            >
              <span className="sidebar__nav-icon">{item.icon}</span>
              {item.badge && <span className="sidebar__nav-badge">{item.badge}</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar__quick-actions sidebar__quick-actions--collapsed">
          <button
            className="quick-action__trigger quick-action__trigger--collapsed"
            onClick={() => handleQuickAction('addTask')}
            title="新增任務"
          >
            ➕
          </button>
        </div>
      </aside>
    )
  }

  return (
    <aside className="sidebar">
      <div className="sidebar__header">
        <div className="sidebar__brand">
          <span className="sidebar__brand-icon">✨</span>
          <h2 className="sidebar__brand-title">魔法待辦</h2>
        </div>
        <button
          className="sidebar__toggle"
          onClick={onToggleCollapse}
          title="收起側邊欄"
        >
          ◀
        </button>
      </div>

      {/* 用戶信息 */}
      <div className="sidebar__user">
        <div className="user-card">
          <div className="user-card__avatar">
            {user?.username.charAt(0).toUpperCase()}
          </div>
          <div className="user-card__info">
            <span className="user-card__name">{user?.username}</span>
            <span className="user-card__status">在線</span>
          </div>
        </div>
        
        {/* 專案選擇下拉式選單 */}
        <div className="project-selector">
          <label className="project-selector__label">專案</label>
          <div className="project-dropdown">
            <button
              className={`project-dropdown__trigger ${projectDropdownOpen ? 'project-dropdown__trigger--open' : ''}`}
              onClick={() => setProjectDropdownOpen(!projectDropdownOpen)}
            >
              <div className="project-dropdown__selected">
                <span className="project-dropdown__icon">
                  {currentProject?.icon || '📁'}
                </span>
                <span className="project-dropdown__name">
                  {currentProject?.name || '選擇專案'}
                </span>
              </div>
              <span className="project-dropdown__arrow">
                {projectDropdownOpen ? '▲' : '▼'}
              </span>
            </button>
            
            {projectDropdownOpen && (
              <div className="project-dropdown__menu">
                <button
                  className={`project-dropdown__option ${!currentProject ? 'project-dropdown__option--selected' : ''}`}
                  onClick={() => {
                    selectProject(null)
                    setProjectDropdownOpen(false)
                  }}
                >
                  <span className="project-dropdown__option-icon">📁</span>
                  <span className="project-dropdown__option-name">所有專案</span>
                  {!currentProject && <span className="project-dropdown__check">✓</span>}
                </button>
                
                {projects.map(project => (
                  <button
                    key={project.id}
                    className={`project-dropdown__option ${currentProject?.id === project.id ? 'project-dropdown__option--selected' : ''}`}
                    onClick={() => {
                      selectProject(project.id)
                      setProjectDropdownOpen(false)
                    }}
                  >
                    <span className="project-dropdown__option-icon">{project.icon}</span>
                    <span className="project-dropdown__option-name">{project.name}</span>
                    {currentProject?.id === project.id && <span className="project-dropdown__check">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 簡化導航菜單 */}
      <nav className="sidebar__nav">
        {navigationItems.map(item => (
          <button
            key={item.id}
            className={`sidebar__nav-item ${
              currentView === item.id ? 'sidebar__nav-item--active' : ''
            }`}
            onClick={() => handleNavigation(item.id)}
          >
            <span className="sidebar__nav-icon">{item.icon}</span>
            <span className="sidebar__nav-label">{item.label}</span>
            {item.badge && <span className="sidebar__nav-badge">{item.badge}</span>}
          </button>
        ))}
      </nav>

      {/* 簡化快速操作 */}
      <div className="sidebar__quick-actions">
        <MagicButton
          onClick={() => handleQuickAction('addTask')}
          variant="primary"
          size="medium"
          className="quick-action__primary-button"
        >
          <span className="quick-action__primary-icon">➕</span>
          <span className="quick-action__primary-label">新增任務</span>
        </MagicButton>
        
        <div className="quick-actions__shortcuts">
          <span className="shortcuts__hint">⌘T 任務 • ⌘P 專案 • ⌘E 事件</span>
        </div>
      </div>

      {/* 底部信息 */}
      <div className="sidebar__footer">
        <div className="sidebar__footer-info">
          <span className="footer-info__text">
            使用 ⌘T 快速添加任務
          </span>
        </div>
      </div>
    </aside>
  )
}