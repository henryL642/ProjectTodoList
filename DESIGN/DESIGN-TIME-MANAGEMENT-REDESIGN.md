# ⏰ 時間管理系統重新設計

## 🎯 核心問題分析

### 當前痛點
1. **遺忘問題** - 任務沒有被主動安排到時間軸上，容易被遺忘
2. **UI/UX 混亂** - 專案頁面功能重複，導航不直觀
3. **缺乏統一時間單位** - 沒有標準化的時間計算方式
4. **視圖功能不完整** - 甘特圖無法管理任務，行事曆缺少任務整合
5. **被動管理** - 系統不會主動提醒或建議時間安排

### 設計目標
- 🍅 **番茄鐘驅動** - 所有任務以番茄鐘為計算單位
- 📅 **主動排程** - 系統主動建議時間安排，避免遺忘
- 🎨 **簡化UI** - 消除冗餘功能，直觀的單一流程
- 🔗 **統一整合** - 任務、事件、專案完全整合
- ⚡ **智慧提醒** - 基於優先級和截止日期的智能提醒

---

## 🧠 新時間管理邏輯

### 核心概念重新定義

#### 1. 統一時間單位 🍅
```typescript
interface PomodoroUnit {
  duration: 25 // 分鐘
  breakTime: 5 // 短休息
  longBreakInterval: 4 // 每4個番茄鐘一次長休息
  longBreakDuration: 15 // 長休息時間
}

interface Task {
  id: string
  title: string
  projectId?: string
  totalPomodoros: number // 預估總番茄鐘數
  completedPomodoros: number
  scheduledSlots: PomodoroSlot[] // 已安排的時間段
  priority: EisenhowerMatrix
  deadline?: Date
  createdAt: Date
}

interface PomodoroSlot {
  id: string
  taskId: string
  scheduledDate: Date
  startTime: string // "09:00"
  status: 'scheduled' | 'completed' | 'missed'
}
```

#### 2. 艾森豪威爾優先級矩陣
```typescript
enum EisenhowerMatrix {
  URGENT_IMPORTANT = 'urgent_important',     // 重要且緊急 - 立即執行
  IMPORTANT_NOT_URGENT = 'important_not_urgent', // 重要但不緊急 - 計劃執行
  URGENT_NOT_IMPORTANT = 'urgent_not_important', // 不重要但緊急 - 委派/快速處理
  NOT_URGENT_NOT_IMPORTANT = 'not_urgent_not_important' // 不重要不緊急 - 刪除/延後
}

const PriorityConfig = {
  urgent_important: {
    color: '#FF4757', // 紅色
    label: '立即執行',
    autoSchedule: true,
    maxDelay: 0 // 立即安排
  },
  important_not_urgent: {
    color: '#FFA726', // 橙色
    label: '計劃執行',
    autoSchedule: true,
    maxDelay: 7 // 一週內安排
  },
  urgent_not_important: {
    color: '#42A5F5', // 藍色
    label: '快速處理',
    autoSchedule: true,
    maxDelay: 1 // 一天內安排
  },
  not_urgent_not_important: {
    color: '#66BB6A', // 綠色
    label: '考慮延後',
    autoSchedule: false,
    maxDelay: 30 // 可延後
  }
}
```

#### 3. 智慧排程邏輯
```typescript
interface SmartScheduler {
  // 自動為任務分配番茄鐘時段
  autoScheduleTask(task: Task): PomodoroSlot[]
  
  // 根據優先級和截止日期重新排程
  rebalanceSchedule(): void
  
  // 找出空閒時間段
  findAvailableSlots(date: Date, requiredPomodoros: number): PomodoroSlot[]
  
  // 衝突檢測和解決
  resolveConflicts(slots: PomodoroSlot[]): PomodoroSlot[]
}
```

---

## 🎨 全新 UI/UX 設計

### 1. 簡化導航結構

#### 當前問題
- 專案頁面功能與左上角選擇器重複
- 多個入口造成混亂
- 功能分散難以發現

#### 新設計方案
```
主界面架構：
├── 頂部欄
│   ├── 專案選擇器 (全局，可選擇"所有專案")
│   ├── 視圖切換 (今日/週視圖/月視圖/甘特圖)
│   └── 快速新增按鈕
├── 側邊欄 (可收合)
│   ├── 🏠 今日焦點 (預設首頁)
│   ├── 📋 所有任務
│   ├── 📅 行事曆
│   ├── 📊 甘特圖
│   ├── 🍅 番茄鐘
│   ├── 📈 統計分析
│   └── ⚙️ 設定
└── 主內容區
    └── 根據側邊欄選擇顯示不同視圖
```

### 2. 今日焦點 - 新的預設首頁

```typescript
interface TodayFocusView {
  // 顯示今日已安排的番茄鐘時段
  scheduledPomodoros: PomodoroSlot[]
  
  // 未安排的緊急任務
  unscheduledUrgentTasks: Task[]
  
  // 今日統計
  stats: {
    totalScheduled: number
    completed: number
    remaining: number
  }
  
  // 快速操作
  quickActions: {
    addTask: () => void
    startPomodoro: () => void
    reschedule: () => void
  }
}
```

#### 今日焦點界面設計
```
┌─────────────────────────────────────────────────────────┐
│ 🏠 今日焦點                    📅 2025-07-31 週三      │
├─────────────────────────────────────────────────────────┤
│ 📊 今日進度: ████████░░ 8/12 番茄鐘                     │
├─────────────────────────────────────────────────────────┤
│ ⏰ 今日時間軸                                           │
│ 09:00-09:25 🍅 [專案A] 任務1 ✅                        │
│ 09:30-09:55 🍅 [專案A] 任務1 ✅                        │
│ 10:00-10:25 🍅 休息                                    │
│ 10:30-10:55 🍅 [專案B] 任務2 ⏸️ (進行中)               │
│ 11:00-11:25 🍅 [專案B] 任務2                           │
│ ...                                                     │
├─────────────────────────────────────────────────────────┤
│ ⚠️ 未安排的緊急任務                                     │
│ 🔴 [立即執行] 客戶會議簡報 (3🍅) - 明天截止              │
│ 🟠 [計劃執行] 月報撰寫 (5🍅) - 下週五截止                │
├─────────────────────────────────────────────────────────┤
│ [🚀 智慧排程] [➕ 新增任務] [🍅 開始番茄鐘]              │
└─────────────────────────────────────────────────────────┘
```

### 3. 統一的任務/事件創建流程

#### 新增任務界面
```typescript
interface TaskCreationForm {
  title: string
  description?: string
  projectId?: string
  totalPomodoros: number // 必填：預估番茄鐘數
  priority: EisenhowerMatrix // 使用四象限
  deadline?: Date
  tags?: string[]
  
  // 智慧排程選項
  autoSchedule: boolean // 是否立即安排時間
  preferredTimeSlots?: string[] // 偏好時段
}
```

#### 統一創建界面設計
```
┌─────────────────────────────────────────────┐
│ ➕ 新增任務                                 │
├─────────────────────────────────────────────┤
│ 標題: [____________________________]       │
│ 專案: [下拉選擇] [➕ 新專案]                │
│ 描述: [____________________________]       │
│                                             │
│ 🍅 預估番茄鐘數: [3] (1🍅 = 25分鐘)        │
│                                             │
│ 📊 優先級:                                  │
│ ○ 🔴 重要且緊急 (立即執行)                  │
│ ● 🟠 重要但不緊急 (計劃執行)                │
│ ○ 🔵 不重要但緊急 (快速處理)                │
│ ○ 🟢 不重要不緊急 (考慮延後)                │
│                                             │
│ 📅 截止日期: [選填] [日期選擇器]            │
│                                             │
│ 🤖 智慧排程:                                │
│ ☑️ 自動安排到行事曆                        │
│ 偏好時段: [上午] [下午] [晚上]              │
│                                             │
│ [取消] [儲存] [儲存並安排時間]              │
└─────────────────────────────────────────────┘
```

---

## 📅 整合式行事曆設計

### 1. 統一的行事曆視圖

#### 新行事曆特性
- **任務整合** - 顯示已安排的番茄鐘時段
- **事件管理** - 可編輯的事件，支援專案綁定
- **拖拽排程** - 可直接拖拽調整時間
- **衝突檢測** - 自動檢測並標示時間衝突

#### 行事曆項目類型
```typescript
interface CalendarItem {
  id: string
  type: 'pomodoro' | 'event' | 'break'
  title: string
  startTime: Date
  endTime: Date
  projectId?: string
  
  // 不同類型的額外資訊
  pomodoroInfo?: {
    taskId: string
    sessionNumber: number // 第幾個番茄鐘
    totalSessions: number
  }
  
  eventInfo?: {
    location?: string
    attendees?: string[]
    description?: string
  }
}
```

#### 行事曆界面設計
```
📅 2025年7月 - 週視圖                          [今日] [週] [月]
┌─────────┬─────────┬─────────┬─────────┬─────────┬─────────┬─────────┐
│   週一   │   週二   │   週三   │   週四   │   週五   │   週六   │   週日   │
│   28     │   29     │   30     │   31     │    1     │    2     │    3     │
├─────────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────────┤
│ 09:00   │         │ 🍅專案A  │         │         │         │         │
│ 09:30   │         │ 任務1   │         │         │         │         │
│ 10:00   │         │ ─────── │         │         │         │         │
│ 10:30   │         │ 🍅專案A  │         │         │         │         │
│ 11:00   │         │ 任務1   │         │         │         │         │
│ 11:30   │         │ ─────── │         │         │         │         │
│ 12:00   │         │ 📅會議   │         │         │         │         │
│ 12:30   │         │ (專案B) │         │         │         │         │
│ 13:00   │         │ ─────── │         │         │         │         │
│ ...     │         │         │         │         │         │         │
└─────────┴─────────┴─────────┴─────────┴─────────┴─────────┴─────────┘

圖例: 🍅 番茄鐘時段 | 📅 事件 | ⏸️ 休息時間
```

### 2. 事件編輯功能

#### 增強的事件管理
```typescript
interface Event {
  id: string
  title: string
  description?: string
  startTime: Date
  endTime: Date
  projectId?: string // 可綁定專案
  location?: string
  attendees?: string[]
  reminders?: Reminder[]
  
  // 與任務的關聯
  relatedTasks?: string[] // 相關任務ID
  
  // 重複設定
  recurrence?: {
    frequency: 'daily' | 'weekly' | 'monthly'
    interval: number
    endDate?: Date
  }
}
```

---

## 📊 功能性甘特圖重新設計

### 1. 問題分析
當前甘特圖問題：
- 無法顯示任務
- 無法調整時間範圍
- 缺乏互動功能
- 對專案管理無幫助

### 2. 新甘特圖設計

#### 甘特圖功能需求
```typescript
interface GanttChart {
  // 顯示層級
  projects: Project[]
  tasks: Task[]
  
  // 時間軸控制
  timeRange: {
    start: Date
    end: Date
    granularity: 'day' | 'week' | 'month'
  }
  
  // 互動功能
  features: {
    dragResize: boolean // 拖拽調整任務時間
    taskDependencies: boolean // 任務依賴關係
    progressTracking: boolean // 進度追蹤
    resourceAllocation: boolean // 資源分配
  }
}
```

#### 甘特圖界面設計
```
📊 甘特圖視圖                                     [週] [月] [季] [年]
┌────────────────┬─────────────────────────────────────────────────────┐
│ 任務/專案       │              2025年7月              2025年8月        │
│                │ 28 29 30 31  1  2  3  4  5  6  7  8  9 10 11 12 13  │
├────────────────┼─────────────────────────────────────────────────────┤
│ 📁 專案A        │ ████████████████████████████████████░░░░░░░░░░░░░░░  │
│   🍅 任務1 (5🍅) │   ████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│   🍅 任务2 (3🍅) │           ██████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│                │                                                     │
│ 📁 專案B        │ ░░░░░░░░████████████████████████░░░░░░░░░░░░░░░░░░░  │
│   🍅 任務3 (8🍅) │         ████████████████████████░░░░░░░░░░░░░░░░░░░  │
│                │                                                     │
│ 📋 個人任務      │ ██░░░░░░░░░░░░░░██░░░░██░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
└────────────────┴─────────────────────────────────────────────────────┘

圖例: ████ 已完成 | ░░░░ 計劃中 | 🔗 依賴關係
```

#### 甘特圖互動功能
- **拖拽調整** - 直接拖拽任務條調整開始/結束時間
- **進度更新** - 點擊任務條更新完成進度
- **依賴設定** - 連線設定任務依賴關係
- **資源檢視** - 顯示每個時段的工作負荷

---

## 🤖 智慧排程系統

### 1. 自動排程邏輯

#### 排程優先級規則
```typescript
interface SchedulingRules {
  // 1. 優先級排序 (艾森豪威爾矩陣)
  priorityOrder: [
    'urgent_important',     // 最高優先級
    'urgent_not_important', // 次高優先級  
    'important_not_urgent', // 中等優先級
    'not_urgent_not_important' // 最低優先級
  ]
  
  // 2. 時間約束
  timeConstraints: {
    workingHours: { start: '09:00', end: '18:00' }
    availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
    breakBetweenPomodoros: 5 // 分鐘
    longBreakInterval: 4 // 每4個番茄鐘
  }
  
  // 3. 智慧分配
  smartAllocation: {
    maxPomodorosPerDay: 12 // 一天最多番茄鐘數
    preferredBatchSize: 2-4 // 偏好連續番茄鐘數
    bufferTime: 15 // 任務間緩衝時間(分鐘)
  }
}
```

#### 排程演算法
```typescript
class SmartScheduler {
  // 主要排程方法
  scheduleTask(task: Task): PomodoroSlot[] {
    // 1. 計算最晚開始時間
    const latestStart = this.calculateLatestStart(task.deadline, task.totalPomodoros)
    
    // 2. 找出可用時間段
    const availableSlots = this.findAvailableSlots(new Date(), latestStart)
    
    // 3. 根據優先級分配時間
    const scheduledSlots = this.allocateTimeSlots(task, availableSlots)
    
    // 4. 檢查衝突並調整
    return this.resolveConflicts(scheduledSlots)
  }
  
  // 重新平衡所有任務
  rebalanceAllTasks(): void {
    const allTasks = this.getAllUncompletedTasks()
    const sortedTasks = this.sortByPriority(allTasks)
    
    // 清除現有排程
    this.clearAllSchedules()
    
    // 重新排程所有任務
    sortedTasks.forEach(task => {
      this.scheduleTask(task)
    })
  }
}
```

### 2. 智慧提醒系統

#### 提醒規則
```typescript
interface ReminderSystem {
  // 基於優先級的提醒
  priorityReminders: {
    urgent_important: {
      advance: [1, 2, 6, 24], // 提前1小時、2小時、6小時、1天
      frequency: 'high'
    },
    important_not_urgent: {
      advance: [24, 72, 168], // 提前1天、3天、1週
      frequency: 'medium'
    }
  }
  
  // 遺忘檢測
  forgottenTaskDetection: {
    unscheduledTaskAlert: 24, // 24小時未安排提醒
    approachingDeadline: 48, // 48小時內截止提醒
    overdueTasks: 'immediate' // 過期任務立即提醒
  }
}
```

---

## 📱 響應式設計適配

### 1. 手機端優化

#### 手機端導航
```
手機端界面 (< 768px):
┌─────────────────────────┐
│ ≡ 魔法待辦 | 專案A ▼ | ➕ │ <- 頂部欄
├─────────────────────────┤
│ 📅 今日 7/31 週三        │
│ ████████░░ 8/12 🍅      │ <- 進度條
├─────────────────────────┤
│ ⏰ 接下來                │
│ 10:30 🍅 專案B任務2      │ <- 當前/下一個番茄鐘
│     [▶️ 開始] [⏸️ 暫停]   │
├─────────────────────────┤
│ 📋 今日任務              │
│ ☐ 任務1 (2🍅剩餘)       │ <- 任務清單
│ ☑️ 任務2 ✅             │
│ ☐ 任務3 (5🍅)           │
├─────────────────────────┤
│ [🏠][📋][📅][📊][⚙️]    │ <- 底部導航
└─────────────────────────┘
```

### 2. 平板端適配

#### 平板端佈局 (768px - 1024px)
- 保留側邊欄但可收合
- 主內容區使用卡片佈局
- 支援手勢操作 (滑動、捏合)

---

## 🔧 技術實現建議

### 1. 資料模型更新

#### 核心實體關係
```typescript
// 更新後的資料模型
interface Project {
  id: string
  name: string
  color: string
  userId: string
  // 移除統計資訊，改為動態計算
}

interface Task {
  id: string
  title: string
  description?: string
  projectId?: string
  totalPomodoros: number
  completedPomodoros: number
  priority: EisenhowerMatrix
  deadline?: Date
  tags: string[]
  userId: string
  createdAt: Date
  updatedAt: Date
}

interface PomodoroSession {
  id: string
  taskId: string
  scheduledStart: Date
  actualStart?: Date
  actualEnd?: Date
  status: 'scheduled' | 'completed' | 'skipped' | 'missed'
}

interface Event {
  id: string
  title: string
  description?: string
  startTime: Date
  endTime: Date
  projectId?: string
  userId: string
  // 新增：與任務的關聯
  relatedTasks: string[]
}
```

### 2. 狀態管理重構

#### Context 結構優化
```typescript
// 統一的時間管理 Context
interface TimeManagementContext {
  // 任務管理
  tasks: Task[]
  addTask: (task: CreateTaskDTO) => Promise<void>
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>
  
  // 番茄鐘排程
  sessions: PomodoroSession[]
  scheduleTask: (taskId: string, autoSchedule?: boolean) => Promise<void>
  
  // 事件管理
  events: Event[]
  addEvent: (event: CreateEventDTO) => Promise<void>
  updateEvent: (id: string, updates: Partial<Event>) => Promise<void>
  
  // 智慧排程
  smartScheduler: SmartScheduler
  rebalanceSchedule: () => Promise<void>
}
```

### 3. 組件架構

#### 新組件結構
```
src/components/
├── time-management/     # 時間管理核心組件
│   ├── TodayFocusView.tsx
│   ├── PomodoroScheduler.tsx
│   ├── SmartScheduler.tsx
│   └── TimelineView.tsx
├── calendar/           # 增強的行事曆組件
│   ├── IntegratedCalendar.tsx
│   ├── CalendarItem.tsx
│   └── EventEditor.tsx
├── gantt/             # 重新設計的甘特圖
│   ├── FunctionalGantt.tsx
│   ├── TaskBar.tsx
│   └── GanttTimeline.tsx
├── task/              # 任務管理組件
│   ├── TaskCreator.tsx
│   ├── PrioritySelector.tsx
│   └── PomodoroEstimator.tsx
└── layout/            # 簡化的佈局組件
    ├── SimplifiedSidebar.tsx
    ├── UnifiedHeader.tsx
    └── ResponsiveLayout.tsx
```

---

## 🚀 實施計劃

### 階段一：核心邏輯重構 (2週)
1. **資料模型更新** - 實作新的 Task、Event、PomodoroSession 模型
2. **智慧排程器** - 實作基本的自動排程邏輯
3. **優先級系統** - 實作艾森豪威爾矩陣

### 階段二：UI/UX 重新設計 (3週)  
1. **今日焦點頁面** - 新的預設首頁
2. **統一任務創建** - 簡化的任務/事件創建流程
3. **響應式佈局** - 移動端優化

### 階段三：整合功能 (2週)
1. **整合行事曆** - 任務與事件的統一顯示
2. **功能性甘特圖** - 可互動的專案時間軸
3. **智慧提醒** - 防遺忘提醒系統

### 階段四：優化與測試 (1週)
1. **效能優化** - 大量資料處理優化
2. **使用者測試** - 收集反饋並調整
3. **錯誤修復** - 修復發現的問題

---

## 📊 成功指標

### 用戶體驗指標
- **任務遺忘率** - 目標：減少 80%
- **每日任務完成率** - 目標：提升至 85%
- **平均任務排程時間** - 目標：< 30 秒

### 系統效率指標  
- **頁面載入時間** - 目標：< 2 秒
- **操作響應時間** - 目標：< 200ms
- **離線可用性** - 目標：核心功能 100% 離線可用

### 功能使用率
- **今日焦點頁面** - 目標：成為 80% 用戶的預設首頁
- **智慧排程功能** - 目標：60% 的任務使用自動排程
- **番茄鐘完成率** - 目標：預定番茄鐘 70% 完成率

---

這個重新設計將徹底解決您提到的所有問題，建立一個真正以時間管理為核心、直觀易用的生產力系統。重點是讓系統主動幫助您管理時間，而不是被動等待您記住任務。