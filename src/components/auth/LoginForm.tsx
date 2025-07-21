import React, { useState, useCallback } from 'react'
import { useUser } from '../../context/UserContext'
import type { LoginCredentials } from '../../types/user'

interface LoginFormProps {
  onSwitchToRegister: () => void
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSwitchToRegister }) => {
  const { login, isLoading, error, clearError } = useUser()
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: '',
  })
  const [showPassword, setShowPassword] = useState(false)

  const handleInputChange = useCallback((field: keyof LoginCredentials, value: string) => {
    setCredentials(prev => ({ ...prev, [field]: value }))
    if (error) clearError()
  }, [error, clearError])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!credentials.email.trim() || !credentials.password.trim()) {
      return
    }
    
    const success = await login(credentials)
    if (success) {
      // Login successful, UserContext will handle state update
    }
  }, [credentials, login])

  const isFormValid = credentials.email.trim() && credentials.password.trim()

  return (
    <div className="auth-form">
      <div className="auth-header">
        <h2>登錄</h2>
        <p>歡迎回來！請登錄您的帳戶</p>
      </div>

      <form onSubmit={handleSubmit} className="auth-form__form">
        <div className="form-group">
          <label htmlFor="email">郵箱</label>
          <input
            id="email"
            type="email"
            value={credentials.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder="請輸入您的郵箱"
            required
            autoComplete="email"
            className={error ? 'error' : ''}
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">密碼</label>
          <div className="password-input">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={credentials.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              placeholder="請輸入您的密碼"
              required
              autoComplete="current-password"
              className={error ? 'error' : ''}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? '隱藏密碼' : '顯示密碼'}
            >
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
        </div>

        {error && (
          <div className="error-message" role="alert">
            {error}
          </div>
        )}

        <button
          type="submit"
          className="auth-button primary"
          disabled={!isFormValid || isLoading}
        >
          {isLoading ? '登錄中...' : '登錄'}
        </button>

        <div className="auth-demo">
          <p>演示帳戶：</p>
          <code>郵箱: demo@example.com | 密碼: demo123</code>
        </div>
      </form>

      <div className="auth-footer">
        <p>
          還沒有帳戶？
          <button
            type="button"
            className="auth-link"
            onClick={onSwitchToRegister}
          >
            立即註冊
          </button>
        </p>
      </div>
    </div>
  )
}