import React, { useState, useEffect } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'

type Theme = 'light' | 'dark'

export const ThemeToggle: React.FC = () => {
  const [theme, setTheme] = useLocalStorage<Theme>('theme', 'light')
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setIsAnimating(true)
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light')
    
    setTimeout(() => setIsAnimating(false), 500)
  }

  return (
    <button
      className={`theme-toggle ${isAnimating ? 'animating' : ''}`}
      onClick={toggleTheme}
      aria-label={`切換到${theme === 'light' ? '深色' : '淺色'}模式`}
      title={`當前：${theme === 'light' ? '淺色' : '深色'}模式`}
    >
      <div className="theme-toggle__track">
        <div className="theme-toggle__thumb">
          <span className="theme-toggle__icon">
            {theme === 'light' ? '🌙' : '☀️'}
          </span>
        </div>
      </div>
      <span className="theme-toggle__label">
        {theme === 'light' ? '深色模式' : '淺色模式'}
      </span>
    </button>
  )
}