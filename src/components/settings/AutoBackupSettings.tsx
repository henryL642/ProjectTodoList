import React, { useState, useEffect } from 'react'
import { MagicButton } from '../MagicButton'
import { autoBackupManager, type AutoBackupConfig } from '../../utils/autoBackup'

export const AutoBackupSettings: React.FC = () => {
  const [config, setConfig] = useState<AutoBackupConfig>({
    enabled: false,
    time: '21:00',
    includeDownload: true
  })
  const [nextBackupTime, setNextBackupTime] = useState<Date | null>(null)
  const [lastBackupTime, setLastBackupTime] = useState<Date | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null)
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default')

  useEffect(() => {
    // 載入配置
    const currentConfig = autoBackupManager.getConfig()
    setConfig(currentConfig)
    updateTimes()

    // 檢查通知權限
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission)
    }

    // 監聽自動備份事件
    const handleAutoBackupCompleted = (event: CustomEvent) => {
      showMessage('success', `自動備份完成！時間：${new Date(event.detail.timestamp).toLocaleString('zh-TW')}`)
      updateTimes()
    }

    const handleAutoBackupError = (event: CustomEvent) => {
      showMessage('error', `自動備份失敗：${event.detail.error}`)
    }

    window.addEventListener('autoBackupCompleted', handleAutoBackupCompleted as EventListener)
    window.addEventListener('autoBackupError', handleAutoBackupError as EventListener)

    return () => {
      window.removeEventListener('autoBackupCompleted', handleAutoBackupCompleted as EventListener)
      window.removeEventListener('autoBackupError', handleAutoBackupError as EventListener)
    }
  }, [])

  const updateTimes = () => {
    setNextBackupTime(autoBackupManager.getNextBackupTime())
    setLastBackupTime(autoBackupManager.getLastBackupTime())
  }

  const showMessage = (type: 'success' | 'error' | 'info', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }

  const handleToggleEnabled = () => {
    const newEnabled = !config.enabled
    const updatedConfig = { ...config, enabled: newEnabled }
    
    autoBackupManager.updateConfig(updatedConfig)
    setConfig(updatedConfig)
    updateTimes()

    if (newEnabled) {
      showMessage('success', `自動備份已啟用！將於每日 ${config.time} 執行備份`)
    } else {
      showMessage('info', '自動備份已停用')
    }
  }

  const handleTimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = event.target.value
    const updatedConfig = { ...config, time: newTime }
    
    autoBackupManager.updateConfig(updatedConfig)
    setConfig(updatedConfig)
    updateTimes()

    if (config.enabled) {
      showMessage('info', `備份時間已更新為 ${newTime}`)
    }
  }

  const handleIncludeDownloadChange = () => {
    const newIncludeDownload = !config.includeDownload
    const updatedConfig = { ...config, includeDownload: newIncludeDownload }
    
    autoBackupManager.updateConfig(updatedConfig)
    setConfig(updatedConfig)

    showMessage('info', newIncludeDownload ? '將同時下載備份文件' : '僅建立本地備份')
  }

  const handleRequestNotification = async () => {
    try {
      const permission = await autoBackupManager.requestNotificationPermission()
      setNotificationPermission(permission)
      
      if (permission === 'granted') {
        showMessage('success', '通知權限已授予，您將收到備份完成通知')
      } else {
        showMessage('error', '通知權限被拒絕，您將無法收到備份提醒')
      }
    } catch (error) {
      showMessage('error', '請求通知權限時發生錯誤')
    }
  }

  const handleManualBackup = async () => {
    try {
      showMessage('info', '正在執行手動備份...')
      await autoBackupManager.manualBackup()
      updateTimes()
    } catch (error) {
      showMessage('error', '手動備份失敗')
    }
  }

  const formatDateTime = (date: Date | null): string => {
    if (!date) return '無'
    return date.toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const getTimeUntilBackup = (): string => {
    if (!nextBackupTime || !config.enabled) return '未啟用'
    
    const now = new Date()
    const timeDiff = nextBackupTime.getTime() - now.getTime()
    
    if (timeDiff <= 0) return '即將執行'
    
    const hours = Math.floor(timeDiff / (1000 * 60 * 60))
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours > 24) {
      const days = Math.floor(hours / 24)
      const remainingHours = hours % 24
      return `${days} 天 ${remainingHours} 小時後`
    }
    
    return `${hours} 小時 ${minutes} 分鐘後`
  }

  return (
    <div className="auto-backup-settings">
      {/* 消息提示 */}
      {message && (
        <div className={`message-banner message-banner--${message.type}`}>
          {message.text}
        </div>
      )}

      {/* 主要設定 */}
      <div className="setting-group">
        <div className="setting-header">
          <h4 className="setting-title">⏰ 自動備份設定</h4>
          <p className="setting-description">
            設定每日定時自動備份，保護您的待辦清單數據免於丟失
          </p>
        </div>

        {/* 啟用/停用開關 */}
        <div className="setting-row">
          <div className="setting-info">
            <label className="setting-label">啟用自動備份</label>
            <span className="setting-description">
              每日在指定時間自動建立數據備份
            </span>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={handleToggleEnabled}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        {/* 備份時間設定 */}
        <div className="setting-row">
          <div className="setting-info">
            <label className="setting-label">備份時間</label>
            <span className="setting-description">
              選擇每日執行備份的時間（24小時制）
            </span>
          </div>
          <input
            type="time"
            value={config.time}
            onChange={handleTimeChange}
            className="time-input"
            disabled={!config.enabled}
          />
        </div>

        {/* 下載設定 */}
        <div className="setting-row">
          <div className="setting-info">
            <label className="setting-label">自動下載備份文件</label>
            <span className="setting-description">
              除了本地備份外，同時下載 JSON 備份文件到電腦
            </span>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={config.includeDownload}
              onChange={handleIncludeDownloadChange}
              disabled={!config.enabled}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        {/* 通知設定 */}
        <div className="setting-row">
          <div className="setting-info">
            <label className="setting-label">桌面通知</label>
            <span className="setting-description">
              備份完成後顯示桌面通知（需要授權）
            </span>
          </div>
          {notificationPermission === 'granted' ? (
            <span className="permission-status permission-granted">✅ 已授權</span>
          ) : notificationPermission === 'denied' ? (
            <span className="permission-status permission-denied">❌ 已拒絕</span>
          ) : (
            <MagicButton
              onClick={handleRequestNotification}
              variant="secondary"
              size="small"
            >
              請求授權
            </MagicButton>
          )}
        </div>
      </div>

      {/* 狀態信息 */}
      {config.enabled && (
        <div className="backup-status">
          <h5 className="status-title">📊 備份狀態</h5>
          <div className="status-grid">
            <div className="status-card">
              <div className="status-icon">⏳</div>
              <div className="status-content">
                <div className="status-label">下次備份</div>
                <div className="status-value">{formatDateTime(nextBackupTime)}</div>
                <div className="status-detail">{getTimeUntilBackup()}</div>
              </div>
            </div>
            
            <div className="status-card">
              <div className="status-icon">📅</div>
              <div className="status-content">
                <div className="status-label">最後備份</div>
                <div className="status-value">{formatDateTime(lastBackupTime)}</div>
                <div className="status-detail">
                  {lastBackupTime ? '已完成' : '尚未執行'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 測試按鈕 */}
      {config.enabled && (
        <div className="test-section">
          <MagicButton
            onClick={handleManualBackup}
            variant="secondary"
          >
            🧪 測試立即備份
          </MagicButton>
          <p className="test-description">
            立即執行一次備份來測試設定是否正確
          </p>
        </div>
      )}

      {/* 說明信息 */}
      <div className="info-section">
        <h5 className="info-title">💡 使用說明</h5>
        <ul className="info-list">
          <li><strong>自動備份</strong>：每日在指定時間自動執行，不需要手動操作</li>
          <li><strong>本地備份</strong>：數據備份到瀏覽器的本地存儲中，可隨時恢復</li>
          <li><strong>下載備份</strong>：可選擇同時下載 JSON 文件到電腦作為額外保護</li>
          <li><strong>無需資料夾</strong>：文件會自動保存到瀏覽器的預設下載位置</li>
          <li><strong>隱私保護</strong>：所有備份均在本地進行，不會上傳到任何服務器</li>
        </ul>
      </div>
    </div>
  )
}