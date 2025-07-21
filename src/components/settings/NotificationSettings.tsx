import React, { useState, useEffect } from 'react'
import { MagicButton } from '../MagicButton'
import { preferencesManager, type NotificationSettings } from '../../utils/preferencesManager'

export const NotificationSettingsComponent: React.FC = () => {
  const [settings, setSettings] = useState<NotificationSettings>(preferencesManager.getNotificationSettings())
  const [hasChanges, setHasChanges] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default')

  useEffect(() => {
    // 檢查通知權限
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission)
    }

    const handleChange = () => {
      setSettings(preferencesManager.getNotificationSettings())
      setHasChanges(false)
    }

    preferencesManager.addChangeListener(handleChange)
    return () => preferencesManager.removeChangeListener(handleChange)
  }, [])

  const handleSettingChange = <K extends keyof NotificationSettings>(
    key: K,
    value: NotificationSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  const handleNestedChange = <T extends keyof NotificationSettings>(
    parentKey: T,
    childKey: keyof NotificationSettings[T],
    value: any
  ) => {
    setSettings(prev => ({
      ...prev,
      [parentKey]: {
        ...prev[parentKey],
        [childKey]: value
      }
    }))
    setHasChanges(true)
  }

  const handleArrayChange = <T extends keyof NotificationSettings>(
    parentKey: T,
    childKey: keyof NotificationSettings[T],
    value: number,
    checked: boolean
  ) => {
    const currentArray = settings[parentKey][childKey] as number[]
    const newArray = checked
      ? [...currentArray, value]
      : currentArray.filter(v => v !== value)
    
    setSettings(prev => ({
      ...prev,
      [parentKey]: {
        ...prev[parentKey],
        [childKey]: newArray.sort((a, b) => b - a) // 從大到小排序
      }
    }))
    setHasChanges(true)
  }

  const handleSave = async () => {
    // 如果啟用瀏覽器通知但沒有權限，先請求權限
    if (settings.browserNotifications && notificationPermission !== 'granted') {
      const granted = await preferencesManager.requestNotificationPermission()
      if (!granted) {
        alert('需要通知權限才能啟用瀏覽器通知功能')
        return
      }
      setNotificationPermission('granted')
    }

    preferencesManager.updateNotificationSettings(settings)
    setHasChanges(false)
    setShowSuccess(true)
    setTimeout(() => setShowSuccess(false), 3000)
  }

  const handleTestNotification = () => {
    if (notificationPermission === 'granted') {
      preferencesManager.sendNotification('測試通知', {
        body: '這是一個測試通知，如果您看到這個訊息，說明通知功能正常運作。',
        tag: 'test'
      })
    } else {
      alert('請先啟用瀏覽器通知權限')
    }
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`
  }

  const reminderOptions = [
    { value: 10080, label: '1 週前' }, // 7 days * 24 hours * 60 minutes
    { value: 2880, label: '2 天前' },  // 2 days * 24 hours * 60 minutes
    { value: 1440, label: '1 天前' },  // 24 hours * 60 minutes
    { value: 720, label: '12 小時前' }, // 12 hours * 60 minutes
    { value: 180, label: '3 小時前' },  // 3 hours * 60 minutes
    { value: 60, label: '1 小時前' },   // 60 minutes
    { value: 30, label: '30 分鐘前' },
    { value: 15, label: '15 分鐘前' },
    { value: 5, label: '5 分鐘前' }
  ]

  return (
    <div className="notification-settings">
      {/* 成功提示 */}
      {showSuccess && (
        <div className="message-banner message-banner--success">
          ✅ 通知設定已保存成功！
        </div>
      )}

      {/* 瀏覽器通知 */}
      <div className="settings-section">
        <h4 className="section-title">🔔 瀏覽器通知</h4>
        
        <div className="browser-notification-status">
          <div className={`permission-status permission-status--${notificationPermission}`}>
            <span className="status-icon">
              {notificationPermission === 'granted' ? '✅' : 
               notificationPermission === 'denied' ? '❌' : '⚠️'}
            </span>
            <span className="status-text">
              {notificationPermission === 'granted' ? '通知權限已授予' :
               notificationPermission === 'denied' ? '通知權限被拒絕' : '通知權限未設定'}
            </span>
          </div>
          
          {notificationPermission === 'denied' && (
            <p className="status-help">
              請在瀏覽器設定中手動開啟此網站的通知權限
            </p>
          )}
        </div>

        <div className="setting-item setting-item--checkbox">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={settings.browserNotifications}
              onChange={(e) => handleSettingChange('browserNotifications', e.target.checked)}
            />
            <span>啟用瀏覽器通知</span>
          </label>
        </div>

        {settings.browserNotifications && (
          <div className="test-notification">
            <MagicButton
              onClick={handleTestNotification}
              variant="secondary"
              size="small"
            >
              🔔 測試通知
            </MagicButton>
          </div>
        )}
      </div>

      {/* 任務提醒 */}
      <div className="settings-section">
        <h4 className="section-title">📋 任務提醒</h4>
        
        <div className="setting-item setting-item--checkbox">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={settings.taskReminders.enabled}
              onChange={(e) => handleNestedChange('taskReminders', 'enabled', e.target.checked)}
            />
            <span>啟用任務提醒</span>
          </label>
        </div>

        {settings.taskReminders.enabled && (
          <>
            {/* 截止日期提醒 */}
            <div className="setting-item">
              <label className="setting-label">截止日期提醒</label>
              <div className="reminder-checkboxes">
                {reminderOptions.map(option => (
                  <label key={option.value} className="reminder-checkbox">
                    <input
                      type="checkbox"
                      checked={settings.taskReminders.dueDateReminder.includes(option.value)}
                      onChange={(e) => handleArrayChange('taskReminders', 'dueDateReminder', option.value, e.target.checked)}
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 逾期提醒 */}
            <div className="setting-item setting-item--checkbox">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.taskReminders.overdue}
                  onChange={(e) => handleNestedChange('taskReminders', 'overdue', e.target.checked)}
                />
                <span>逾期任務提醒</span>
              </label>
            </div>

            {/* 每日摘要 */}
            <div className="setting-item setting-item--checkbox">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.taskReminders.dailySummary.enabled}
                  onChange={(e) => handleNestedChange('taskReminders', { ...settings.taskReminders.dailySummary, enabled: e.target.checked })}
                />
                <span>每日任務摘要</span>
              </label>
            </div>

            {settings.taskReminders.dailySummary.enabled && (
              <div className="setting-item">
                <label className="setting-label">摘要時間</label>
                <input
                  type="time"
                  className="setting-input"
                  value={settings.taskReminders.dailySummary.time}
                  onChange={(e) => handleNestedChange('taskReminders', { ...settings.taskReminders.dailySummary, time: e.target.value })}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* 專案通知 */}
      <div className="settings-section">
        <h4 className="section-title">📁 專案通知</h4>
        
        <div className="setting-item setting-item--checkbox">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={settings.projectNotifications.enabled}
              onChange={(e) => handleNestedChange('projectNotifications', 'enabled', e.target.checked)}
            />
            <span>啟用專案通知</span>
          </label>
        </div>

        {settings.projectNotifications.enabled && (
          <>
            <div className="setting-item setting-item--checkbox">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.projectNotifications.milestones}
                  onChange={(e) => handleNestedChange('projectNotifications', 'milestones', e.target.checked)}
                />
                <span>專案里程碑提醒</span>
              </label>
            </div>

            <div className="setting-item setting-item--checkbox">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.projectNotifications.weeklyReport.enabled}
                  onChange={(e) => handleNestedChange('projectNotifications', { ...settings.projectNotifications.weeklyReport, enabled: e.target.checked })}
                />
                <span>週報通知</span>
              </label>
            </div>

            {settings.projectNotifications.weeklyReport.enabled && (
              <div className="settings-grid">
                <div className="setting-item">
                  <label className="setting-label">週報日期</label>
                  <select
                    className="setting-select"
                    value={settings.projectNotifications.weeklyReport.day}
                    onChange={(e) => handleNestedChange('projectNotifications', { ...settings.projectNotifications.weeklyReport, day: parseInt(e.target.value) })}
                  >
                    <option value={0}>星期日</option>
                    <option value={1}>星期一</option>
                    <option value={2}>星期二</option>
                    <option value={3}>星期三</option>
                    <option value={4}>星期四</option>
                    <option value={5}>星期五</option>
                    <option value={6}>星期六</option>
                  </select>
                </div>

                <div className="setting-item">
                  <label className="setting-label">週報時間</label>
                  <input
                    type="time"
                    className="setting-input"
                    value={settings.projectNotifications.weeklyReport.time}
                    onChange={(e) => handleNestedChange('projectNotifications', { ...settings.projectNotifications.weeklyReport, time: e.target.value })}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* 番茄鐘通知 */}
      <div className="settings-section">
        <h4 className="section-title">🍅 番茄鐘通知</h4>
        
        <div className="setting-item setting-item--checkbox">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={settings.pomodoroNotifications.enabled}
              onChange={(e) => handleNestedChange('pomodoroNotifications', 'enabled', e.target.checked)}
            />
            <span>啟用番茄鐘通知</span>
          </label>
        </div>

        {settings.pomodoroNotifications.enabled && (
          <>
            <div className="setting-item setting-item--checkbox">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.pomodoroNotifications.workSessionEnd}
                  onChange={(e) => handleNestedChange('pomodoroNotifications', 'workSessionEnd', e.target.checked)}
                />
                <span>工作時段結束提醒</span>
              </label>
            </div>

            <div className="setting-item setting-item--checkbox">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.pomodoroNotifications.breakEnd}
                  onChange={(e) => handleNestedChange('pomodoroNotifications', 'breakEnd', e.target.checked)}
                />
                <span>休息時間結束提醒</span>
              </label>
            </div>

            <div className="setting-item setting-item--checkbox">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.pomodoroNotifications.longBreakReminder}
                  onChange={(e) => handleNestedChange('pomodoroNotifications', 'longBreakReminder', e.target.checked)}
                />
                <span>長休息時間提醒</span>
              </label>
            </div>
          </>
        )}
      </div>

      {/* 郵件通知（未來功能） */}
      <div className="settings-section">
        <h4 className="section-title">📧 郵件通知</h4>
        <p className="feature-coming-soon">
          🚧 此功能即將推出，敬請期待！
        </p>
        
        <div className="setting-item setting-item--checkbox">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={settings.emailNotifications.enabled}
              disabled
              onChange={(e) => handleNestedChange('emailNotifications', 'enabled', e.target.checked)}
            />
            <span>啟用郵件通知（即將推出）</span>
          </label>
        </div>
      </div>

      {/* 操作按鈕 */}
      <div className="settings-actions">
        <MagicButton
          onClick={handleSave}
          disabled={!hasChanges}
          variant="primary"
        >
          💾 保存設定
        </MagicButton>
      </div>
    </div>
  )
}