/**
 * 自動備份調度器
 * 支援每日定時自動備份功能
 */

import { dataManager } from './dataManager'

export interface AutoBackupConfig {
  enabled: boolean
  time: string // 格式: "21:00" (24小時制)
  includeDownload: boolean // 是否同時下載備份文件
  lastAutoBackup?: string // 最後自動備份時間 ISO string
}

export class AutoBackupManager {
  private static instance: AutoBackupManager
  private intervalId: number | null = null
  private config: AutoBackupConfig
  private readonly CHECK_INTERVAL = 60000 // 每分鐘檢查一次

  private constructor() {
    // 從 localStorage 讀取配置
    this.config = this.loadConfig()
    this.startScheduler()
  }

  public static getInstance(): AutoBackupManager {
    if (!AutoBackupManager.instance) {
      AutoBackupManager.instance = new AutoBackupManager()
    }
    return AutoBackupManager.instance
  }

  /**
   * 載入自動備份配置
   */
  private loadConfig(): AutoBackupConfig {
    try {
      const stored = localStorage.getItem('autoBackupConfig')
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (error) {
      console.error('Error loading auto backup config:', error)
    }

    // 預設配置
    return {
      enabled: false, // 預設關閉，需要用戶手動開啟
      time: '21:00',
      includeDownload: true,
      lastAutoBackup: undefined
    }
  }

  /**
   * 保存配置到 localStorage
   */
  private saveConfig(): void {
    try {
      localStorage.setItem('autoBackupConfig', JSON.stringify(this.config))
      console.log('✅ 自動備份配置已保存:', this.config)
    } catch (error) {
      console.error('Error saving auto backup config:', error)
    }
  }

  /**
   * 獲取當前配置
   */
  public getConfig(): AutoBackupConfig {
    return { ...this.config }
  }

  /**
   * 更新配置
   */
  public updateConfig(updates: Partial<AutoBackupConfig>): void {
    this.config = { ...this.config, ...updates }
    this.saveConfig()

    // 重新啟動調度器
    this.stopScheduler()
    if (this.config.enabled) {
      this.startScheduler()
    }

    console.log('🔄 自動備份配置已更新:', this.config)
  }

  /**
   * 啟動調度器
   */
  private startScheduler(): void {
    if (!this.config.enabled) {
      console.log('⏸️ 自動備份已停用')
      return
    }

    if (this.intervalId) {
      this.stopScheduler()
    }

    console.log(`⏰ 啟動自動備份調度器 - 每日 ${this.config.time} 執行備份`)
    
    this.intervalId = window.setInterval(() => {
      this.checkAndBackup()
    }, this.CHECK_INTERVAL)

    // 啟動時也檢查一次
    setTimeout(() => this.checkAndBackup(), 1000)
  }

  /**
   * 停止調度器
   */
  private stopScheduler(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
      console.log('⏹️ 自動備份調度器已停止')
    }
  }

  /**
   * 檢查是否需要執行備份
   */
  private checkAndBackup(): void {
    if (!this.config.enabled) return

    const now = new Date()
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    const currentDate = now.toISOString().split('T')[0] // YYYY-MM-DD

    // 檢查是否到了備份時間（允許1分鐘誤差）
    const [targetHour, targetMinute] = this.config.time.split(':').map(Number)
    const targetTime = targetHour * 60 + targetMinute
    const currentTimeMinutes = now.getHours() * 60 + now.getMinutes()

    // 檢查時間是否匹配（允許1分鐘誤差範圍）
    const isBackupTime = Math.abs(currentTimeMinutes - targetTime) <= 1

    if (!isBackupTime) return

    // 檢查今天是否已經備份過
    const lastBackupDate = this.config.lastAutoBackup ? 
      new Date(this.config.lastAutoBackup).toISOString().split('T')[0] : null

    if (lastBackupDate === currentDate) {
      console.log(`📅 今天 (${currentDate}) 已經執行過自動備份`)
      return
    }

    console.log(`🚀 執行自動備份 - 時間: ${currentTime}`)
    this.performAutoBackup()
  }

  /**
   * 執行自動備份
   */
  private async performAutoBackup(): Promise<void> {
    try {
      console.log('🔄 開始自動備份程序...')

      // 1. 創建本地備份（存儲在 localStorage）
      dataManager.createBackup()
      console.log('✅ 本地備份已創建')

      // 2. 如果啟用下載，則同時下載備份文件
      if (this.config.includeDownload) {
        const exportData = dataManager.exportToJSON({
          includeTodos: true,
          includeProjects: true,
          includeEvents: true,
          includePomodoroSessions: true,
          includeUserData: false // 出於隱私考慮，預設不包含用戶資料
        })

        const content = JSON.stringify(exportData, null, 2)
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
        const filename = `auto-backup-${timestamp.split('T')[0]}.json`
        
        dataManager.downloadFile(content, filename, 'application/json')
        console.log(`💾 自動備份文件已下載: ${filename}`)
      }

      // 3. 更新最後備份時間
      this.config.lastAutoBackup = new Date().toISOString()
      this.saveConfig()

      // 4. 顯示通知（如果支援）
      this.showBackupNotification()

      // 5. 觸發自訂事件通知其他組件
      window.dispatchEvent(new CustomEvent('autoBackupCompleted', {
        detail: {
          timestamp: this.config.lastAutoBackup,
          includeDownload: this.config.includeDownload
        }
      }))

      console.log('🎉 自動備份完成!')

    } catch (error) {
      console.error('❌ 自動備份失敗:', error)
      
      // 觸發錯誤事件
      window.dispatchEvent(new CustomEvent('autoBackupError', {
        detail: { error: error instanceof Error ? error.message : '未知錯誤' }
      }))
    }
  }

  /**
   * 顯示備份完成通知
   */
  private showBackupNotification(): void {
    // 檢查瀏覽器是否支援通知
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('📦 自動備份完成', {
        body: `數據已於 ${new Date().toLocaleTimeString('zh-TW')} 自動備份`,
        icon: '/favicon.ico',
        tag: 'auto-backup'
      })
    } else {
      // 替代通知方式 - 在控制台顯示
      console.log('📦 自動備份完成通知:', {
        time: new Date().toLocaleTimeString('zh-TW'),
        includeDownload: this.config.includeDownload
      })
    }
  }

  /**
   * 請求通知權限
   */
  public async requestNotificationPermission(): Promise<NotificationPermission> {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission()
      console.log('通知權限狀態:', permission)
      return permission
    }
    return 'denied'
  }

  /**
   * 手動觸發備份（用於測試）
   */
  public async manualBackup(): Promise<void> {
    console.log('🔧 手動觸發自動備份...')
    await this.performAutoBackup()
  }

  /**
   * 獲取下次備份時間
   */
  public getNextBackupTime(): Date | null {
    if (!this.config.enabled) return null

    const now = new Date()
    const [hour, minute] = this.config.time.split(':').map(Number)
    
    const nextBackup = new Date()
    nextBackup.setHours(hour, minute, 0, 0)

    // 如果今天的時間已經過了，設定為明天
    if (nextBackup.getTime() <= now.getTime()) {
      nextBackup.setDate(nextBackup.getDate() + 1)
    }

    return nextBackup
  }

  /**
   * 獲取最後備份時間
   */
  public getLastBackupTime(): Date | null {
    return this.config.lastAutoBackup ? new Date(this.config.lastAutoBackup) : null
  }

  /**
   * 清理資源（應用關閉時調用）
   */
  public destroy(): void {
    this.stopScheduler()
    AutoBackupManager.instance = null as any
  }
}

// 導出單例實例
export const autoBackupManager = AutoBackupManager.getInstance()

// 在視窗關閉時清理資源
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    autoBackupManager.destroy()
  })
}