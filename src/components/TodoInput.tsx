import React, { useState, useCallback } from 'react'

interface TodoInputProps {
  onAdd: (text: string) => void
  placeholder?: string
  maxLength?: number
  disabled?: boolean
}

export const TodoInput: React.FC<TodoInputProps> = ({
  onAdd,
  placeholder = '需要做什麼？',
  maxLength = 255,
  disabled = false,
}) => {
  const [text, setText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    
    const trimmedText = text.trim()
    if (!trimmedText || isSubmitting || disabled) {
      return
    }

    setIsSubmitting(true)
    
    try {
      onAdd(trimmedText)
      setText('')
    } catch (error) {
      console.error('Failed to add todo:', error)
    } finally {
      setIsSubmitting(false)
    }
  }, [text, onAdd, isSubmitting, disabled])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value.length <= maxLength) {
      setText(value)
    }
  }, [maxLength])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setText('')
    }
  }, [])

  const isValidInput = text.trim().length > 0
  const remainingChars = maxLength - text.length

  return (
    <form onSubmit={handleSubmit} className="todo-form">
      <div className="todo-input-container">
        <input
          type="text"
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`todo-input ${isSubmitting ? 'submitting' : ''} ${!isValidInput && text.length > 0 ? 'invalid' : ''}`}
          autoFocus
          disabled={disabled || isSubmitting}
          maxLength={maxLength}
          aria-label="添加新任務"
          aria-describedby="char-count"
        />
        {isSubmitting && (
          <div className="input-spinner" aria-label="正在添加任務">
            ⟳
          </div>
        )}
      </div>
      
      {text.length > 0 && (
        <div className="input-meta">
          <span id="char-count" className={`char-count ${remainingChars < 20 ? 'warning' : ''}`}>
            {remainingChars} 字符剩餘
          </span>
          {isValidInput && (
            <span className="input-hint">按 Enter 添加，Esc 清空</span>
          )}
        </div>
      )}
    </form>
  )
}
