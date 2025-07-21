import React, { useState, useRef, useEffect } from 'react'
import { useProjects } from '../../context/ProjectContext'
import type { Project } from '../../types/project'

interface ProjectSelectorProps {
  onProjectChange?: (project: Project | null) => void
  showAllOption?: boolean
  showCreateButton?: boolean
}

export const ProjectSelector: React.FC<ProjectSelectorProps> = ({
  onProjectChange,
  showAllOption = true,
  showCreateButton = true,
}) => {
  const { projects, currentProject, selectProject } = useProjects()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Handle outside click
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick)
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [isOpen])

  const handleProjectSelect = (projectId: string | null) => {
    selectProject(projectId)
    setIsOpen(false)
    
    const selected = projectId ? projects.find(p => p.id === projectId) || null : null
    onProjectChange?.(selected)
  }

  const handleCreateNew = () => {
    setIsOpen(false)
    // This will be handled by parent component
    const event = new CustomEvent('create-project')
    window.dispatchEvent(event)
  }

  return (
    <div className="project-selector" ref={dropdownRef}>
      <button
        className="project-selector__trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <div className="project-selector__current">
          {currentProject ? (
            <>
              <span 
                className="project-selector__color-dot" 
                style={{ backgroundColor: currentProject.color }}
              />
              <span className="project-selector__icon">{currentProject.icon || '📁'}</span>
              <span className="project-selector__name">{currentProject.name}</span>
            </>
          ) : (
            <>
              <span className="project-selector__icon">📋</span>
              <span className="project-selector__name">所有任務</span>
            </>
          )}
        </div>
        <span className="project-selector__arrow">▼</span>
      </button>

      {isOpen && (
        <div className="project-selector__dropdown">
          {showAllOption && (
            <button
              className={`project-selector__option ${!currentProject ? 'active' : ''}`}
              onClick={() => handleProjectSelect(null)}
            >
              <span className="project-selector__icon">📋</span>
              <span className="project-selector__name">所有任務</span>
              <span className="project-selector__count">
                ({projects.reduce((sum, p) => sum + (p.todoCount || 0), 0)})
              </span>
            </button>
          )}

          {projects.length > 0 && showAllOption && (
            <div className="project-selector__divider" />
          )}

          {projects.map(project => (
            <button
              key={project.id}
              className={`project-selector__option ${currentProject?.id === project.id ? 'active' : ''}`}
              onClick={() => handleProjectSelect(project.id)}
            >
              <span 
                className="project-selector__color-dot" 
                style={{ backgroundColor: project.color }}
              />
              <span className="project-selector__icon">{project.icon || '📁'}</span>
              <span className="project-selector__name">{project.name}</span>
              <span className="project-selector__count">
                {project.completedCount || 0}/{project.todoCount || 0}
              </span>
            </button>
          ))}

          {showCreateButton && (
            <>
              <div className="project-selector__divider" />
              <button
                className="project-selector__option project-selector__create"
                onClick={handleCreateNew}
              >
                <span className="project-selector__icon">➕</span>
                <span className="project-selector__name">創建新專案...</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}