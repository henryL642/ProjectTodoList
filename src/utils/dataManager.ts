/**
 * 數據管理工具 - 處理數據導入/導出、備份和統計
 */

export interface DataExportOptions {
  includeTodos: boolean
  includeProjects: boolean
  includeEvents: boolean
  includePomodoroSessions: boolean
  includeUserData: boolean
}

export interface DataStatistics {
  totalTodos: number
  completedTodos: number
  totalProjects: number
  totalEvents: number
  totalPomodoroSessions: number
  dataSize: string
  lastBackup?: Date
}

export interface ExportData {
  metadata: {
    exportDate: string
    version: string
    type: 'full' | 'partial'
  }
  user?: any
  todos?: any[]
  projects?: any[]
  events?: any[]
  pomodoroSessions?: any[]
}

export class DataManager {
  /**
   * 獲取所有本地存儲數據
   */
  private getAllStorageData(): Record<string, any> {
    const data: Record<string, any> = {}
    
    try {
      // 獲取所有 localStorage 中的應用數據
      const keys = ['todos', 'projects', 'events', 'pomodoroSessions', 'currentUser', 'userPreferences']
      
      keys.forEach(key => {
        const value = localStorage.getItem(key)
        if (value) {
          try {
            data[key] = JSON.parse(value)
          } catch {
            data[key] = value
          }
        }
      })
    } catch (error) {
      console.error('Error getting storage data:', error)
    }
    
    return data
  }

  /**
   * 計算數據統計
   */
  getDataStatistics(): DataStatistics {
    const data = this.getAllStorageData()
    
    const todos = data.todos || []
    const projects = data.projects || []
    const events = data.events || []
    const pomodoroSessions = data.pomodoroSessions || []
    
    // 計算數據大小
    const dataStr = JSON.stringify(data)
    const sizeInBytes = new Blob([dataStr]).size
    const sizeInKB = (sizeInBytes / 1024).toFixed(2)
    
    // 獲取上次備份時間
    const lastBackupStr = localStorage.getItem('lastBackupDate')
    const lastBackup = lastBackupStr ? new Date(lastBackupStr) : undefined
    
    return {
      totalTodos: todos.length,
      completedTodos: todos.filter((todo: any) => todo.completed).length,
      totalProjects: projects.length,
      totalEvents: events.length,
      totalPomodoroSessions: pomodoroSessions.length,
      dataSize: `${sizeInKB} KB`,
      lastBackup
    }
  }

  /**
   * 導出數據為 JSON
   */
  exportToJSON(options: DataExportOptions): ExportData {
    const data = this.getAllStorageData()
    const exportData: ExportData = {
      metadata: {
        exportDate: new Date().toISOString(),
        version: '1.0.0',
        type: this.isFullExport(options) ? 'full' : 'partial'
      }
    }

    if (options.includeUserData && data.currentUser) {
      exportData.user = data.currentUser
    }

    if (options.includeTodos && data.todos) {
      exportData.todos = data.todos
    }

    if (options.includeProjects && data.projects) {
      exportData.projects = data.projects
    }

    if (options.includeEvents && data.events) {
      exportData.events = data.events
    }

    if (options.includePomodoroSessions && data.pomodoroSessions) {
      exportData.pomodoroSessions = data.pomodoroSessions
    }

    return exportData
  }

  /**
   * 導出數據為 CSV
   */
  exportToCSV(dataType: 'todos' | 'projects' | 'events'): string {
    const data = this.getAllStorageData()
    
    switch (dataType) {
      case 'todos':
        return this.todosToCSV(data.todos || [])
      case 'projects':
        return this.projectsToCSV(data.projects || [])
      case 'events':
        return this.eventsToCSV(data.events || [])
      default:
        throw new Error(`Unsupported data type: ${dataType}`)
    }
  }

  /**
   * 下載文件
   */
  downloadFile(content: string, filename: string, contentType: string) {
    const blob = new Blob([content], { type: contentType })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  /**
   * 導入數據
   */
  async importData(file: File): Promise<{ success: boolean; message: string; imported?: any }> {
    try {
      const content = await this.readFile(file)
      const data = JSON.parse(content)
      
      // 驗證數據格式
      if (!this.validateImportData(data)) {
        return {
          success: false,
          message: '數據格式無效，請檢查文件是否為有效的導出文件'
        }
      }

      // 備份現有數據
      this.createBackup()

      // 導入數據
      const imported = await this.processImportData(data)
      
      return {
        success: true,
        message: `數據導入成功！導入了 ${imported.summary}`,
        imported
      }
    } catch (error) {
      console.error('Import error:', error)
      return {
        success: false,
        message: `導入失败：${error instanceof Error ? error.message : '未知錯誤'}`
      }
    }
  }

  /**
   * 創建備份
   */
  createBackup(): void {
    const data = this.getAllStorageData()
    const backup = {
      ...data,
      backupDate: new Date().toISOString()
    }
    
    localStorage.setItem('dataBackup', JSON.stringify(backup))
    localStorage.setItem('lastBackupDate', new Date().toISOString())
  }

  /**
   * 從備份恢復
   */
  restoreFromBackup(): { success: boolean; message: string } {
    try {
      const backupStr = localStorage.getItem('dataBackup')
      if (!backupStr) {
        return {
          success: false,
          message: '沒有找到備份數據'
        }
      }

      const backup = JSON.parse(backupStr)
      
      // 恢復數據
      Object.keys(backup).forEach(key => {
        if (key !== 'backupDate') {
          localStorage.setItem(key, JSON.stringify(backup[key]))
        }
      })

      // 刷新頁面以重新加載數據
      window.location.reload()

      return {
        success: true,
        message: '數據恢復成功'
      }
    } catch (error) {
      console.error('Restore error:', error)
      return {
        success: false,
        message: '數據恢復失敗'
      }
    }
  }

  /**
   * 清除所有數據
   */
  clearAllData(): { success: boolean; message: string } {
    try {
      // 先創建備份
      this.createBackup()
      
      // 清除應用數據
      const keys = ['todos', 'projects', 'events', 'pomodoroSessions', 'userPreferences']
      keys.forEach(key => {
        localStorage.removeItem(key)
      })

      // 觸發存儲事件以通知其他組件
      window.dispatchEvent(new CustomEvent('localStorageUpdated', {
        detail: { type: 'clear' }
      }))

      return {
        success: true,
        message: '所有數據已清除，備份已保存'
      }
    } catch (error) {
      console.error('Clear data error:', error)
      return {
        success: false,
        message: '清除數據失敗'
      }
    }
  }

  // 私有輔助方法
  private isFullExport(options: DataExportOptions): boolean {
    return options.includeTodos && options.includeProjects && 
           options.includeEvents && options.includePomodoroSessions && 
           options.includeUserData
  }

  private todosToCSV(todos: any[]): string {
    if (!todos.length) return ''
    
    const headers = ['ID', '任務內容', '是否完成', '優先級', '截止日期', '專案ID', '創建時間']
    const rows = todos.map(todo => [
      todo.id,
      `"${todo.text.replace(/"/g, '""')}"`, // 處理引號
      todo.completed ? '是' : '否',
      todo.priority || '中',
      todo.dueDate || '',
      todo.projectId || '',
      todo.createdAt
    ])

    return [headers, ...rows]
      .map(row => row.join(','))
      .join('\n')
  }

  private projectsToCSV(projects: any[]): string {
    if (!projects.length) return ''
    
    const headers = ['ID', '專案名稱', '描述', '顏色', '圖標', '創建時間']
    const rows = projects.map(project => [
      project.id,
      `"${project.name.replace(/"/g, '""')}"`,
      `"${(project.description || '').replace(/"/g, '""')}"`,
      project.color,
      project.icon,
      project.createdAt
    ])

    return [headers, ...rows]
      .map(row => row.join(','))
      .join('\n')
  }

  private eventsToCSV(events: any[]): string {
    if (!events.length) return ''
    
    const headers = ['ID', '事件標題', '描述', '開始時間', '是否全天', '類型', '狀態']
    const rows = events.map(event => [
      event.id,
      `"${event.title.replace(/"/g, '""')}"`,
      `"${(event.description || '').replace(/"/g, '""')}"`,
      event.startDate,
      event.allDay ? '是' : '否',
      event.type,
      event.status
    ])

    return [headers, ...rows]
      .map(row => row.join(','))
      .join('\n')
  }

  private readFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target?.result as string)
      reader.onerror = (e) => reject(new Error('文件讀取失敗'))
      reader.readAsText(file)
    })
  }

  private validateImportData(data: any): boolean {
    if (!data || typeof data !== 'object') return false
    
    // 檢查是否有 metadata
    if (data.metadata && typeof data.metadata === 'object') {
      return true
    }
    
    // 檢查是否為舊格式的數據
    return data.todos || data.projects || data.events || data.pomodoroSessions
  }

  private async processImportData(data: any): Promise<{ summary: string }> {
    let importCount = 0
    const summary: string[] = []

    // 處理不同類型的數據
    if (data.todos && Array.isArray(data.todos)) {
      localStorage.setItem('todos', JSON.stringify(data.todos))
      importCount += data.todos.length
      summary.push(`${data.todos.length} 個任務`)
    }

    if (data.projects && Array.isArray(data.projects)) {
      localStorage.setItem('projects', JSON.stringify(data.projects))
      importCount += data.projects.length
      summary.push(`${data.projects.length} 個專案`)
    }

    if (data.events && Array.isArray(data.events)) {
      localStorage.setItem('events', JSON.stringify(data.events))
      importCount += data.events.length
      summary.push(`${data.events.length} 個事件`)
    }

    if (data.pomodoroSessions && Array.isArray(data.pomodoroSessions)) {
      localStorage.setItem('pomodoroSessions', JSON.stringify(data.pomodoroSessions))
      importCount += data.pomodoroSessions.length
      summary.push(`${data.pomodoroSessions.length} 個番茄鐘記錄`)
    }

    // 觸發存儲更新事件
    window.dispatchEvent(new CustomEvent('localStorageUpdated', {
      detail: { type: 'import' }
    }))

    return {
      summary: summary.join('、') || '無數據'
    }
  }
}

// 創建單例實例
export const dataManager = new DataManager()