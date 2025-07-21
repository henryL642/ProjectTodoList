import React, { useState } from 'react'
import { ProjectDashboard } from '../project/ProjectDashboard'
import { ProjectForm } from '../project/ProjectForm'
import { useProjects } from '../../context/ProjectContext'
import type { Project } from '../../types/project'

export const ProjectsView: React.FC = () => {
  const { projects, selectProject, deleteProject, updateProject } = useProjects()
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  const handleProjectSelect = (project: Project) => {
    selectProject(project.id)
    // Provide visual feedback that project was selected
    console.log(`專案已設為當前: ${project.name}`)
  }

  const handleProjectEdit = (project: Project) => {
    setEditingProject(project)
    setIsEditModalOpen(true)
  }

  const handleProjectDelete = async (project: Project) => {
    try {
      await deleteProject(project.id)
    } catch (error) {
      console.error('Failed to delete project:', error)
    }
  }

  const handleEditSubmit = async (updatedData: Partial<Project>) => {
    if (!editingProject) return

    try {
      await updateProject(editingProject.id, updatedData)
      setIsEditModalOpen(false)
      setEditingProject(null)
    } catch (error) {
      console.error('Failed to update project:', error)
    }
  }

  const handleEditCancel = () => {
    setIsEditModalOpen(false)
    setEditingProject(null)
  }

  return (
    <div className="projects-view">
      <ProjectDashboard
        projects={projects}
        onProjectSelect={handleProjectSelect}
        onProjectEdit={handleProjectEdit}
        onProjectDelete={handleProjectDelete}
      />

      {/* Edit Project Modal */}
      {isEditModalOpen && editingProject && (
        <div className="modal-overlay">
          <div className="modal-content">
            <ProjectForm
              project={editingProject}
              onSubmit={handleEditSubmit}
              onCancel={handleEditCancel}
            />
          </div>
        </div>
      )}
    </div>
  )
}