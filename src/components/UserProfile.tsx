import React, { useState, useCallback } from 'react'
import { useUser } from '../context/UserContext'

export const UserProfile: React.FC = () => {
  const { user, logout, updateProfile, isLoading } = useUser()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
  })
  const [isUpdating, setIsUpdating] = useState(false)

  const handleEdit = useCallback(() => {
    setIsEditing(true)
    setFormData({
      username: user?.username || '',
      email: user?.email || '',
    })
  }, [user])

  const handleCancel = useCallback(() => {
    setIsEditing(false)
    setFormData({
      username: user?.username || '',
      email: user?.email || '',
    })
  }, [user])

  const handleSave = useCallback(async () => {
    if (!formData.username.trim() || !formData.email.trim()) {
      return
    }

    setIsUpdating(true)
    const success = await updateProfile({
      username: formData.username.trim(),
      email: formData.email.trim(),
    })

    if (success) {
      setIsEditing(false)
    }
    setIsUpdating(false)
  }, [formData, updateProfile])

  const handleInputChange = useCallback((field: 'username' | 'email', value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }, [])

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date))
  }

  if (!user) return null

  return (
    <div className="user-profile">
      <div className="user-profile__header">
        <div className="user-avatar">
          {user.avatar ? (
            <img src={user.avatar} alt="用戶頭像" />
          ) : (
            <div className="user-avatar-placeholder">
              {user.username.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        
        <div className="user-info">
          {isEditing ? (
            <div className="edit-form">
              <div className="form-group">
                <label htmlFor="edit-username">用戶名</label>
                <input
                  id="edit-username"
                  type="text"
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  placeholder="用戶名"
                  disabled={isUpdating}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="edit-email">郵箱</label>
                <input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="郵箱"
                  disabled={isUpdating}
                />
              </div>
              
              <div className="edit-actions">
                <button
                  onClick={handleSave}
                  className="save-button"
                  disabled={isUpdating || !formData.username.trim() || !formData.email.trim()}
                >
                  {isUpdating ? '保存中...' : '保存'}
                </button>
                <button
                  onClick={handleCancel}
                  className="cancel-button"
                  disabled={isUpdating}
                >
                  取消
                </button>
              </div>
            </div>
          ) : (
            <>
              <h3>{user.username}</h3>
              <p className="user-email">{user.email}</p>
              <button
                onClick={handleEdit}
                className="edit-profile-button"
                disabled={isLoading}
              >
                編輯資料
              </button>
            </>
          )}
        </div>
      </div>

      <div className="user-profile__details">
        <div className="detail-item">
          <span className="detail-label">註冊時間：</span>
          <span className="detail-value">{formatDate(user.createdAt)}</span>
        </div>
        
        {user.lastLoginAt && (
          <div className="detail-item">
            <span className="detail-label">最後登錄：</span>
            <span className="detail-value">{formatDate(user.lastLoginAt)}</span>
          </div>
        )}
      </div>

      <div className="user-profile__actions">
        <button
          onClick={logout}
          className="logout-button"
          disabled={isLoading}
        >
          登出
        </button>
      </div>
    </div>
  )
}