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
      console.log('開始讀取文件...')
      const content = await this.readFile(file)
      console.log('文件內容長度:', content.length)
      
      console.log('解析 JSON...')
      const data = JSON.parse(content)
      console.log('解析的數據結構:', Object.keys(data))
      
      // 驗證數據格式
      console.log('驗證數據格式...')
      if (!this.validateImportData(data)) {
        console.log('數據格式驗證失敗')
        return {
          success: false,
          message: '數據格式無效，請檢查文件是否為有效的導出文件'
        }
      }
      console.log('數據格式驗證成功')

      // 備份現有數據
      console.log('創建當前數據備份...')
      this.createBackup()

      // 導入數據
      console.log('開始處理導入數據...')
      const imported = await this.processImportData(data)
      console.log('導入處理完成:', imported)
      
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

    // 獲取當前用戶 ID
    console.log('開始獲取當前用戶信息...')
    const currentUserStr = localStorage.getItem('currentUser')
    console.log('currentUser localStorage 值:', currentUserStr)
    
    let currentUser
    try {
      currentUser = JSON.parse(currentUserStr || '{}')
      console.log('解析後的用戶對象:', currentUser)
    } catch (error) {
      console.error('解析用戶信息失敗:', error)
      currentUser = {}
    }
    
    const currentUserId = currentUser?.id

    console.log('提取的用戶ID:', currentUserId)

    if (!currentUserId) {
      console.error('無法獲取當前用戶ID，用戶信息:', currentUser)
      throw new Error('無法獲取當前用戶信息，請先登錄')
    }

    console.log('✅ 當前用戶ID:', currentUserId)

    // 處理任務數據 - 更新用戶ID
    if (data.todos && Array.isArray(data.todos)) {
      console.log('導入任務數據:', data.todos.length, '個任務')
      
      // 獲取現有任務
      const existingTodos = JSON.parse(localStorage.getItem('todos') || '[]')
      
      // 更新導入任務的用戶ID和項目ID映射
      const updatedTodos = data.todos.map(todo => ({
        ...todo,
        userId: currentUserId,
        // 保持其他字段不變，但更新用戶關聯
        id: todo.id || crypto.randomUUID(),
        createdAt: todo.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }))

      // 合併任務（避免重複）
      const mergedTodos = [...existingTodos, ...updatedTodos]
      localStorage.setItem('todos', JSON.stringify(mergedTodos))
      importCount += updatedTodos.length
      summary.push(`${updatedTodos.length} 個任務`)
    }

    // 處理專案數據 - 更新用戶ID
    if (data.projects && Array.isArray(data.projects)) {
      console.log('導入專案數據:', data.projects.length, '個專案')
      
      // 獲取現有專案
      const existingProjects = JSON.parse(localStorage.getItem('projects') || '[]')
      
      // 更新導入專案的用戶ID
      const updatedProjects = data.projects.map(project => ({
        ...project,
        userId: currentUserId,
        id: project.id || crypto.randomUUID(),
        createdAt: project.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }))

      // 合併專案（避免重複）
      const mergedProjects = [...existingProjects, ...updatedProjects]
      localStorage.setItem('projects', JSON.stringify(mergedProjects))
      importCount += updatedProjects.length
      summary.push(`${updatedProjects.length} 個專案`)
    }

    // 處理事件數據 - 更新用戶ID
    if (data.events && Array.isArray(data.events)) {
      console.log('導入事件數據:', data.events.length, '個事件')
      
      // 獲取現有事件
      const existingEvents = JSON.parse(localStorage.getItem('events') || '[]')
      
      // 更新導入事件的用戶ID
      const updatedEvents = data.events.map(event => ({
        ...event,
        userId: currentUserId,
        id: event.id || crypto.randomUUID(),
        createdAt: event.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }))

      // 合併事件
      const mergedEvents = [...existingEvents, ...updatedEvents]
      localStorage.setItem('events', JSON.stringify(mergedEvents))
      importCount += updatedEvents.length
      summary.push(`${updatedEvents.length} 個事件`)
    }

    // 處理番茄鐘記錄 - 更新用戶ID
    if (data.pomodoroSessions && Array.isArray(data.pomodoroSessions)) {
      console.log('導入番茄鐘記錄:', data.pomodoroSessions.length, '個記錄')
      
      // 獲取現有記錄
      const existingSessions = JSON.parse(localStorage.getItem('pomodoroSessions') || '[]')
      
      // 更新導入記錄的用戶ID
      const updatedSessions = data.pomodoroSessions.map(session => ({
        ...session,
        userId: currentUserId,
        id: session.id || crypto.randomUUID()
      }))

      // 合併記錄
      const mergedSessions = [...existingSessions, ...updatedSessions]
      localStorage.setItem('pomodoroSessions', JSON.stringify(mergedSessions))
      importCount += updatedSessions.length
      summary.push(`${updatedSessions.length} 個番茄鐘記錄`)
    }

    console.log('觸發存儲更新事件...')
    // 為每個導入的數據類型觸發存儲更新事件（使用最新的合併數據）
    if (data.todos && Array.isArray(data.todos)) {
      const mergedTodos = JSON.parse(localStorage.getItem('todos') || '[]')
      window.dispatchEvent(new CustomEvent('localStorageUpdated', {
        detail: { key: 'todos', value: mergedTodos }
      }))
    }
    
    if (data.projects && Array.isArray(data.projects)) {
      const mergedProjects = JSON.parse(localStorage.getItem('projects') || '[]')
      window.dispatchEvent(new CustomEvent('localStorageUpdated', {
        detail: { key: 'projects', value: mergedProjects }
      }))
    }
    
    if (data.events && Array.isArray(data.events)) {
      const mergedEvents = JSON.parse(localStorage.getItem('events') || '[]')
      window.dispatchEvent(new CustomEvent('localStorageUpdated', {
        detail: { key: 'events', value: mergedEvents }
      }))
    }
    
    if (data.pomodoroSessions && Array.isArray(data.pomodoroSessions)) {
      const mergedSessions = JSON.parse(localStorage.getItem('pomodoroSessions') || '[]')
      window.dispatchEvent(new CustomEvent('localStorageUpdated', {
        detail: { key: 'pomodoroSessions', value: mergedSessions }
      }))
    }

    console.log('導入總數:', importCount, '項目')
    return {
      summary: summary.join('、') || '無數據'
    }
  }
}

// 創建單例實例
export const dataManager = new DataManager()