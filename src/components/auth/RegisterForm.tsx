import React, { useState, useCallback } from 'react'
import { useUser } from '../../context/UserContext'
import type { RegisterCredentials } from '../../types/user'

interface RegisterFormProps {
  onSwitchToLogin: () => void
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSwitchToLogin }) => {
  const { register, isLoading, error, clearError } = useUser()
  const [credentials, setCredentials] = useState<RegisterCredentials>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleInputChange = useCallback((field: keyof RegisterCredentials, value: string) => {
    setCredentials(prev => ({ ...prev, [field]: value }))
    if (error) clearError()
  }, [error, clearError])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isFormValid) {
      return
    }
    
    const success = await register(credentials)
    if (success) {
      // Registration successful, UserContext will handle state update
    }
  }, [credentials, register])

  const isFormValid = 
    credentials.username.trim().length >= 3 &&
    credentials.email.trim() &&
    credentials.password.length >= 6 &&
    credentials.password === credentials.confirmPassword

  const passwordsMatch = 
    !credentials.confirmPassword || credentials.password === credentials.confirmPassword

  return (
    <div className="auth-form">
      <div className="auth-header">
        <h2>註冊</h2>
        <p>創建您的新帳戶</p>
      </div>

      <form onSubmit={handleSubmit} className="auth-form__form">
        <div className="form-group">
          <label htmlFor="username">用戶名</label>
          <input
            id="username"
            type="text"
            value={credentials.username}
            onChange={(e) => handleInputChange('username', e.target.value)}
            placeholder="請輸入用戶名 (至少3個字符)"
            required
            autoComplete="username"
            className={credentials.username.trim() && credentials.username.length < 3 ? 'error' : ''}
          />
          {credentials.username.trim() && credentials.username.length < 3 && (
            <span className="field-error">用戶名至少需要3個字符</span>
          )}
        </div>

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
              placeholder="請輸入密碼 (至少6個字符)"
              required
              autoComplete="new-password"
              className={credentials.password && credentials.password.length < 6 ? 'error' : ''}
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
          {credentials.password && credentials.password.length < 6 && (
            <span className="field-error">密碼至少需要6個字符</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">確認密碼</label>
          <div className="password-input">
            <input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={credentials.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              placeholder="請再次輸入密碼"
              required
              autoComplete="new-password"
              className={!passwordsMatch ? 'error' : ''}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label={showConfirmPassword ? '隱藏密碼' : '顯示密碼'}
            >
              {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
          {!passwordsMatch && (
            <span className="field-error">密碼不匹配</span>
          )}
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
          {isLoading ? '註冊中...' : '註冊'}
        </button>
      </form>

      <div className="auth-footer">
        <p>
          已有帳戶？
          <button
            type="button"
            className="auth-link"
            onClick={onSwitchToLogin}
          >
            立即登錄
          </button>
        </p>
      </div>
    </div>
  )
}