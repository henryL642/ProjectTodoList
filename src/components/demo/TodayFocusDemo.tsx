/**
 * TodayFocusDemo - Demonstration component for Today Focus page
 * Part of MVP Implementation Guide Week 2 Day 1-2
 */

import React, { useState } from 'react'
import { TodayFocusView } from '../views/TodayFocusView'
import { useTodosWithScheduling } from '../../hooks/useTodosWithScheduling'
import { Priority } from '../../types/priority'
import { MagicButton } from '../MagicButton'

export const TodayFocusDemo: React.FC = () => {
  const { addTodoWithScheduling } = useTodosWithScheduling()
  const [isCreatingDemo, setIsCreatingDemo] = useState(false)

  const createDemoTasks = async () => {
    setIsCreatingDemo(true)
    
    const demoTasks = [
      {
        text: '準備明天的會議簡報',
        priority: Priority.URGENT_IMPORTANT,
        totalPomodoros: 3,
        autoSchedule: true
      },
      {
        text: '回覆重要郵件',
        priority: Priority.URGENT_IMPORTANT,
        totalPomodoros: 1,
        autoSchedule: true
      },
      {
        text: '完成專案文檔',
        priority: Priority.IMPORTANT_NOT_URGENT,
        totalPomodoros: 4,
        autoSchedule: true
      },
      {
        text: '學習新技術',
        priority: Priority.IMPORTANT_NOT_URGENT,
        totalPomodoros: 2,
        autoSchedule: true
      },
      {
        text: '整理辦公桌',
        priority: Priority.NOT_URGENT_NOT_IMPORTANT,
        totalPomodoros: 1,
        autoSchedule: false
      }
    ]

    try {
      for (const task of demoTasks) {
        await addTodoWithScheduling(task)
        // Small delay to prevent overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 200))
      }
      
      console.log('✅ Demo tasks created successfully!')
    } catch (error) {
      console.error('❌ Failed to create demo tasks:', error)
    } finally {
      setIsCreatingDemo(false)
    }
  }

  return (
    <div className="today-focus-demo">
      <div className="demo-header">
        <h2>🏠 今日焦點頁面演示</h2>
        <p>這是新的今日焦點頁面，專門解決任務遺忘問題的核心功能。</p>
        
        <div className="demo-actions">
          <MagicButton
            onClick={createDemoTasks}
            disabled={isCreatingDemo}
            variant="primary"
          >
            {isCreatingDemo ? '創建演示任務中...' : '創建演示任務'}
          </MagicButton>
        </div>
      </div>

      <div className="demo-features">
        <h3>🎯 核心功能亮點</h3>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">⏰</div>
            <h4>智能排程</h4>
            <p>自動將任務安排到最佳時間，基於優先級和可用時間</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">🎯</div>
            <h4>今日焦點</h4>
            <p>清晰顯示今天要做的事，避免重要任務被遺忘</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">🍅</div>
            <h4>番茄鐘管理</h4>
            <p>以25分鐘為單位管理時間，提高專注度和效率</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h4>優先級管理</h4>
            <p>使用艾森豪威爾矩陣，幫您區分重要與緊急</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">⚠️</div>
            <h4>緊急提醒</h4>
            <p>未安排的緊急任務會特別提醒，確保不會遺漏</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">📈</div>
            <h4>進度追蹤</h4>
            <p>實時顯示今日完成進度，激勵持續執行</p>
          </div>
        </div>
      </div>

      <div className="demo-usage">
        <h3>📖 使用指南</h3>
        <div className="usage-steps">
          <div className="step">
            <div className="step-number">1</div>
            <div className="step-content">
              <h4>創建任務</h4>
              <p>點擊「創建演示任務」按鈕，或使用快速操作添加真實任務</p>
            </div>
          </div>
          
          <div className="step">
            <div className="step-number">2</div>
            <div className="step-content">
              <h4>智能排程</h4>
              <p>點擊「智能排程」按鈕，系統會自動安排任務到合適的時間</p>
            </div>
          </div>
          
          <div className="step">
            <div className="step-number">3</div>
            <div className="step-content">
              <h4>開始執行</h4>
              <p>按照時間軸開始執行任務，點擊「開始」進入專注模式</p>
            </div>
          </div>
          
          <div className="step">
            <div className="step-number">4</div>
            <div className="step-content">
              <h4>追蹤進度</h4>
              <p>查看今日進度和統計，完成後標記為已完成</p>
            </div>
          </div>
        </div>
      </div>

      {/* Today Focus View */}
      <div className="demo-content">
        <TodayFocusView />
      </div>
    </div>
  )
}

// Demo styles
const demoStyles = `
.today-focus-demo {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

.demo-header {
  text-align: center;
  margin-bottom: 40px;
  padding: 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  color: white;
}

.demo-header h2 {
  margin: 0 0 12px 0;
  font-size: 2em;
}

.demo-header p {
  margin: 0 0 20px 0;
  font-size: 1.1em;
  opacity: 0.9;
}

.demo-actions {
  margin-top: 20px;
}

.demo-features {
  margin-bottom: 40px;
}

.demo-features h3 {
  text-align: center;
  margin-bottom: 24px;
  color: var(--text-primary, #212529);
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.feature-card {
  padding: 20px;
  background: var(--bg-primary, #ffffff);
  border-radius: 12px;
  border: 1px solid var(--border-color, #e1e5e9);
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.feature-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.feature-icon {
  font-size: 2.5em;
  margin-bottom: 12px;
}

.feature-card h4 {
  margin: 0 0 8px 0;
  color: var(--text-primary, #212529);
}

.feature-card p {
  margin: 0;
  color: var(--text-secondary, #6c757d);
  font-size: 0.9em;
  line-height: 1.5;
}

.demo-usage {
  margin-bottom: 40px;
}

.demo-usage h3 {
  text-align: center;
  margin-bottom: 24px;
  color: var(--text-primary, #212529);
}

.usage-steps {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.step {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 20px;
  background: var(--bg-secondary, #f8f9fa);
  border-radius: 12px;
  border: 1px solid var(--border-color, #e1e5e9);
}

.step-number {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #667eea;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  flex-shrink: 0;
}

.step-content h4 {
  margin: 0 0 8px 0;
  color: var(--text-primary, #212529);
}

.step-content p {
  margin: 0;
  color: var(--text-secondary, #6c757d);
  font-size: 0.9em;
  line-height: 1.5;
}

.demo-content {
  margin-top: 40px;
  border-top: 2px solid var(--border-color, #e1e5e9);
  padding-top: 40px;
}

@media (max-width: 768px) {
  .features-grid,
  .usage-steps {
    grid-template-columns: 1fr;
  }
  
  .step {
    flex-direction: column;
    text-align: center;
  }
}
`

// Inject styles if not already present
if (typeof document !== 'undefined' && !document.querySelector('#today-focus-demo-styles')) {
  const styleSheet = document.createElement('style')
  styleSheet.id = 'today-focus-demo-styles'
  styleSheet.textContent = demoStyles
  document.head.appendChild(styleSheet)
}