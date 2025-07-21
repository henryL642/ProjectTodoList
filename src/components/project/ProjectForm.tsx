import React, { useState, useCallback } from 'react'
import { MagicButton } from '../MagicButton'
import { PROJECT_COLORS, PROJECT_ICONS } from '../../types/project'
import type { Project } from '../../types/project'

interface ProjectFormProps {
  project?: Project
  onSubmit: (project: Partial<Project>) => void
  onCancel: () => void
}

export const ProjectForm: React.FC<ProjectFormProps> = ({
  project,
  onSubmit,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    name: project?.name || '',
    description: project?.description || '',
    color: project?.color || PROJECT_COLORS[0],
    icon: project?.icon || PROJECT_ICONS[0],
  })
  const [errors, setErrors] = useState<{ name?: string }>({})

  const handleInputChange = useCallback((field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (field === 'name' && errors.name) {
      setErrors(prev => ({ ...prev, name: undefined }))
    }
  }, [errors.name])

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate
    const newErrors: { name?: string } = {}
    if (!formData.name.trim()) {
      newErrors.name = '專案名稱不能為空'
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    
    // Submit
    onSubmit({
      name: formData.name.trim(),
      description: formData.description.trim(),
      color: formData.color,
      icon: formData.icon,
      isArchived: false,
    })
  }, [formData, onSubmit])

  const isFormValid = formData.name.trim().length > 0

  return (
    <form onSubmit={handleSubmit} className="project-form">
      <h3 className="project-form__title">
        {project ? '編輯專案' : '創建新專案'}
      </h3>

      <div className="form-group">
        <label htmlFor="project-name">專案名稱 *</label>
        <input
          id="project-name"
          type="text"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          placeholder="輸入專案名稱"
          className={errors.name ? 'error' : ''}
          maxLength={50}
          autoFocus
        />
        {errors.name && (
          <span className="field-error">{errors.name}</span>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="project-description">專案描述</label>
        <textarea
          id="project-description"
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="描述這個專案的目標和內容（選填）"
          rows={3}
          maxLength={200}
        />
      </div>

      <div className="form-group">
        <label>專案顏色</label>
        <div className="color-picker">
          {PROJECT_COLORS.map(color => (
            <button
              key={color}
              type="button"
              className={`color-picker__option ${formData.color === color ? 'active' : ''}`}
              style={{ backgroundColor: color }}
              onClick={() => handleInputChange('color', color)}
              aria-label={`選擇顏色 ${color}`}
            />
          ))}
        </div>
      </div>

      <div className="form-group">
        <label>專案圖標</label>
        <div className="icon-picker">
          {PROJECT_ICONS.map(icon => (
            <button
              key={icon}
              type="button"
              className={`icon-picker__option ${formData.icon === icon ? 'active' : ''}`}
              onClick={() => handleInputChange('icon', icon)}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>

      <div className="project-form__preview">
        <h4>預覽</h4>
        <div className="project-preview">
          <span 
            className="project-preview__color" 
            style={{ backgroundColor: formData.color }}
          />
          <span className="project-preview__icon">{formData.icon}</span>
          <span className="project-preview__name">
            {formData.name || '未命名專案'}
          </span>
        </div>
      </div>

      <div className="project-form__actions">
        <MagicButton
          variant="primary"
          disabled={!isFormValid}
          onClick={() => handleSubmit({} as React.FormEvent)}
        >
          {project ? '保存更改' : '創建專案'}
        </MagicButton>
        
        <MagicButton
          variant="secondary"
          onClick={onCancel}
        >
          取消
        </MagicButton>
      </div>
    </form>
  )
}