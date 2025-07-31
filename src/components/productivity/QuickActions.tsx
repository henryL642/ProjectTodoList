/**
 * QuickActions - Quick action buttons for today focus page
 * Part of MVP Implementation Guide Week 2 Day 1-2
 */

import React, { useState } from 'react'
import { MagicButton } from '../MagicButton'

interface QuickActionsProps {
  onSmartSchedule: () => Promise<void>
  isScheduling: boolean
  unscheduledCount: number
  className?: string
  onQuickAddTask?: () => void
  onEnterFocusMode?: () => void
  onShowSummary?: () => void
  onOpenSettings?: () => void
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  onSmartSchedule,
  isScheduling,
  unscheduledCount,
  className = '',
  onQuickAddTask,
  onEnterFocusMode,
  onShowSummary,
  onOpenSettings
}) => {
  const [isExpanded, setIsExpanded] = useState(false)

  const handleSmartSchedule = async () => {
    try {
      await onSmartSchedule()
    } catch (error) {
      console.error('Smart schedule action failed:', error)
    }
  }

  return (
    <section className={`quick-actions ${isExpanded ? 'expanded' : ''} ${className}`}>
      <div className="quick-actions-header">
        <h3>⚡ 快速操作</h3>
        <button 
          className="expand-toggle"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? '收起' : '展開'}
        </button>
      </div>

      <div className="actions-grid">
        {/* Smart Schedule - Primary Action */}
        <div className="action-item primary">
          <div className="action-content">
            <div className="action-icon">🤖</div>
            <div className="action-info">
              <h4>智能排程</h4>
              <p>自動安排未排程的任務到最佳時間</p>
              {unscheduledCount > 0 && (
                <div className="action-badge">
                  {unscheduledCount} 個待排程
                </div>
              )}
            </div>
          </div>
          
          <MagicButton
            variant="primary"
            size="large"
            onClick={handleSmartSchedule}
            disabled={isScheduling || unscheduledCount === 0}
            className="action-button"
          >
            {isScheduling ? '排程中...' : '開始排程'}
          </MagicButton>
        </div>

        {/* Additional Actions - Show when expanded */}
        {isExpanded && (
          <>
            <div className="action-item">
              <div className="action-content">
                <div className="action-icon">📝</div>
                <div className="action-info">
                  <h4>快速添加任務</h4>
                  <p>快速創建新任務並自動排程</p>
                </div>
              </div>
              
              <MagicButton
                variant="secondary"
                onClick={() => {
                  if (onQuickAddTask) {
                    onQuickAddTask()
                  } else {
                    console.log('Quick add task not implemented')
                  }
                }}
                className="action-button"
              >
                添加任務
              </MagicButton>
            </div>

            <div className="action-item">
              <div className="action-content">
                <div className="action-icon">🎯</div>
                <div className="action-info">
                  <h4>專注模式</h4>
                  <p>開始專注時間，隱藏干擾</p>
                </div>
              </div>
              
              <MagicButton
                variant="accent"
                onClick={() => {
                  if (onEnterFocusMode) {
                    onEnterFocusMode()
                  } else {
                    console.log('Focus mode not implemented')
                  }
                }}
                className="action-button"
              >
                開始專注
              </MagicButton>
            </div>

            <div className="action-item">
              <div className="action-content">
                <div className="action-icon">📊</div>
                <div className="action-info">
                  <h4>今日總結</h4>
                  <p>查看今日完成情況和統計</p>
                </div>
              </div>
              
              <MagicButton
                variant="outline"
                onClick={() => {
                  if (onShowSummary) {
                    onShowSummary()
                  } else {
                    alert('今日總結功能將在未來版本中推出')
                  }
                }}
                className="action-button"
              >
                查看總結
              </MagicButton>
            </div>

            <div className="action-item">
              <div className="action-content">
                <div className="action-icon">⚙️</div>
                <div className="action-info">
                  <h4>排程設定</h4>
                  <p>調整工作時間和排程偏好</p>
                </div>
              </div>
              
              <MagicButton
                variant="ghost"
                onClick={() => {
                  if (onOpenSettings) {
                    onOpenSettings()
                  } else {
                    alert('排程設定功能將在未來版本中推出')
                  }
                }}
                className="action-button"
              >
                設定
              </MagicButton>
            </div>
          </>
        )}
      </div>

      {/* Status Information */}
      <div className="actions-status">
        {isScheduling && (
          <div className="status-item scheduling">
            <span className="status-icon">🔄</span>
            <span className="status-text">正在智能排程中...</span>
          </div>
        )}
        
        {!isScheduling && unscheduledCount > 0 && (
          <div className="status-item pending">
            <span className="status-icon">⏳</span>
            <span className="status-text">
              有 {unscheduledCount} 個任務待排程
            </span>
          </div>
        )}
        
        {!isScheduling && unscheduledCount === 0 && (
          <div className="status-item complete">
            <span className="status-icon">✅</span>
            <span className="status-text">所有任務已安排完成</span>
          </div>
        )}
      </div>

      {/* Quick Tips */}
      {!isExpanded && (
        <div className="quick-tip">
          💡 點擊「智能排程」讓系統自動安排您的任務時間
        </div>
      )}
    </section>
  )
}