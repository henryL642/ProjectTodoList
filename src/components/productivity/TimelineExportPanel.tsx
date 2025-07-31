/**
 * TimelineExportPanel - Export and sharing functionality for timeline
 * Part of Timeline Enhancement Implementation
 */

import React, { useState } from 'react'
import type { ScheduleItem } from '../../types/mvp-scheduling'
import { MagicButton } from '../MagicButton'

interface TimelineExportPanelProps {
  schedule: ScheduleItem[]
  isOpen: boolean
  onClose: () => void
  currentDate?: Date
}

export const TimelineExportPanel: React.FC<TimelineExportPanelProps> = ({
  schedule,
  isOpen,
  onClose,
  currentDate = new Date()
}) => {
  const [exportFormat, setExportFormat] = useState<'json' | 'csv' | 'ical' | 'text'>('json')
  const [isExporting, setIsExporting] = useState(false)
  const [shareUrl, setShareUrl] = useState<string | null>(null)

  if (!isOpen) return null

  // Export to JSON
  const exportToJson = () => {
    const exportData = {
      date: currentDate.toISOString().split('T')[0],
      schedule: schedule.map(item => ({
        id: item.id,
        time: item.time,
        title: item.task.title,
        type: item.type,
        status: item.status,
        duration: item.type === 'pomodoro' ? 25 : item.type === 'break' ? 5 : 15
      })),
      totalSlots: schedule.length,
      completedSlots: schedule.filter(item => item.status === 'completed').length,
      exportedAt: new Date().toISOString()
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json' 
    })
    downloadFile(blob, `timeline-${currentDate.toISOString().split('T')[0]}.json`)
  }

  // Export to CSV
  const exportToCsv = () => {
    const headers = ['時間', '任務標題', '類型', '狀態', '持續時間(分鐘)']
    const csvData = [
      headers.join(','),
      ...schedule.map(item => [
        item.time,
        `"${item.task.title.replace(/"/g, '""')}"`,
        item.type,
        item.status,
        item.type === 'pomodoro' ? '25' : item.type === 'break' ? '5' : '15'
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8' })
    downloadFile(blob, `timeline-${currentDate.toISOString().split('T')[0]}.csv`)
  }

  // Export to iCal format
  const exportToIcal = () => {
    const formatDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
    }

    const createEvent = (item: ScheduleItem) => {
      const startTime = new Date(currentDate.toDateString() + ' ' + item.time)
      const duration = item.type === 'pomodoro' ? 25 : item.type === 'break' ? 5 : 15
      const endTime = new Date(startTime.getTime() + duration * 60000)

      return [
        'BEGIN:VEVENT',
        `UID:${item.id}@todolist-timeline`,
        `DTSTART:${formatDate(startTime)}`,
        `DTEND:${formatDate(endTime)}`,
        `SUMMARY:${item.task.title}`,
        `DESCRIPTION:${item.type === 'pomodoro' ? '番茄鐘工作時段' : item.type === 'break' ? '短休息' : '緩衝時間'}`,
        `STATUS:${item.status === 'completed' ? 'CONFIRMED' : 'TENTATIVE'}`,
        'END:VEVENT'
      ].join('\r\n')
    }

    const icalData = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//TodoList//Timeline Export//ZH',
      'CALSCALE:GREGORIAN',
      ...schedule.map(createEvent),
      'END:VCALENDAR'
    ].join('\r\n')

    const blob = new Blob([icalData], { type: 'text/calendar;charset=utf-8' })
    downloadFile(blob, `timeline-${currentDate.toISOString().split('T')[0]}.ics`)
  }

  // Export to readable text format
  const exportToText = () => {
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
      })
    }

    const textData = [
      `📅 時間軸導出 - ${formatDate(currentDate)}`,
      '=' .repeat(50),
      '',
      `📊 總覽:`,
      `   • 總時段數: ${schedule.length}`,
      `   • 已完成: ${schedule.filter(item => item.status === 'completed').length}`,
      `   • 番茄鐘數: ${schedule.filter(item => item.type === 'pomodoro').length}`,
      '',
      '📝 詳細時程:',
      ...schedule.map(item => {
        const duration = item.type === 'pomodoro' ? 25 : item.type === 'break' ? 5 : 15
        const endTime = calculateEndTime(item.time, duration)
        const statusIcon = item.status === 'completed' ? '✅' : 
                          item.status === 'in_progress' ? '🔄' : 
                          item.status === 'missed' ? '❌' : '⏳'
        const typeIcon = item.type === 'pomodoro' ? '🍅' : 
                        item.type === 'break' ? '☕' : '⏳'
        
        return `   ${statusIcon} ${item.time} - ${endTime} ${typeIcon} ${item.task.title}`
      }),
      '',
      '---',
      `導出時間: ${new Date().toLocaleString('zh-TW')}`,
      '由 TodoList 應用程式生成'
    ].join('\n')

    const blob = new Blob([textData], { type: 'text/plain;charset=utf-8' })
    downloadFile(blob, `timeline-${currentDate.toISOString().split('T')[0]}.txt`)
  }

  // Helper function to download file
  const downloadFile = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Calculate end time
  const calculateEndTime = (startTime: string, durationMinutes: number): string => {
    const [hours, minutes] = startTime.split(':').map(Number)
    const totalMinutes = hours * 60 + minutes + durationMinutes
    const endHours = Math.floor(totalMinutes / 60)
    const endMinutes = totalMinutes % 60
    return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`
  }

  // Handle export
  const handleExport = async () => {
    setIsExporting(true)
    try {
      switch (exportFormat) {
        case 'json':
          exportToJson()
          break
        case 'csv':
          exportToCsv()
          break
        case 'ical':
          exportToIcal()
          break
        case 'text':
          exportToText()
          break
      }
    } catch (error) {
      console.error('Export failed:', error)
      alert('導出失敗，請稍後再試')
    } finally {
      setIsExporting(false)
    }
  }

  // Generate share URL (simplified implementation)
  const generateShareUrl = () => {
    const scheduleData = schedule.map(item => ({
      time: item.time,
      title: item.task.title,
      type: item.type,
      status: item.status
    }))
    
    const encodedData = btoa(JSON.stringify({
      date: currentDate.toISOString().split('T')[0],
      schedule: scheduleData
    }))
    
    const baseUrl = window.location.origin + window.location.pathname
    const shareUrl = `${baseUrl}?shared=${encodedData}`
    
    setShareUrl(shareUrl)
    
    // Copy to clipboard
    navigator.clipboard.writeText(shareUrl).then(() => {
      alert('分享連結已複製到剪貼板！')
    }).catch(() => {
      alert('無法複製到剪貼板，請手動複製連結')
    })
  }

  return (
    <div className="timeline-export-overlay" onClick={onClose}>
      <div className="timeline-export-panel" onClick={(e) => e.stopPropagation()}>
        <div className="export-header">
          <h3>📤 導出時間軸</h3>
          <button className="close-button" onClick={onClose}>✕</button>
        </div>

        <div className="export-content">
          {/* Export Format Selection */}
          <div className="export-section">
            <h4>選擇導出格式</h4>
            <div className="format-options">
              <label className="format-option">
                <input
                  type="radio"
                  value="json"
                  checked={exportFormat === 'json'}
                  onChange={(e) => setExportFormat(e.target.value as any)}
                />
                <div className="format-info">
                  <span className="format-name">JSON</span>
                  <span className="format-desc">結構化數據格式，適合程式處理</span>
                </div>
              </label>

              <label className="format-option">
                <input
                  type="radio"
                  value="csv"
                  checked={exportFormat === 'csv'}
                  onChange={(e) => setExportFormat(e.target.value as any)}
                />
                <div className="format-info">
                  <span className="format-name">CSV</span>
                  <span className="format-desc">試算表格式，可用Excel開啟</span>
                </div>
              </label>

              <label className="format-option">
                <input
                  type="radio"
                  value="ical"
                  checked={exportFormat === 'ical'}
                  onChange={(e) => setExportFormat(e.target.value as any)}
                />
                <div className="format-info">
                  <span className="format-name">iCal</span>
                  <span className="format-desc">日曆格式，可導入行事曆應用</span>
                </div>
              </label>

              <label className="format-option">
                <input
                  type="radio"
                  value="text"
                  checked={exportFormat === 'text'}
                  onChange={(e) => setExportFormat(e.target.value as any)}
                />
                <div className="format-info">
                  <span className="format-name">文字</span>
                  <span className="format-desc">純文字格式，便於閱讀和列印</span>
                </div>
              </label>
            </div>
          </div>

          {/* Export Preview */}
          <div className="export-section">
            <h4>導出預覽</h4>
            <div className="export-preview">
              <div className="preview-stats">
                <span>📅 {currentDate.toLocaleDateString('zh-TW')}</span>
                <span>📊 {schedule.length} 個時段</span>
                <span>✅ {schedule.filter(item => item.status === 'completed').length} 已完成</span>
              </div>
            </div>
          </div>

          {/* Sharing Section */}
          <div className="export-section">
            <h4>分享時間軸</h4>
            <div className="sharing-options">
              <MagicButton
                variant="outline"
                onClick={generateShareUrl}
              >
                🔗 生成分享連結
              </MagicButton>
              
              {shareUrl && (
                <div className="share-url-display">
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="share-url-input"
                  />
                  <small>連結已複製到剪貼板</small>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="export-actions">
          <MagicButton
            variant="primary"
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? '導出中...' : '📤 開始導出'}
          </MagicButton>
          
          <MagicButton
            variant="secondary"
            onClick={onClose}
          >
            取消
          </MagicButton>
        </div>
      </div>
    </div>
  )
}