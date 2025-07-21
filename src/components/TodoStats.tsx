import React, { useEffect, useState } from 'react'

interface TodoStatsProps {
  totalTodos: number
  activeTodos: number
  completedTodos: number
  completionRate: number
}

export const TodoStats: React.FC<TodoStatsProps> = ({
  totalTodos,
  activeTodos,
  completedTodos,
  completionRate,
}) => {
  const [animatedTotal, setAnimatedTotal] = useState(totalTodos)
  const [animatedActive, setAnimatedActive] = useState(activeTodos)
  const [animatedCompleted, setAnimatedCompleted] = useState(completedTodos)
  const [animatedRate, setAnimatedRate] = useState(completionRate)

  useEffect(() => {
    const animateNumber = (current: number, target: number, setter: (value: number) => void) => {
      if (current === target) return

      const duration = 500
      const steps = 20
      const increment = (target - current) / steps
      let step = 0

      const timer = setInterval(() => {
        step++
        const newValue = current + (increment * step)
        
        if (step >= steps) {
          setter(target)
          clearInterval(timer)
        } else {
          setter(Math.round(newValue * 100) / 100)
        }
      }, duration / steps)
    }

    animateNumber(animatedTotal, totalTodos, setAnimatedTotal)
    animateNumber(animatedActive, activeTodos, setAnimatedActive)
    animateNumber(animatedCompleted, completedTodos, setAnimatedCompleted)
    animateNumber(animatedRate, completionRate, setAnimatedRate)
  }, [totalTodos, activeTodos, completedTodos, completionRate])

  return (
    <div className="todo-stats">
      <h3 className="todo-stats__title">任務統計</h3>
      
      <div className="todo-stats__grid">
        <div className="stat-card stat-card--total">
          <div className="stat-card__icon">📝</div>
          <div className="stat-card__content">
            <div className="stat-card__value">{Math.round(animatedTotal)}</div>
            <div className="stat-card__label">總任務</div>
          </div>
        </div>

        <div className="stat-card stat-card--active">
          <div className="stat-card__icon">⏳</div>
          <div className="stat-card__content">
            <div className="stat-card__value">{Math.round(animatedActive)}</div>
            <div className="stat-card__label">進行中</div>
          </div>
        </div>

        <div className="stat-card stat-card--completed">
          <div className="stat-card__icon">✅</div>
          <div className="stat-card__content">
            <div className="stat-card__value">{Math.round(animatedCompleted)}</div>
            <div className="stat-card__label">已完成</div>
          </div>
        </div>

        <div className="stat-card stat-card--rate">
          <div className="stat-card__icon">📊</div>
          <div className="stat-card__content">
            <div className="stat-card__value">{Math.round(animatedRate)}%</div>
            <div className="stat-card__label">完成率</div>
          </div>
        </div>
      </div>

      <div className="progress-bar">
        <div className="progress-bar__track">
          <div 
            className="progress-bar__fill"
            style={{ width: `${animatedRate}%` }}
          >
            <div className="progress-bar__glow"></div>
          </div>
        </div>
        <div className="progress-bar__label">
          整體進度：{Math.round(animatedRate)}%
        </div>
      </div>
    </div>
  )
}