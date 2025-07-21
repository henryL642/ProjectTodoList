import React, { useState } from 'react'
import { MagicButton } from '../MagicButton'
import { usePomodoro } from '../../context/PomodoroContext'
import type { PomodoroState } from '../../types/pomodoro'

interface PomodoroWidgetProps {
  onNavigateToSettings?: () => void
}

export const PomodoroWidget: React.FC<PomodoroWidgetProps> = ({ onNavigateToSettings }) => {
  const {
    currentSession,
    // settings,
    startSession,
    pauseSession,
    resumeSession,
    stopSession,
    getDailyStats
  } = usePomodoro()

  const [showSettings, setShowSettings] = useState(false)
  const dailyStats = getDailyStats()

  /**
   * 格式化時間顯示
   */
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
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

  return (
    <div className="pomodoro-widget">
      <div className="pomodoro-widget__header">
        <h3 className="pomodoro-widget__title">
          🍅 番茄鐘
        </h3>
        <button
          className="pomodoro-widget__settings"
          onClick={() => {
            if (onNavigateToSettings) {
              onNavigateToSettings()
            } else {
              setShowSettings(!showSettings)
            }
          }}
          title="設定"
        >
          ⚙️
        </button>
      </div>

      <div className="pomodoro-widget__display">
        {currentSession ? (
          <>
            <div className="timer-display">
              <div className="timer-display__icon">
                {getStateIcon(currentSession.currentState)}
              </div>
              <div className="timer-display__time">
                {formatTime(currentSession.timeRemaining)}
              </div>
              <div className="timer-display__state">
                {getStateDescription(currentSession.currentState)}
              </div>
            </div>

            <div className="timer-progress">
              <div 
                className="timer-progress__bar"
                style={{ width: `${getProgress()}%` }}
              />
            </div>

            <div className="timer-session-info">
              第 {currentSession.currentSession} 個工作段
            </div>

            <div className="timer-controls">
              {currentSession.currentState === 'paused' ? (
                <MagicButton
                  onClick={resumeSession}
                  variant="primary"
                  size="small"
                >
                  ▶️ 繼續
                </MagicButton>
              ) : (
                <MagicButton
                  onClick={pauseSession}
                  variant="secondary"
                  size="small"
                >
                  ⏸️ 暫停
                </MagicButton>
              )}
              
              <MagicButton
                onClick={stopSession}
                variant="danger"
                size="small"
              >
                ⏹️ 停止
              </MagicButton>
            </div>
          </>
        ) : (
          <div className="timer-idle">
            <div className="timer-idle__icon">🍅</div>
            <div className="timer-idle__message">
              準備開始專注工作？
            </div>
            <MagicButton
              onClick={() => startSession()}
              variant="primary"
              size="medium"
            >
              🎯 開始工作
            </MagicButton>
          </div>
        )}
      </div>

      <div className="pomodoro-widget__stats">
        <div className="daily-stats">
          <h4>今日統計</h4>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-item__value">{dailyStats.completedSessions}</span>
              <span className="stat-item__label">完成番茄</span>
            </div>
            <div className="stat-item">
              <span className="stat-item__value">{Math.round(dailyStats.totalWorkTime)}</span>
              <span className="stat-item__label">工作分鐘</span>
            </div>
            <div className="stat-item">
              <span className="stat-item__value">{dailyStats.interruptionCount}</span>
              <span className="stat-item__label">中斷次數</span>
            </div>
          </div>
        </div>
      </div>

      {showSettings && (
        <PomodoroSettings onClose={() => setShowSettings(false)} />
      )}
    </div>
  )
}

interface PomodoroSettingsProps {
  onClose: () => void
}

const PomodoroSettings: React.FC<PomodoroSettingsProps> = ({ onClose }) => {
  const { settings, audioSettings, updateSettings, updateAudioSettings } = usePomodoro()
  const [localSettings, setLocalSettings] = useState(settings)
  const [localAudioSettings, setLocalAudioSettings] = useState(audioSettings)

  const handleSave = () => {
    updateSettings(localSettings)
    updateAudioSettings(localAudioSettings)
    onClose()
  }

  return (
    <div className="pomodoro-settings">
      <div className="pomodoro-settings__header">
        <h4>番茄鐘設定</h4>
        <button onClick={onClose} className="close-button">✕</button>
      </div>

      <div className="pomodoro-settings__content">
        <div className="setting-group">
          <h5>時間設定</h5>
          
          <div className="setting-item">
            <label>工作時間 (分鐘)</label>
            <input
              type="number"
              min="1"
              max="60"
              value={localSettings.workDuration}
              onChange={(e) => setLocalSettings(prev => ({
                ...prev,
                workDuration: parseInt(e.target.value)
              }))}
            />
          </div>

          <div className="setting-item">
            <label>短休息 (分鐘)</label>
            <input
              type="number"
              min="1"
              max="30"
              value={localSettings.shortBreakDuration}
              onChange={(e) => setLocalSettings(prev => ({
                ...prev,
                shortBreakDuration: parseInt(e.target.value)
              }))}
            />
          </div>

          <div className="setting-item">
            <label>長休息 (分鐘)</label>
            <input
              type="number"
              min="1"
              max="60"
              value={localSettings.longBreakDuration}
              onChange={(e) => setLocalSettings(prev => ({
                ...prev,
                longBreakDuration: parseInt(e.target.value)
              }))}
            />
          </div>

          <div className="setting-item">
            <label>長休息間隔 (工作段)</label>
            <input
              type="number"
              min="2"
              max="10"
              value={localSettings.sessionsUntilLongBreak}
              onChange={(e) => setLocalSettings(prev => ({
                ...prev,
                sessionsUntilLongBreak: parseInt(e.target.value)
              }))}
            />
          </div>
        </div>

        <div className="setting-group">
          <h5>音效設定</h5>
          
          <div className="setting-item">
            <label>
              <input
                type="checkbox"
                checked={localAudioSettings.enabled}
                onChange={(e) => setLocalAudioSettings(prev => ({
                  ...prev,
                  enabled: e.target.checked
                }))}
              />
              啟用音效
            </label>
          </div>

          {localAudioSettings.enabled && (
            <div className="setting-item">
              <label>音量</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={localAudioSettings.volume}
                onChange={(e) => setLocalAudioSettings(prev => ({
                  ...prev,
                  volume: parseFloat(e.target.value)
                }))}
              />
              <span>{Math.round(localAudioSettings.volume * 100)}%</span>
            </div>
          )}
        </div>
      </div>

      <div className="pomodoro-settings__actions">
        <MagicButton
          onClick={handleSave}
          variant="primary"
          size="small"
        >
          保存設定
        </MagicButton>
        
        <MagicButton
          onClick={onClose}
          variant="secondary"
          size="small"
        >
          取消
        </MagicButton>
      </div>
    </div>
  )
}