# 🚀 MVP 實施指南 - 快速開始開發

## 🎯 MVP 範圍定義

為了在 **4-6 週**內快速上線一個可用版本，我們需要聚焦於最核心的功能。

### 核心功能 (必須有)
1. ✅ **今日焦點頁面** - 解決遺忘問題的核心
2. ✅ **番茄鐘為單位的任務** - 統一時間管理
3. ✅ **基礎智慧排程** - 自動安排任務到時間軸
4. ✅ **艾森豪威爾優先級** - 四象限任務分類

### 延後功能 (Nice to Have)
- ❌ AI任務拆解（第二期）
- ❌ 複雜的依賴關係管理（第二期）
- ❌ 進階分析圖表（第二期）
- ❌ 完整的拖拽功能（第二期）

---

## 📋 第一週：資料層重構

### Day 1-2: 更新資料模型

```typescript
// 1. 更新 src/types/todo.ts
export interface Todo {
  id: string
  text: string
  completed: boolean
  projectId?: string
  priority: Priority // 改為新的優先級系統
  totalPomodoros: number // 新增：預估番茄鐘數
  completedPomodoros: number // 新增：已完成番茄鐘數
  deadline?: Date
  scheduledSlots?: PomodoroSlot[] // 新增：已排程的時段
  createdAt: Date
  updatedAt: Date
  userId: string
}

// 2. 新增 src/types/priority.ts
export enum Priority {
  URGENT_IMPORTANT = 'urgent_important',
  IMPORTANT_NOT_URGENT = 'important_not_urgent',
  URGENT_NOT_IMPORTANT = 'urgent_not_important',
  NOT_URGENT_NOT_IMPORTANT = 'not_urgent_not_important'
}

export const PriorityConfig = {
  urgent_important: {
    label: '重要且緊急',
    color: '#FF4757',
    order: 1
  },
  // ... 其他配置
}

// 3. 新增 src/types/scheduling.ts
export interface PomodoroSlot {
  id: string
  todoId: string
  date: Date
  startTime: string // "09:00"
  endTime: string   // "09:25"
  status: 'scheduled' | 'completed' | 'missed'
}
```

### Day 3-4: 建立排程服務

```typescript
// src/services/scheduling/SmartScheduler.ts
export class SmartScheduler {
  // 為任務自動安排時間
  scheduleTodo(todo: Todo, preferences?: SchedulePreferences): PomodoroSlot[] {
    const slots: PomodoroSlot[] = []
    const requiredSlots = todo.totalPomodoros
    
    // 1. 根據優先級決定開始時間
    const startDate = this.getStartDateByPriority(todo.priority)
    
    // 2. 找到可用的時間段
    for (let i = 0; i < requiredSlots; i++) {
      const slot = this.findNextAvailableSlot(startDate)
      slots.push(slot)
    }
    
    return slots
  }
  
  // 獲取某一天的所有已排程項目
  getDaySchedule(date: Date): ScheduleItem[] {
    // 返回當天的所有番茄鐘時段
  }
}
```

### Day 5: 資料遷移

```typescript
// src/utils/dataMigration.ts
export function migrateToNewFormat() {
  const oldTodos = localStorage.getItem('todos')
  if (!oldTodos) return
  
  const todos = JSON.parse(oldTodos)
  const migratedTodos = todos.map(todo => ({
    ...todo,
    priority: mapOldPriorityToNew(todo.priority),
    totalPomodoros: estimatePomodoros(todo),
    completedPomodoros: 0,
    scheduledSlots: []
  }))
  
  localStorage.setItem('todos_v2', JSON.stringify(migratedTodos))
}
```

---

## 📋 第二週：今日焦點頁面

### Day 1-2: 設計今日焦點組件

```tsx
// src/components/views/TodayFocusView.tsx
export const TodayFocusView: React.FC = () => {
  const { todos, updateTodo } = useTodos()
  const scheduler = useScheduler()
  
  const todaySchedule = scheduler.getTodaySchedule()
  const unscheduledUrgent = todos.filter(t => 
    t.priority === Priority.URGENT_IMPORTANT && 
    !t.scheduledSlots?.length
  )
  
  return (
    <div className="today-focus">
      <header className="today-header">
        <h1>🏠 今日焦點</h1>
        <div className="today-stats">
          <span>📅 {formatDate(new Date())}</span>
          <ProgressBar 
            completed={todaySchedule.completed} 
            total={todaySchedule.total} 
          />
        </div>
      </header>
      
      <section className="timeline">
        <h2>⏰ 今日時間軸</h2>
        <TimelineView schedule={todaySchedule} />
      </section>
      
      {unscheduledUrgent.length > 0 && (
        <section className="urgent-tasks">
          <h2>⚠️ 未安排的緊急任務</h2>
          <UrgentTaskList tasks={unscheduledUrgent} />
        </section>
      )}
      
      <div className="quick-actions">
        <button onClick={handleSmartSchedule}>
          🚀 智慧排程
        </button>
        <button onClick={handleStartPomodoro}>
          🍅 開始番茄鐘
        </button>
      </div>
    </div>
  )
}
```

### Day 3-4: 實作時間軸組件

```tsx
// src/components/productivity/TimelineView.tsx
export const TimelineView: React.FC<{schedule: ScheduleItem[]}> = ({ schedule }) => {
  return (
    <div className="timeline-container">
      {schedule.map(item => (
        <TimeSlot 
          key={item.id}
          time={item.startTime}
          task={item.task}
          status={item.status}
          onStatusChange={(status) => handleStatusChange(item.id, status)}
        />
      ))}
    </div>
  )
}
```

### Day 5: 整合到主導航

```tsx
// 更新 src/components/layout/MainLayout.tsx
// 將今日焦點設為預設頁面
const [currentView, setCurrentView] = useState<SidebarView>('todayFocus')

// 更新側邊欄
<Sidebar>
  <SidebarItem 
    icon="🏠" 
    label="今日焦點" 
    active={currentView === 'todayFocus'}
    onClick={() => setCurrentView('todayFocus')}
  />
  {/* 移除專案頁面項目 */}
</Sidebar>
```

---

## 📋 第三週：任務創建流程優化

### Day 1-2: 新的任務創建表單

```tsx
// src/components/todo/EnhancedTodoCreator.tsx
export const EnhancedTodoCreator: React.FC = () => {
  const [formData, setFormData] = useState({
    title: '',
    totalPomodoros: 1,
    priority: Priority.IMPORTANT_NOT_URGENT,
    deadline: null,
    autoSchedule: true
  })
  
  return (
    <form className="todo-creator" onSubmit={handleSubmit}>
      <input 
        placeholder="任務標題..."
        value={formData.title}
        onChange={(e) => setFormData({...formData, title: e.target.value})}
      />
      
      <div className="pomodoro-input">
        <label>🍅 預估番茄鐘數</label>
        <PomodoroSelector 
          value={formData.totalPomodoros}
          onChange={(v) => setFormData({...formData, totalPomodoros: v})}
        />
        <span className="time-hint">約 {formData.totalPomodoros * 25} 分鐘</span>
      </div>
      
      <div className="priority-selector">
        <label>📊 優先級</label>
        <PriorityMatrix 
          value={formData.priority}
          onChange={(p) => setFormData({...formData, priority: p})}
        />
      </div>
      
      <div className="schedule-option">
        <label>
          <input 
            type="checkbox" 
            checked={formData.autoSchedule}
            onChange={(e) => setFormData({...formData, autoSchedule: e.target.checked})}
          />
          🤖 自動安排到行事曆
        </label>
      </div>
      
      <button type="submit">創建任務</button>
    </form>
  )
}
```

### Day 3-4: 優先級選擇器組件

```tsx
// src/components/todo/PriorityMatrix.tsx
export const PriorityMatrix: React.FC = ({ value, onChange }) => {
  return (
    <div className="priority-matrix">
      <div className="matrix-grid">
        <div 
          className={`quadrant urgent-important ${value === 'urgent_important' ? 'active' : ''}`}
          onClick={() => onChange('urgent_important')}
        >
          <span className="icon">🔴</span>
          <span className="label">重要且緊急</span>
          <span className="hint">立即執行</span>
        </div>
        {/* 其他三個象限... */}
      </div>
    </div>
  )
}
```

---

## 📋 第四週：基礎智慧排程

### Day 1-3: 實作排程演算法

```typescript
// src/services/scheduling/SchedulingEngine.ts
export class SchedulingEngine {
  // 主排程方法
  async scheduleAllTasks(): Promise<void> {
    const todos = await this.getTodos()
    const sortedTodos = this.sortByPriority(todos)
    
    for (const todo of sortedTodos) {
      if (!todo.scheduledSlots?.length) {
        const slots = this.scheduler.scheduleTodo(todo)
        await this.saveTodoSchedule(todo.id, slots)
      }
    }
  }
  
  // 重新平衡排程
  async rebalanceSchedule(): Promise<void> {
    // 檢查是否有過載的日期
    // 重新分配任務
  }
}
```

### Day 4-5: 整合到UI

```tsx
// 添加智慧排程按鈕到今日焦點頁面
const handleSmartSchedule = async () => {
  setLoading(true)
  try {
    await schedulingEngine.scheduleAllTasks()
    toast.success('排程完成！')
    refreshSchedule()
  } catch (error) {
    toast.error('排程失敗')
  } finally {
    setLoading(false)
  }
}
```

---

## 📋 第五週：整合與優化

### Day 1-2: 整合行事曆

```tsx
// 更新現有的行事曆組件以顯示番茄鐘時段
// src/components/calendar/IntegratedCalendar.tsx
export const IntegratedCalendar: React.FC = () => {
  const events = useCalendarEvents()
  const pomodoroSlots = usePomodoroSlots()
  
  // 合併顯示事件和番茄鐘時段
  const calendarItems = mergeCalendarItems(events, pomodoroSlots)
  
  return (
    <Calendar 
      items={calendarItems}
      onItemClick={handleItemClick}
      view="week"
    />
  )
}
```

### Day 3-4: 性能優化

```typescript
// 1. 使用 React.memo 優化重渲染
export const TimelineView = React.memo(({ schedule }) => {
  // ...
})

// 2. 使用 useMemo 緩存計算結果
const todaySchedule = useMemo(() => {
  return scheduler.getTodaySchedule()
}, [todos, currentDate])

// 3. 實作虛擬滾動（如果任務很多）
```

### Day 5: 測試與修復

```typescript
// 寫基礎測試用例
describe('SmartScheduler', () => {
  it('should schedule urgent tasks first', () => {
    const todos = [
      { priority: Priority.IMPORTANT_NOT_URGENT, totalPomodoros: 2 },
      { priority: Priority.URGENT_IMPORTANT, totalPomodoros: 1 }
    ]
    
    const scheduled = scheduler.scheduleTodos(todos)
    expect(scheduled[0].priority).toBe(Priority.URGENT_IMPORTANT)
  })
})
```

---

## 📋 第六週：上線準備

### 準備清單
- [ ] 完整測試主要流程
- [ ] 修復發現的 bug
- [ ] 優化載入性能
- [ ] 準備用戶引導
- [ ] 更新文檔
- [ ] 部署到生產環境

### 用戶引導設計

```tsx
// src/components/onboarding/NewUserGuide.tsx
export const NewUserGuide: React.FC = () => {
  const steps = [
    {
      target: '.today-focus',
      content: '這是您的今日焦點頁面，顯示今天要做的事'
    },
    {
      target: '.priority-matrix',
      content: '使用四象限法則設定任務優先級'
    },
    {
      target: '.smart-schedule-btn',
      content: '點擊這裡讓系統自動安排您的任務'
    }
  ]
  
  return <Joyride steps={steps} />
}
```

---

## 🎯 關鍵成功要素

### 1. 保持簡單
- 不要過度設計
- 先讓基礎功能運作良好
- 逐步添加複雜功能

### 2. 快速迭代
- 每週都要有可見的進展
- 及時獲取反饋
- 根據反饋調整方向

### 3. 代碼品質
- 保持代碼整潔
- 寫必要的測試
- 做好錯誤處理

### 4. 用戶體驗
- 確保核心流程順暢
- 提供清晰的視覺反饋
- 考慮邊緣情況

---

## 🚀 立即開始

### 今天的任務
1. Fork 現有代碼庫
2. 創建新分支 `feature/time-management-mvp`
3. 開始更新資料模型
4. 建立基本的測試框架

### 本週目標
完成資料層重構，確保新舊資料相容

---

**記住**: MVP 的目標是快速驗證核心價值，不是做出完美的產品。先解決用戶最痛的問題！