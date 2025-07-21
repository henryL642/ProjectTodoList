import React, { useState } from 'react'

interface MagicButtonProps {
  children: React.ReactNode
  onClick: () => void
  variant?: 'primary' | 'secondary' | 'danger' | 'success'
  size?: 'small' | 'medium' | 'large'
  disabled?: boolean
  loading?: boolean
  className?: string
}

export const MagicButton: React.FC<MagicButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  className = '',
}) => {
  const [isClicked, setIsClicked] = useState(false)

  const handleClick = () => {
    if (disabled || loading) return
    
    setIsClicked(true)
    onClick()
    
    // Reset click animation
    setTimeout(() => setIsClicked(false), 300)
  }

  const baseClasses = 'magic-button'
  const variantClasses = `magic-button--${variant}`
  const sizeClasses = `magic-button--${size}`
  const stateClasses = [
    disabled && 'magic-button--disabled',
    loading && 'magic-button--loading',
    isClicked && 'magic-button--clicked',
  ].filter(Boolean).join(' ')

  return (
    <button
      className={`${baseClasses} ${variantClasses} ${sizeClasses} ${stateClasses} ${className}`}
      onClick={handleClick}
      disabled={disabled || loading}
    >
      <span className="magic-button__content">
        {loading ? (
          <span className="magic-button__spinner">⟳</span>
        ) : (
          children
        )}
      </span>
      <span className="magic-button__ripple"></span>
    </button>
  )
}