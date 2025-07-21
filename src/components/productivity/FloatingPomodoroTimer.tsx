import React, { useState } from 'react'
import { usePomodoro } from '../../context/PomodoroContext'
import { MagicButton } from '../MagicButton'
import type { PomodoroState } from '../../types/pomodoro'

export const FloatingPomodoroTimer: React.FC = () => {
  const {
    currentSession,
    startSession,
    pauseSession,
    resumeSession,
    stopSession
  } = usePomodoro()

  const [isExpanded, setIsExpanded] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)

  /**
   * 格式化時間顯示
   */
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  /**
   * 獲取狀態圖標
   */
  const getStateIcon = (state: PomodoroState): string => {
    switch (state) {
      case 'working': return '🍅'
      case 'shortBreak': return '☕'
      case 'longBreak': return '🌟'
      case 'paused': return '⏸️'
      case 'idle': return '⭕'
      default: return '❓'
    }
  }

  /**
   * 獲取狀態描述
   */
  const getStateDescription = (state: PomodoroState): string => {
    switch (state) {
      case 'working': return '專注工作中'
      case 'shortBreak': return '短休息'
      case 'longBreak': return '長休息'
      case 'paused': return '已暫停'
      case 'idle': return '待機中'
      default: return '未知狀態'
    }
  }

  /**
   * 獲取進度百分比
   */
  const getProgress = (): number => {
    if (!currentSession) return 0
    
    const totalTime = currentSession.currentState === 'working'
      ? currentSession.settings.workDuration * 60
      : currentSession.currentState === 'longBreak'
        ? currentSession.settings.longBreakDuration * 60
        : currentSession.settings.shortBreakDuration * 60
    
    return ((totalTime - currentSession.timeRemaining) / totalTime) * 100
  }

  // Don't render if minimized
  if (isMinimized) {
    return (
      <div className="floating-pomodoro minimized" onClick={() => setIsMinimized(false)}>
        <div className="minimize-indicator">
          🍅
        </div>
      </div>
    )
  }

  return (
    <div className={`floating-pomodoro ${isExpanded ? 'expanded' : 'compact'}`}>
      {/* Header */}
      <div className="floating-pomodoro__header">
        <div className="timer-icon" onClick={() => setIsExpanded(!isExpanded)}>
          {currentSession ? getStateIcon(currentSession.currentState) : '🍅'}
        </div>
        
        {currentSession && (
          <div className="timer-display-compact">
            <span className="timer-time">{formatTime(currentSession.timeRemaining)}</span>
          </div>
        )}

        <div className="header-controls">
          <button
            className="control-button"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? '收起' : '展開'}
          >
            {isExpanded ? '⬇️' : '⬆️'}
          </button>
          <button
            className="control-button"
            onClick={() => setIsMinimized(true)}
            title="最小化"
          >
            ➖
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="floating-pomodoro__content">
          {currentSession ? (
            <>
              <div className="timer-display-full">
                <div className="timer-state">
                  {getStateDescription(currentSession.currentState)}
                </div>
                <div className="timer-session-info">
                  第 {currentSession.currentSession} 個工作段
                </div>
              </div>

              <div className="timer-progress">
                <div 
                  className="timer-progress__bar"
                  style={{ 
                    width: `${getProgress()}%`,
                    backgroundColor: currentSession.currentState === 'working' ? '#ef4444' : '#22c55e'
                  }}
                />
              </div>

              <div className="timer-controls">
                {currentSession.currentState === 'paused' ? (
                  <MagicButton
                    onClick={resumeSession}
                    variant="primary"
                    size="small"
                  >
                    ▶️
                  </MagicButton>
                ) : (
                  <MagicButton
                    onClick={pauseSession}
                    variant="secondary"
                    size="small"
                  >
                    ⏸️
                  </MagicButton>
                )}
                
                <MagicButton
                  onClick={stopSession}
                  variant="danger"
                  size="small"
                >
                  ⏹️
                </MagicButton>
              </div>
            </>
          ) : (
            <div className="timer-start">
              <div className="start-message">準備開始專注？</div>
              <MagicButton
                onClick={() => startSession()}
                variant="primary"
                size="small"
              >
                🎯 開始
              </MagicButton>
            </div>
          )}
        </div>
      )}
    </div>
  )
}