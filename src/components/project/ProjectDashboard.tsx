import React, { useState } from 'react'
import { MagicButton } from '../MagicButton'
import type { Project } from '../../types/project'
import { useProjects } from '../../context/ProjectContext'

interface ProjectDashboardProps {
  projects: Project[]
  onProjectSelect: (project: Project) => void
  onProjectEdit: (project: Project) => void
  onProjectDelete: (project: Project) => void
}

export const ProjectDashboard: React.FC<ProjectDashboardProps> = ({
  projects,
  onProjectSelect,
  onProjectEdit,
  onProjectDelete,
}) => {
  const { getProjectStats, currentProject } = useProjects()
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const handleDeleteClick = (project: Project) => {
    setDeleteConfirm(project.id)
  }

  const handleConfirmDelete = (project: Project) => {
    onProjectDelete(project)
    setDeleteConfirm(null)
  }

  const handleCancelDelete = () => {
    setDeleteConfirm(null)
  }

  const formatDate = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - new Date(date).getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return '今天'
    if (diffDays === 1) return '昨天'
    if (diffDays < 7) return `${diffDays} 天前`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} 週前`
    return `${Math.floor(diffDays / 30)} 個月前`
  }

  const renderProjectCard = (project: Project) => {
    const stats = getProjectStats(project.id)
    const completionRate = stats?.completionRate || 0
    const isDeleting = deleteConfirm === project.id
    const isCurrentProject = currentProject?.id === project.id

    return (
      <div key={project.id} className={`project-card ${isCurrentProject ? 'project-card--current' : ''}`}>
        <div className="project-card__header">
          <div className="project-card__title" onClick={() => onProjectSelect(project)}>
            <span 
              className="project-card__color" 
              style={{ backgroundColor: project.color }}
            />
            <span className="project-card__icon">{project.icon || '📁'}</span>
            <h3>{project.name}</h3>
          </div>
          
          <div className="project-card__actions">
            <button
              onClick={() => onProjectEdit(project)}
              className="icon-button"
              title="編輯專案"
            >
              ✏️
            </button>
            <button
              onClick={() => handleDeleteClick(project)}
              className="icon-button"
              title="刪除專案"
            >
              🗑️
            </button>
          </div>
        </div>

        {project.description && (
          <p className="project-card__description">{project.description}</p>
        )}

        <div className="project-card__stats">
          <div className="stat">
            <span className="stat__label">任務</span>
            <span className="stat__value">
              {stats?.completedTodos || 0}/{stats?.totalTodos || 0}
            </span>
          </div>
          
          <div className="stat">
            <span className="stat__label">完成率</span>
            <span className="stat__value">{Math.round(completionRate)}%</span>
          </div>
          
          <div className="stat">
            <span className="stat__label">最後活動</span>
            <span className="stat__value">{formatDate(project.updatedAt)}</span>
          </div>
        </div>

        <div className="project-card__progress">
          <div className="progress-bar">
            <div 
              className="progress-bar__fill"
              style={{ 
                width: `${completionRate}%`,
                backgroundColor: project.color 
              }}
            />
          </div>
        </div>

        <MagicButton
          onClick={() => onProjectSelect(project)}
          variant={isCurrentProject ? "primary" : "secondary"}
          size="small"
          className="project-card__open"
        >
          {isCurrentProject ? "當前專案" : "打開專案"}
        </MagicButton>

        {isDeleting && (
          <div className="confirm-overlay">
            <div className="confirm-content">
              <p>確定要刪除專案「{project.name}」嗎？</p>
              <p className="confirm-warning">
                這將刪除專案內的 {stats?.totalTodos || 0} 個任務
              </p>
              <div className="confirm-actions">
                <button
                  onClick={() => handleConfirmDelete(project)}
                  className="confirm-delete"
                >
                  確定刪除
                </button>
                <button
                  onClick={handleCancelDelete}
                  className="cancel-delete"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="project-dashboard">
      <div className="project-dashboard__header">
        <h2>我的專案</h2>
        
        <div className="view-toggle">
          <button
            className={`view-toggle__option ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
            title="網格視圖"
          >
            ⊞
          </button>
          <button
            className={`view-toggle__option ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
            title="列表視圖"
          >
            ☰
          </button>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="empty-projects">
          <div className="empty-projects__icon">📂</div>
          <h3>還沒有專案</h3>
          <p>創建您的第一個專案來組織任務</p>
        </div>
      ) : (
        <div className={`project-dashboard__content ${viewMode}`}>
          {projects.map(renderProjectCard)}
        </div>
      )}
    </div>
  )
}