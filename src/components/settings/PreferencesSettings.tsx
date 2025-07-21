import React, { useState, useEffect } from 'react'
import { MagicButton } from '../MagicButton'
import { useProjects } from '../../context/ProjectContext'
import { preferencesManager, type UserPreferences } from '../../utils/preferencesManager'

export const PreferencesSettings: React.FC = () => {
  const { projects } = useProjects()
  const [preferences, setPreferences] = useState<UserPreferences>(preferencesManager.getPreferences())
  const [hasChanges, setHasChanges] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    const handleChange = () => {
      setPreferences(preferencesManager.getPreferences())
      setHasChanges(false)
    }

    preferencesManager.addChangeListener(handleChange)
    return () => preferencesManager.removeChangeListener(handleChange)
  }, [])

  const handlePreferenceChange = <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    setPreferences(prev => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  const handleNestedChange = <T extends keyof UserPreferences>(
    parentKey: T,
    childKey: keyof UserPreferences[T],
    value: any
  ) => {
    setPreferences(prev => ({
      ...prev,
      [parentKey]: {
        ...prev[parentKey],
        [childKey]: value
      }
    }))
    setHasChanges(true)
  }

  const handleSave = () => {
    preferencesManager.updatePreferences(preferences)
    setHasChanges(false)
    setShowSuccess(true)
    setTimeout(() => setShowSuccess(false), 3000)
  }

  const handleReset = () => {
    if (window.confirm('確定要重置為默認設定嗎？此操作無法撤銷。')) {
      preferencesManager.resetToDefaults()
    }
  }

  return (
    <div className="preferences-settings">
      {/* 成功提示 */}
      {showSuccess && (
        <div className="message-banner message-banner--success">
          ✅ 設定已保存成功！
        </div>
      )}

      {/* 外觀設定 */}
      <div className="settings-section">
        <h4 className="section-title">🎨 外觀設定</h4>
        
        <div className="settings-grid">
          {/* 主題設定 */}
          <div className="setting-item">
            <label className="setting-label">主題模式</label>
            <select
              className="setting-select"
              value={preferences.theme}
              onChange={(e) => handlePreferenceChange('theme', e.target.value as any)}
            >
              <option value="light">淺色模式</option>
              <option value="dark">深色模式</option>
              <option value="system">跟隨系統</option>
            </select>
          </div>

          {/* 色彩方案 */}
          <div className="setting-item">
            <label className="setting-label">色彩方案</label>
            <div className="color-scheme-grid">
              {[
                { value: 'blue', label: '藍色', color: '#3b82f6' },
                { value: 'green', label: '綠色', color: '#10b981' },
                { value: 'purple', label: '紫色', color: '#8b5cf6' },
                { value: 'pink', label: '粉色', color: '#ec4899' },
                { value: 'orange', label: '橙色', color: '#f59e0b' }
              ].map(scheme => (
                <button
                  key={scheme.value}
                  className={`color-scheme-option ${preferences.colorScheme === scheme.value ? 'selected' : ''}`}
                  style={{ backgroundColor: scheme.color }}
                  onClick={() => handlePreferenceChange('colorScheme', scheme.value as any)}
                  title={scheme.label}
                >
                  {preferences.colorScheme === scheme.value && '✓'}
                </button>
              ))}
            </div>
          </div>

          {/* 字體大小 */}
          <div className="setting-item">
            <label className="setting-label">字體大小</label>
            <select
              className="setting-select"
              value={preferences.fontSize}
              onChange={(e) => handlePreferenceChange('fontSize', e.target.value as any)}
            >
              <option value="small">小</option>
              <option value="medium">中</option>
              <option value="large">大</option>
            </select>
          </div>

          {/* 語言設定 */}
          <div className="setting-item">
            <label className="setting-label">語言</label>
            <select
              className="setting-select"
              value={preferences.language}
              onChange={(e) => handlePreferenceChange('language', e.target.value as any)}
            >
              <option value="zh-TW">繁體中文</option>
              <option value="zh-CN">简体中文</option>
              <option value="en-US">English</option>
            </select>
          </div>
        </div>
      </div>

      {/* 任務設定 */}
      <div className="settings-section">
        <h4 className="section-title">📋 任務設定</h4>
        
        <div className="settings-grid">
          {/* 默認專案 */}
          <div className="setting-item">
            <label className="setting-label">默認專案</label>
            <select
              className="setting-select"
              value={preferences.defaultProjectId || ''}
              onChange={(e) => handlePreferenceChange('defaultProjectId', e.target.value || undefined)}
            >
              <option value="">無指定專案</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.icon} {project.name}
                </option>
              ))}
            </select>
          </div>

          {/* 默認優先級 */}
          <div className="setting-item">
            <label className="setting-label">默認優先級</label>
            <select
              className="setting-select"
              value={preferences.defaultPriority}
              onChange={(e) => handlePreferenceChange('defaultPriority', e.target.value as any)}
            >
              <option value="low">🟢 低</option>
              <option value="medium">🟡 中</option>
              <option value="high">🔴 高</option>
            </select>
          </div>

          {/* 任務排序 */}
          <div className="setting-item">
            <label className="setting-label">任務排序方式</label>
            <select
              className="setting-select"
              value={preferences.taskSortBy}
              onChange={(e) => handlePreferenceChange('taskSortBy', e.target.value as any)}
            >
              <option value="created">創建時間</option>
              <option value="priority">優先級</option>
              <option value="dueDate">截止日期</option>
              <option value="alphabetical">字母順序</option>
            </select>
          </div>

          {/* 顯示已完成任務 */}
          <div className="setting-item setting-item--checkbox">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={preferences.showCompletedTasks}
                onChange={(e) => handlePreferenceChange('showCompletedTasks', e.target.checked)}
              />
              <span>顯示已完成的任務</span>
            </label>
          </div>

          {/* 自動歸檔 */}
          <div className="setting-item setting-item--checkbox">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={preferences.autoArchiveCompleted}
                onChange={(e) => handlePreferenceChange('autoArchiveCompleted', e.target.checked)}
              />
              <span>自動歸檔已完成任務</span>
            </label>
          </div>

          {/* 歸檔天數 */}
          {preferences.autoArchiveCompleted && (
            <div className="setting-item">
              <label className="setting-label">歸檔天數</label>
              <input
                type="number"
                className="setting-input"
                value={preferences.autoArchiveDays}
                onChange={(e) => handlePreferenceChange('autoArchiveDays', parseInt(e.target.value))}
                min="1"
                max="365"
              />
              <small className="setting-help">完成後幾天自動歸檔</small>
            </div>
          )}
        </div>
      </div>

      {/* 工作設定 */}
      <div className="settings-section">
        <h4 className="section-title">⏰ 工作設定</h4>
        
        <div className="settings-grid">
          {/* 工作時間 */}
          <div className="setting-item">
            <label className="setting-label">工作時間</label>
            <div className="time-range">
              <select
                className="setting-select"
                value={preferences.workingHours.start}
                onChange={(e) => handleNestedChange('workingHours', 'start', parseInt(e.target.value))}
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>
                    {i.toString().padStart(2, '0')}:00
                  </option>
                ))}
              </select>
              <span>到</span>
              <select
                className="setting-select"
                value={preferences.workingHours.end}
                onChange={(e) => handleNestedChange('workingHours', 'end', parseInt(e.target.value))}
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>
                    {i.toString().padStart(2, '0')}:00
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 工作日 */}
          <div className="setting-item">
            <label className="setting-label">工作日</label>
            <div className="workdays-grid">
              {['日', '一', '二', '三', '四', '五', '六'].map((day, index) => (
                <label key={index} className="workday-label">
                  <input
                    type="checkbox"
                    checked={preferences.workingHours.workDays.includes(index)}
                    onChange={(e) => {
                      const workDays = e.target.checked
                        ? [...preferences.workingHours.workDays, index]
                        : preferences.workingHours.workDays.filter(d => d !== index)
                      handleNestedChange('workingHours', 'workDays', workDays)
                    }}
                  />
                  <span>{day}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 每日任務限制 */}
          <div className="setting-item">
            <label className="setting-label">每日任務限制</label>
            <input
              type="number"
              className="setting-input"
              value={preferences.dailyTaskLimit}
              onChange={(e) => handlePreferenceChange('dailyTaskLimit', parseInt(e.target.value))}
              min="1"
              max="50"
            />
            <small className="setting-help">每天最多添加的新任務數量</small>
          </div>

          {/* 自動保存間隔 */}
          <div className="setting-item">
            <label className="setting-label">自動保存間隔（分鐘）</label>
            <select
              className="setting-select"
              value={preferences.autoSaveInterval}
              onChange={(e) => handlePreferenceChange('autoSaveInterval', parseInt(e.target.value))}
            >
              <option value={1}>1 分鐘</option>
              <option value={5}>5 分鐘</option>
              <option value={10}>10 分鐘</option>
              <option value={30}>30 分鐘</option>
            </select>
          </div>
        </div>
      </div>

      {/* 番茄鐘設定 */}
      <div className="settings-section">
        <h4 className="section-title">🍅 番茄鐘設定</h4>
        
        <div className="settings-grid">
          <div className="setting-item">
            <label className="setting-label">工作時長（分鐘）</label>
            <input
              type="number"
              className="setting-input"
              value={preferences.pomodoroSettings.workDuration}
              onChange={(e) => handleNestedChange('pomodoroSettings', 'workDuration', parseInt(e.target.value))}
              min="5"
              max="120"
            />
          </div>

          <div className="setting-item">
            <label className="setting-label">短休息（分鐘）</label>
            <input
              type="number"
              className="setting-input"
              value={preferences.pomodoroSettings.shortBreak}
              onChange={(e) => handleNestedChange('pomodoroSettings', 'shortBreak', parseInt(e.target.value))}
              min="1"
              max="30"
            />
          </div>

          <div className="setting-item">
            <label className="setting-label">長休息（分鐘）</label>
            <input
              type="number"
              className="setting-input"
              value={preferences.pomodoroSettings.longBreak}
              onChange={(e) => handleNestedChange('pomodoroSettings', 'longBreak', parseInt(e.target.value))}
              min="5"
              max="60"
            />
          </div>

          <div className="setting-item">
            <label className="setting-label">長休息間隔</label>
            <input
              type="number"
              className="setting-input"
              value={preferences.pomodoroSettings.longBreakInterval}
              onChange={(e) => handleNestedChange('pomodoroSettings', 'longBreakInterval', parseInt(e.target.value))}
              min="2"
              max="8"
            />
            <small className="setting-help">多少個工作周期後進行長休息</small>
          </div>

          <div className="setting-item setting-item--checkbox">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={preferences.pomodoroSettings.autoStartBreaks}
                onChange={(e) => handleNestedChange('pomodoroSettings', 'autoStartBreaks', e.target.checked)}
              />
              <span>自動開始休息</span>
            </label>
          </div>

          <div className="setting-item setting-item--checkbox">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={preferences.pomodoroSettings.autoStartPomodoros}
                onChange={(e) => handleNestedChange('pomodoroSettings', 'autoStartPomodoros', e.target.checked)}
              />
              <span>自動開始下一個番茄鐘</span>
            </label>
          </div>

          <div className="setting-item setting-item--checkbox">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={preferences.pomodoroSettings.playNotificationSound}
                onChange={(e) => handleNestedChange('pomodoroSettings', 'playNotificationSound', e.target.checked)}
              />
              <span>播放通知聲音</span>
            </label>
          </div>
        </div>
      </div>

      {/* 行事曆設定 */}
      <div className="settings-section">
        <h4 className="section-title">📅 行事曆設定</h4>
        
        <div className="settings-grid">
          <div className="setting-item">
            <label className="setting-label">默認視圖</label>
            <select
              className="setting-select"
              value={preferences.calendarSettings.defaultView}
              onChange={(e) => handleNestedChange('calendarSettings', 'defaultView', e.target.value as any)}
            >
              <option value="month">月視圖</option>
              <option value="week">週視圖</option>
              <option value="day">日視圖</option>
            </select>
          </div>

          <div className="setting-item">
            <label className="setting-label">週開始日</label>
            <select
              className="setting-select"
              value={preferences.calendarSettings.weekStartsOn}
              onChange={(e) => handleNestedChange('calendarSettings', 'weekStartsOn', parseInt(e.target.value) as any)}
            >
              <option value={0}>星期日</option>
              <option value={1}>星期一</option>
            </select>
          </div>

          <div className="setting-item">
            <label className="setting-label">時間格式</label>
            <select
              className="setting-select"
              value={preferences.calendarSettings.timeFormat}
              onChange={(e) => handleNestedChange('calendarSettings', 'timeFormat', e.target.value as any)}
            >
              <option value="12h">12 小時制</option>
              <option value="24h">24 小時制</option>
            </select>
          </div>

          <div className="setting-item setting-item--checkbox">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={preferences.calendarSettings.showWeekends}
                onChange={(e) => handleNestedChange('calendarSettings', 'showWeekends', e.target.checked)}
              />
              <span>顯示週末</span>
            </label>
          </div>
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
        
        <MagicButton
          onClick={handleReset}
          variant="danger"
        >
          🔄 重置為默認值
        </MagicButton>
      </div>
    </div>
  )
}