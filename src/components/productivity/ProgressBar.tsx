/**
 * ProgressBar - Progress visualization component
 * Part of MVP Implementation Guide Week 2 Day 1-2
 */

import React from 'react'

interface ProgressBarProps {
  completed: number
  total: number
  label?: string
  showPercentage?: boolean
  showFraction?: boolean
  size?: 'small' | 'medium' | 'large'
  color?: string
  backgroundColor?: string
  className?: string
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  completed,
  total,
  label,
  showPercentage = true,
  showFraction = true,
  size = 'medium',
  color = '#4CAF50',
  backgroundColor = '#E0E0E0',
  className = ''
}) => {
  // Calculate percentage
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0
  
  // Determine size class
  const sizeClass = `progress-${size}`
  
  // Get appropriate color based on progress
  const getProgressColor = (): string => {
    if (percentage >= 80) return '#4CAF50' // Green
    if (percentage >= 60) return '#8BC34A' // Light Green
    if (percentage >= 40) return '#FFC107' // Amber
    if (percentage >= 20) return '#FF9800' // Orange
    return '#F44336' // Red
  }

  const progressColor = color === '#4CAF50' ? getProgressColor() : color

  return (
    <div className={`progress-bar-container ${sizeClass} ${className}`}>
      {label && (
        <div className="progress-label">
          <span className="label-text">{label}</span>
          <div className="progress-stats">
            {showFraction && (
              <span className="progress-fraction">
                {completed}/{total}
              </span>
            )}
            {showPercentage && (
              <span className="progress-percentage">
                {percentage}%
              </span>
            )}
          </div>
        </div>
      )}
      
      <div 
        className="progress-track"
        style={{ backgroundColor }}
      >
        <div 
          className="progress-fill"
          style={{ 
            width: `${percentage}%`,
            backgroundColor: progressColor
          }}
        >
          {/* Progress animation effect */}
          <div className="progress-shine" />
        </div>
        
        {/* Progress markers for better visual feedback */}
        {total > 1 && size !== 'small' && (
          <div className="progress-markers">
            {Array.from({ length: Math.min(total - 1, 10) }, (_, index) => {
              const markerPosition = ((index + 1) / total) * 100
              return (
                <div
                  key={index}
                  className="progress-marker"
                  style={{ left: `${markerPosition}%` }}
                />
              )
            })}
          </div>
        )}
      </div>
      
      {!label && (showFraction || showPercentage) && (
        <div className="progress-info">
          {showFraction && (
            <span className="inline-fraction">
              {completed}/{total}
            </span>
          )}
          {showPercentage && (
            <span className="inline-percentage">
              {percentage}%
            </span>
          )}
        </div>
      )}
    </div>
  )
}

// Circular progress variant
interface CircularProgressProps {
  completed: number
  total: number
  size?: number
  strokeWidth?: number
  color?: string
  backgroundColor?: string
  showText?: boolean
  className?: string
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  completed,
  total,
  size = 60,
  strokeWidth = 4,
  color = '#4CAF50',
  backgroundColor = '#E0E0E0',
  showText = true,
  className = ''
}) => {
  const percentage = total > 0 ? (completed / total) * 100 : 0
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <div className={`circular-progress ${className}`}>
      <svg
        width={size}
        height={size}
        className="circular-progress-svg"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
        />
        
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="progress-circle"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      
      {showText && (
        <div className="circular-progress-text">
          <span className="percentage">{Math.round(percentage)}%</span>
        </div>
      )}
    </div>
  )
}

// Mini progress indicator for small spaces
interface MiniProgressProps {
  completed: number
  total: number
  color?: string
  className?: string
}

export const MiniProgress: React.FC<MiniProgressProps> = ({
  completed,
  total,
  color = '#4CAF50',
  className = ''
}) => {
  const percentage = total > 0 ? (completed / total) * 100 : 0

  return (
    <div className={`mini-progress ${className}`}>
      <div className="mini-progress-track">
        <div 
          className="mini-progress-fill"
          style={{ 
            width: `${percentage}%`,
            backgroundColor: color
          }}
        />
      </div>
      <span className="mini-progress-text">
        {completed}/{total}
      </span>
    </div>
  )
}