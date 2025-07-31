import React, { useState } from 'react'
import { MagicButton } from '../MagicButton'

/**
 * 簡化的智慧排程演示組件
 * 展示基本的排程概念和界面
 */
export const SimpleSchedulingDemo: React.FC = () => {
  const [selectedTask, setSelectedTask] = useState('')
  const [schedulingResult, setSchedulingResult] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  // 示例任務
  const exampleTasks = [
    {
      id: 'task-1',
      name: '產品設計：智慧番茄鐘功能',
      pomodoros: 10,
      days: 3,
      description: '設計完整的番茄鐘時間管理系統'
    },
    {
      id: 'task-2',
      name: 'UI設計系統建立',
      pomodoros: 8,
      days: 4,
      description: '建立統一的設計語言和組件庫'
    },
    {
      id: 'task-3',
      name: 'API介面開發',
      pomodoros: 6,
      days: 2,
      description: '開發RESTful API接口'
    },
    {
      id: 'task-4',
      name: '用戶測試與反饋收集',
      pomodoros: 4,
      days: 5,
      description: '進行用戶體驗測试和數據收集'
    }
  ]

  /**
   * 模擬智慧排程功能
   */
  const simulateScheduling = async () => {
    const task = exampleTasks.find(t => t.id === selectedTask)
    if (!task) return

    setIsLoading(true)
    
    // 模擬排程計算過程
    await new Promise(resolve => setTimeout(resolve, 2000))

    // 生成模擬排程結果
    const scheduleSlots = []
    let remainingPomodoros = task.pomodoros
    let currentDay = 1

    while (remainingPomodoros > 0 && currentDay <= task.days) {
      const dailyAllocation = Math.min(
        Math.ceil(remainingPomodoros / (task.days - currentDay + 1)),
        4 // 每天最多4個番茄鐘
      )

      const startTime = currentDay === 1 ? '09:00' : '10:00'
      const endTime = currentDay === 1 ? '11:45' : '12:45'

      scheduleSlots.push({
        day: currentDay,
        date: getDateString(currentDay),
        startTime,
        endTime,
        pomodoros: dailyAllocation,
        description: currentDay === 1 ? '需求分析與研究' : 
                    currentDay === 2 ? '概念設計與草圖' :
                    currentDay === 3 ? '詳細設計與原型' : '驗證與調整'
      })

      remainingPomodoros -= dailyAllocation
      currentDay++
    }

    setSchedulingResult({
      task,
      slots: scheduleSlots,
      complexity: {
        score: task.pomodoros > 8 ? 'complex' : task.pomodoros > 4 ? 'moderate' : 'simple',
        suggestions: [
          '建議在上午精神狀態最佳時執行',
          '每個番茄鐘專注25分鐘，休息5分鐘',
          '可以根據實際情況調整時間安排'
        ]
      },
      confidence: 85,
      strategy: '均勻分配策略'
    })

    setIsLoading(false)
  }

  const getDateString = (dayOffset: number) => {
    const date = new Date()
    date.setDate(date.getDate() + dayOffset)
    return date.toLocaleDateString('zh-TW', { 
      month: 'short', 
      day: 'numeric',
      weekday: 'short'
    })
  }

  const resetDemo = () => {
    setSelectedTask('')
    setSchedulingResult(null)
  }

  return (
    <div className="simple-scheduling-demo" style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
      <div className="demo-header" style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h2 style={{ color: '#2d3748', marginBottom: '1rem', fontSize: '2rem' }}>
          🍅 智慧番茄鐘排程演示
        </h2>
        <p style={{ color: '#718096', fontSize: '1.1rem' }}>
          體驗智慧時間分配系統如何將任務合理分配到不同時間段
        </p>
      </div>

      {/* 步驟1: 選擇任務 */}
      <div className="demo-section" style={{ 
        background: 'white', 
        borderRadius: '12px', 
        padding: '2rem', 
        marginBottom: '2rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e2e8f0'
      }}>
        <h3 style={{ color: '#2d3748', marginBottom: '1.5rem', borderBottom: '2px solid #667eea', paddingBottom: '0.5rem' }}>
          📋 步驟1: 選擇任務
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          {exampleTasks.map((task) => (
            <div
              key={task.id}
              onClick={() => setSelectedTask(task.id)}
              style={{
                border: selectedTask === task.id ? '2px solid #667eea' : '2px solid #e2e8f0',
                borderRadius: '8px',
                padding: '1.5rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                backgroundColor: selectedTask === task.id ? '#f7fafc' : 'white'
              }}
            >
              <h4 style={{ color: '#2d3748', marginBottom: '1rem', fontSize: '1.1rem' }}>
                {task.name}
              </h4>
              <p style={{ color: '#718096', fontSize: '0.9rem', marginBottom: '1rem' }}>
                {task.description}
              </p>
              <div style={{ display: 'flex', gap: '1rem', fontSize: '0.9rem', color: '#718096' }}>
                <span>🍅 {task.pomodoros} 個番茄鐘</span>
                <span>📅 {task.days} 天完成</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 步驟2: 執行排程 */}
      {selectedTask && (
        <div className="demo-section" style={{ 
          background: 'white', 
          borderRadius: '12px', 
          padding: '2rem', 
          marginBottom: '2rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e2e8f0'
        }}>
          <h3 style={{ color: '#2d3748', marginBottom: '1.5rem', borderBottom: '2px solid #667eea', paddingBottom: '0.5rem' }}>
            🧠 步驟2: 執行智慧排程
          </h3>
          
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <MagicButton
              onClick={simulateScheduling}
              disabled={isLoading}
              variant="primary"
            >
              {isLoading ? '🔄 排程中...' : '🚀 開始智慧排程'}
            </MagicButton>
            
            <MagicButton
              onClick={resetDemo}
              variant="secondary"
              size="small"
            >
              🔄 重置演示
            </MagicButton>
          </div>

          {isLoading && (
            <div style={{ marginTop: '1rem', padding: '1rem', background: '#edf2f7', borderRadius: '8px', borderLeft: '4px solid #667eea' }}>
              <div style={{ color: '#4a5568', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                正在分析任務複雜度...
              </div>
              <div style={{ color: '#4a5568', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                計算最佳分配策略...
              </div>
              <div style={{ color: '#4a5568', fontSize: '0.9rem' }}>
                生成排程時間段...
              </div>
            </div>
          )}
        </div>
      )}

      {/* 步驟3: 查看結果 */}
      {schedulingResult && (
        <div className="demo-section" style={{ 
          background: 'white', 
          borderRadius: '12px', 
          padding: '2rem', 
          marginBottom: '2rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e2e8f0'
        }}>
          <h3 style={{ color: '#2d3748', marginBottom: '1.5rem', borderBottom: '2px solid #667eea', paddingBottom: '0.5rem' }}>
            📊 步驟3: 排程結果
          </h3>

          <div style={{ background: '#f0fff4', border: '2px solid #48bb78', borderRadius: '8px', padding: '1rem', marginBottom: '2rem', color: '#2f855a', fontWeight: '500', textAlign: 'center' }}>
            ✅ 任務 "{schedulingResult.task.name}" 已成功排程到 {schedulingResult.task.days} 天內完成
          </div>

          {/* 複雜度分析 */}
          <div style={{ background: '#f7fafc', borderRadius: '8px', padding: '1.5rem', marginBottom: '1.5rem' }}>
            <h4 style={{ color: '#2d3748', marginBottom: '1rem' }}>🧠 任務複雜度分析</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
              <div>複雜度等級: <strong>{schedulingResult.complexity.score}</strong></div>
              <div>選擇策略: <strong>{schedulingResult.strategy}</strong></div>
              <div>信心度: <strong>{schedulingResult.confidence}%</strong></div>
            </div>
            
            <div>
              <strong>建議:</strong>
              <ul style={{ margin: '0.5rem 0 0 1rem', color: '#4a5568' }}>
                {schedulingResult.complexity.suggestions.map((suggestion: string, index: number) => (
                  <li key={index}>{suggestion}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* 排程時間表 */}
          <div style={{ background: '#f0fff4', borderRadius: '8px', padding: '1.5rem' }}>
            <h4 style={{ color: '#2d3748', marginBottom: '1rem' }}>📅 排程時間表</h4>
            <div style={{ display: 'grid', gap: '1rem' }}>
              {schedulingResult.slots.map((slot: any, index: number) => (
                <div key={index} style={{ 
                  background: 'white', 
                  border: '2px solid #e2e8f0', 
                  borderRadius: '8px', 
                  padding: '1.5rem',
                  transition: 'all 0.2s ease'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div style={{ fontWeight: 'bold', color: '#2d3748', fontSize: '1.1rem' }}>
                      第 {slot.day} 天
                    </div>
                    <div style={{ color: '#718096', fontSize: '0.9rem' }}>
                      {slot.date}
                    </div>
                  </div>
                  
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#2d3748' }}>
                      {slot.startTime} - {slot.endTime}
                    </div>
                    <div style={{ color: '#718096', fontSize: '0.9rem' }}>
                      ({slot.pomodoros * 25 + (slot.pomodoros - 1) * 5} 分鐘)
                    </div>
                  </div>
                  
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ fontWeight: '500', color: '#2d3748', marginBottom: '0.5rem' }}>
                      {slot.pomodoros} 個番茄鐘
                    </div>
                    <div style={{ fontSize: '1.2rem' }}>
                      {Array.from({ length: slot.pomodoros }, (_, i) => (
                        <span key={i} style={{ marginRight: '0.2rem' }}>🍅</span>
                      ))}
                    </div>
                  </div>
                  
                  <div style={{ color: '#4a5568', fontSize: '0.9rem' }}>
                    <strong>任務內容:</strong> {slot.description}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 技術說明 */}
      <div className="demo-section" style={{ 
        background: 'white', 
        borderRadius: '12px', 
        padding: '2rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e2e8f0'
      }}>
        <h3 style={{ color: '#2d3748', marginBottom: '1.5rem', borderBottom: '2px solid #667eea', paddingBottom: '0.5rem' }}>
          🔧 技術實作說明
        </h3>
        <div style={{ display: 'grid', gap: '1rem' }}>
          <div style={{ padding: '1rem', background: '#f7fafc', borderRadius: '8px', borderLeft: '4px solid #667eea' }}>
            <strong style={{ color: '#2d3748' }}>智慧排程算法:</strong> 根據任務大小和時間限制自動選擇最佳分配策略
          </div>
          <div style={{ padding: '1rem', background: '#f7fafc', borderRadius: '8px', borderLeft: '4px solid #667eea' }}>
            <strong style={{ color: '#2d3748' }}>番茄鐘技術:</strong> 25分鐘專注工作 + 5分鐘休息的科學時間管理法
          </div>
          <div style={{ padding: '1rem', background: '#f7fafc', borderRadius: '8px', borderLeft: '4px solid #667eea' }}>
            <strong style={{ color: '#2d3748' }}>類型安全:</strong> 完整的TypeScript類型系統，確保代碼品質
          </div>
          <div style={{ padding: '1rem', background: '#f7fafc', borderRadius: '8px', borderLeft: '4px solid #667eea' }}>
            <strong style={{ color: '#2d3748' }}>用戶體驗:</strong> 直觀的界面設計，簡單易用的操作流程
          </div>
        </div>
      </div>
    </div>
  )
}