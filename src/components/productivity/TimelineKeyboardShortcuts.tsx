/**
 * TimelineKeyboardShortcuts - Keyboard shortcuts for timeline interactions
 * Part of Timeline Enhancement Implementation
 */

import React, { useEffect, useRef } from 'react'
import type { ScheduleItem } from '../../types/mvp-scheduling'

interface TimelineKeyboardShortcutsProps {
  schedule: ScheduleItem[]
  currentTime?: string
  onStatusChange?: (itemId: string, status: any) => void
  onTimeChange?: (itemId: string, newTime: string) => void
  onExportRequest?: () => void
  onAnalyticsRequest?: () => void
  onViewModeToggle?: () => void
  isEnabled?: boolean
}

export const TimelineKeyboardShortcuts: React.FC<TimelineKeyboardShortcutsProps> = ({
  schedule,
  currentTime,
  onStatusChange,
  onTimeChange,
  onExportRequest,
  onAnalyticsRequest,
  onViewModeToggle,
  isEnabled = true
}) => {
  const currentItemIndex = useRef<number>(0)
  const shortcutsActive = useRef<boolean>(false)

  // Find current active item
  const getCurrentItem = (): ScheduleItem | null => {
    if (!currentTime) return schedule[0] || null
    
    const current = schedule.find(item => {
      const itemTime = timeToMinutes(item.time)
      const now = timeToMinutes(currentTime)
      return itemTime <= now && now < itemTime + 25 // Assuming 25-minute slots
    })
    
    return current || schedule[0] || null
  }

  // Convert time string to minutes
  const timeToMinutes = (timeString: string): number => {
    const [hours, minutes] = timeString.split(':').map(Number)
    return hours * 60 + minutes
  }

  // Navigate to next/previous item
  const navigateItem = (direction: 'next' | 'prev') => {
    const maxIndex = schedule.length - 1
    if (direction === 'next') {
      currentItemIndex.current = Math.min(currentItemIndex.current + 1, maxIndex)
    } else {
      currentItemIndex.current = Math.max(currentItemIndex.current - 1, 0)
    }
    
    // Highlight the current item (visual feedback)
    const currentItem = schedule[currentItemIndex.current]
    if (currentItem) {
      const element = document.querySelector(`[data-timeline-item="${currentItem.id}"]`)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        element.classList.add('keyboard-selected')
        
        // Remove highlight after 2 seconds
        setTimeout(() => {
          element.classList.remove('keyboard-selected')
        }, 2000)
      }
    }
  }

  // Handle keyboard events
  useEffect(() => {
    if (!isEnabled) return

    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if we're in an input field
      if (event.target instanceof HTMLInputElement || 
          event.target instanceof HTMLTextAreaElement ||
          event.target instanceof HTMLSelectElement) {
        return
      }

      // Modifier keys for timeline shortcuts - Mac 相容性改進
      const isCtrlOrCmd = event.ctrlKey || event.metaKey
      const isShift = event.shiftKey
      const isAlt = event.altKey
      const isOption = event.altKey // Mac 的 Option 鍵

      // Mac 檢測
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0

      // Timeline-specific shortcuts - 調整 Mac 相容性
      // Mac: Option + key, Windows/Linux: Alt + key
      if (isOption && !isCtrlOrCmd) {
        shortcutsActive.current = true
        
        switch (event.key.toLowerCase()) {
          case 't': // Option/Alt + T: Toggle timeline mode
            event.preventDefault()
            if (onViewModeToggle) {
              onViewModeToggle()
            }
            break
            
          case 'e': // Option/Alt + E: Export timeline
            event.preventDefault()
            if (onExportRequest) {
              onExportRequest()
            }
            break
            
          case 'a': // Option/Alt + A: Show analytics
            event.preventDefault()
            if (onAnalyticsRequest) {
              onAnalyticsRequest()
            }
            break
            
          case 'j': // Option/Alt + J: Next item
            event.preventDefault()
            navigateItem('next')
            break
            
          case 'k': // Option/Alt + K: Previous item
            event.preventDefault()
            navigateItem('prev')
            break
        }
      }

      // Arrow key navigation - 獨立處理，不需要修飾鍵
      if (!event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) {
        switch (event.key) {
          case 'ArrowDown': // 向下箭頭: 下一個項目
            event.preventDefault()
            navigateItem('next')
            break
            
          case 'ArrowUp': // 向上箭頭: 上一個項目
            event.preventDefault()
            navigateItem('prev')
            break
        }
      }

      // Global shortcuts (Cmd on Mac, Ctrl on Windows/Linux)
      if (isCtrlOrCmd && !isAlt) {
        switch (event.key.toLowerCase()) {
          case 'e': // Cmd/Ctrl + E: Export
            if (isShift) { // Cmd/Ctrl + Shift + E: Export timeline
              event.preventDefault()
              if (onExportRequest) {
                onExportRequest()
              }
            }
            break
        }
      }

      // Quick actions for current item
      if (!isCtrlOrCmd && !isAlt && !isShift) {
        const currentItem = getCurrentItem()
        if (!currentItem) return

        switch (event.key.toLowerCase()) {
          case 's': // S: Start current task
            if (currentItem.status === 'scheduled' && onStatusChange) {
              event.preventDefault()
              onStatusChange(currentItem.id, 'in_progress')
            }
            break
            
          case 'c': // C: Complete current task
            if (currentItem.status === 'in_progress' && onStatusChange) {
              event.preventDefault()
              onStatusChange(currentItem.id, 'completed')
            }
            break
            
          case 'x': // X: Skip/Cancel current task
            if ((currentItem.status === 'scheduled' || currentItem.status === 'in_progress') && onStatusChange) {
              event.preventDefault()
              onStatusChange(currentItem.id, 'missed')
            }
            break
        }
      }

      // Time adjustment shortcuts (when an item is focused)
      if (isShift && !isCtrlOrCmd && !isAlt) {
        const focusedItem = schedule[currentItemIndex.current]
        if (!focusedItem || !onTimeChange) return

        const currentMinutes = timeToMinutes(focusedItem.time)
        let newMinutes = currentMinutes

        switch (event.key) {
          case 'ArrowUp': // Shift + ↑: Move 15 minutes earlier
            event.preventDefault()
            newMinutes = Math.max(0, currentMinutes - 15)
            break
            
          case 'ArrowDown': // Shift + ↓: Move 15 minutes later
            event.preventDefault()
            newMinutes = Math.min(24 * 60 - 1, currentMinutes + 15)
            break
            
          case 'ArrowLeft': // Shift + ←: Move 5 minutes earlier
            event.preventDefault()
            newMinutes = Math.max(0, currentMinutes - 5)
            break
            
          case 'ArrowRight': // Shift + →: Move 5 minutes later
            event.preventDefault()
            newMinutes = Math.min(24 * 60 - 1, currentMinutes + 5)
            break
        }

        if (newMinutes !== currentMinutes) {
          const hours = Math.floor(newMinutes / 60)
          const mins = newMinutes % 60
          const newTime = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
          onTimeChange(focusedItem.id, newTime)
        }
      }
    }

    const handleKeyUp = (event: KeyboardEvent) => {
      if (!event.altKey) {
        shortcutsActive.current = false
      }
    }

    // Show help on ? key
    const handleHelpKey = (event: KeyboardEvent) => {
      if (event.key === '?' && !event.ctrlKey && !event.metaKey && !event.altKey) {
        const target = event.target as HTMLElement
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          event.preventDefault()
          showShortcutsHelp()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('keyup', handleKeyUp)
    document.addEventListener('keydown', handleHelpKey)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('keyup', handleKeyUp)
      document.removeEventListener('keydown', handleHelpKey)
    }
  }, [isEnabled, schedule, currentTime, onStatusChange, onTimeChange, onExportRequest, onAnalyticsRequest, onViewModeToggle])

  // Show shortcuts help
  const showShortcutsHelp = () => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
    const modifierKey = isMac ? 'Option' : 'Alt'
    const cmdKey = isMac ? 'Cmd' : 'Ctrl'
    
    const helpContent = `
⌨️ Timeline 鍵盤快捷鍵 ${isMac ? '(Mac)' : '(Windows/Linux)'}

基本操作:
• S - 開始當前任務
• C - 完成當前任務  
• X - 跳過/取消當前任務

導航:
• ${modifierKey} + J - 下一個時段
• ${modifierKey} + K - 上一個時段
• ↑ / ↓ - 上一個/下一個時段 (無需修飾鍵)

時間調整:
• Shift + ↑ - 提前 15 分鐘
• Shift + ↓ - 延後 15 分鐘
• Shift + ← - 提前 5 分鐘
• Shift + → - 延後 5 分鐘

功能:
• ${modifierKey} + T - 切換視圖模式
• ${modifierKey} + E - 導出時間軸
• ${modifierKey} + A - 顯示分析
• ${cmdKey} + Shift + E - 快速導出

其他:
• ? - 顯示此幫助
• ESC - 關閉模態框

${isMac ? 'Mac 提示: Option 鍵位於 Cmd 旁邊' : ''}
提示: 在輸入框中快捷鍵會被禁用
    `.trim()

    // Create and show help modal
    const helpModal = document.createElement('div')
    helpModal.className = 'shortcuts-help-modal'
    helpModal.innerHTML = `
      <div class="shortcuts-help-overlay">
        <div class="shortcuts-help-content">
          <div class="shortcuts-help-header">
            <h3>⌨️ 鍵盤快捷鍵</h3>
            <button class="shortcuts-help-close">✕</button>
          </div>
          <pre class="shortcuts-help-text">${helpContent}</pre>
        </div>
      </div>
    `

    // Add close functionality
    const closeButton = helpModal.querySelector('.shortcuts-help-close')
    const overlay = helpModal.querySelector('.shortcuts-help-overlay')
    
    const closeHelp = () => {
      document.body.removeChild(helpModal)
      document.removeEventListener('keydown', escapeHandler)
    }

    const escapeHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeHelp()
      }
    }

    closeButton?.addEventListener('click', closeHelp)
    overlay?.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeHelp()
      }
    })
    document.addEventListener('keydown', escapeHandler)

    document.body.appendChild(helpModal)
  }

  // This component doesn't render anything visible
  return null
}

export default TimelineKeyboardShortcuts