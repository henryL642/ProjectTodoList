import React, { useState, useEffect } from 'react'
import { MagicButton } from '../MagicButton'
import { dataManager, type DataExportOptions, type DataStatistics } from '../../utils/dataManager'

export const DataManagement: React.FC = () => {
  const [statistics, setStatistics] = useState<DataStatistics>({
    totalTodos: 0,
    completedTodos: 0,
    totalProjects: 0,
    totalEvents: 0,
    totalPomodoroSessions: 0,
    dataSize: '0 KB'
  })
  
  const [exportOptions, setExportOptions] = useState<DataExportOptions>({
    includeTodos: true,
    includeProjects: true,
    includeEvents: true,
    includePomodoroSessions: true,
    includeUserData: false
  })
  
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [showConfirmClear, setShowConfirmClear] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    loadStatistics()
    
    // 監聽存儲變化
    const handleStorageChange = () => {
      loadStatistics()
    }
    
    window.addEventListener('localStorageUpdated', handleStorageChange)
    return () => window.removeEventListener('localStorageUpdated', handleStorageChange)
  }, [])

  const loadStatistics = () => {
    const stats = dataManager.getDataStatistics()
    setStatistics(stats)
  }

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }

  const handleExportJSON = async () => {
    try {
      setIsExporting(true)
      const exportData = dataManager.exportToJSON(exportOptions)
      const content = JSON.stringify(exportData, null, 2)
      const filename = `todo-backup-${new Date().toISOString().split('T')[0]}.json`
      
      dataManager.downloadFile(content, filename, 'application/json')
      showMessage('success', 'JSON 導出成功！')
    } catch (error) {
      console.error('Export error:', error)
      showMessage('error', 'JSON 導出失敗')
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportCSV = async (dataType: 'todos' | 'projects' | 'events') => {
    try {
      setIsExporting(true)
      const csvContent = dataManager.exportToCSV(dataType)
      
      if (!csvContent) {
        showMessage('error', `沒有 ${dataType === 'todos' ? '任務' : dataType === 'projects' ? '專案' : '事件'} 數據可導出`)
        return
      }
      
      const filename = `${dataType}-${new Date().toISOString().split('T')[0]}.csv`
      dataManager.downloadFile(csvContent, filename, 'text/csv')
      showMessage('success', 'CSV 導出成功！')
    } catch (error) {
      console.error('CSV Export error:', error)
      showMessage('error', 'CSV 導出失敗')
    } finally {
      setIsExporting(false)
    }
  }

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setIsImporting(true)
      const result = await dataManager.importData(file)
      
      if (result.success) {
        showMessage('success', result.message)
        loadStatistics()
      } else {
        showMessage('error', result.message)
      }
    } catch (error) {
      console.error('Import error:', error)
      showMessage('error', '數據導入失敗')
    } finally {
      setIsImporting(false)
      // 重置文件輸入
      event.target.value = ''
    }
  }

  const handleCreateBackup = () => {
    try {
      dataManager.createBackup()
      showMessage('success', '備份創建成功！')
      loadStatistics()
    } catch (error) {
      console.error('Backup error:', error)
      showMessage('error', '備份創建失敗')
    }
  }

  const handleRestoreBackup = () => {
    const result = dataManager.restoreFromBackup()
    if (result.success) {
      showMessage('success', result.message)
    } else {
      showMessage('error', result.message)
    }
  }

  const handleClearData = () => {
    if (!showConfirmClear) {
      setShowConfirmClear(true)
      return
    }

    const result = dataManager.clearAllData()
    if (result.success) {
      showMessage('success', result.message)
      loadStatistics()
    } else {
      showMessage('error', result.message)
    }
    setShowConfirmClear(false)
  }

  return (
    <div className="data-management">
      {/* 消息提示 */}
      {message && (
        <div className={`message-banner message-banner--${message.type}`}>
          {message.text}
        </div>
      )}

      {/* 數據統計 */}
      <div className="data-section">
        <h4 className="section-title">📊 數據統計</h4>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📋</div>
            <div className="stat-content">
              <div className="stat-number">{statistics.totalTodos}</div>
              <div className="stat-label">任務總數</div>
              <div className="stat-detail">已完成 {statistics.completedTodos} 個</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">📁</div>
            <div className="stat-content">
              <div className="stat-number">{statistics.totalProjects}</div>
              <div className="stat-label">專案數量</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">📅</div>
            <div className="stat-content">
              <div className="stat-number">{statistics.totalEvents}</div>
              <div className="stat-label">行事曆事件</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">🍅</div>
            <div className="stat-content">
              <div className="stat-number">{statistics.totalPomodoroSessions}</div>
              <div className="stat-label">番茄鐘記錄</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">💾</div>
            <div className="stat-content">
              <div className="stat-number">{statistics.dataSize}</div>
              <div className="stat-label">數據大小</div>
              {statistics.lastBackup && (
                <div className="stat-detail">
                  最後備份：{statistics.lastBackup.toLocaleDateString('zh-TW')}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 數據導出 */}
      <div className="data-section">
        <h4 className="section-title">📤 數據導出</h4>
        
        {/* 導出選項 */}
        <div className="export-options">
          <h5>選擇要導出的數據</h5>
          <div className="checkbox-grid">
            {Object.entries({
              includeTodos: '任務數據',
              includeProjects: '專案數據',
              includeEvents: '行事曆事件',
              includePomodoroSessions: '番茄鐘記錄',
              includeUserData: '用戶資料'
            }).map(([key, label]) => (
              <label key={key} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={exportOptions[key as keyof DataExportOptions]}
                  onChange={(e) => setExportOptions(prev => ({
                    ...prev,
                    [key]: e.target.checked
                  }))}
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </div>
        
        {/* 導出按鈕 */}
        <div className="export-actions">
          <MagicButton
            onClick={handleExportJSON}
            disabled={isExporting}
            variant="primary"
          >
            {isExporting ? '導出中...' : '📄 導出為 JSON'}
          </MagicButton>
          
          <div className="csv-export-group">
            <span className="csv-label">CSV 導出：</span>
            <MagicButton
              onClick={() => handleExportCSV('todos')}
              disabled={isExporting}
              variant="secondary"
              size="small"
            >
              任務
            </MagicButton>
            <MagicButton
              onClick={() => handleExportCSV('projects')}
              disabled={isExporting}
              variant="secondary"
              size="small"
            >
              專案
            </MagicButton>
            <MagicButton
              onClick={() => handleExportCSV('events')}
              disabled={isExporting}
              variant="secondary"
              size="small"
            >
              事件
            </MagicButton>
          </div>
        </div>
      </div>

      {/* 數據導入 */}
      <div className="data-section">
        <h4 className="section-title">📥 數據導入</h4>
        <p className="section-description">
          導入之前導出的 JSON 備份文件。導入前會自動創建當前數據的備份。
        </p>
        
        <div className="import-area">
          <input
            type="file"
            accept=".json"
            onChange={handleImport}
            disabled={isImporting}
            id="import-file"
            className="import-input"
          />
          <label htmlFor="import-file" className="import-button">
            {isImporting ? '導入中...' : '📁 選擇備份文件'}
          </label>
        </div>
      </div>

      {/* 備份與恢復 */}
      <div className="data-section">
        <h4 className="section-title">💾 備份與恢復</h4>
        <p className="section-description">
          創建本地備份以防數據丟失，或從最近的備份中恢復數據。
        </p>
        
        <div className="backup-actions">
          <MagicButton
            onClick={handleCreateBackup}
            variant="secondary"
          >
            🔒 創建備份
          </MagicButton>
          
          <MagicButton
            onClick={handleRestoreBackup}
            variant="secondary"
          >
            📥 從備份恢復
          </MagicButton>
        </div>
      </div>

      {/* 數據清理 */}
      <div className="data-section danger-section">
        <h4 className="section-title">🗑️ 數據清理</h4>
        <p className="section-description">
          ⚠️ 警告：此操作將清除所有數據且不可逆。執行前會自動創建備份。
        </p>
        
        <div className="clear-actions">
          <MagicButton
            onClick={handleClearData}
            variant="danger"
          >
            {showConfirmClear ? '⚠️ 確認清除所有數據？' : '🗑️ 清除所有數據'}
          </MagicButton>
          
          {showConfirmClear && (
            <MagicButton
              onClick={() => setShowConfirmClear(false)}
              variant="secondary"
            >
              取消
            </MagicButton>
          )}
        </div>
      </div>
    </div>
  )
}