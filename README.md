# 魔法待辦清單 ✨ ProjectTodoList

[![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?logo=vite)](https://vitejs.dev/)
[![Vercel](https://img.shields.io/badge/Vercel-000000?logo=vercel)](https://vercel.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

一個功能豐富、現代化的待辦清單應用程序，具有高級項目管理、番茄鐘技術、AI洞察和數據管理功能。

## 🌐 在線演示

**🚀 [立即體驗 Live Demo](https://todo-list-rho-black.vercel.app)**

*部署在 Vercel 上，支持自動部署和 CDN 全球加速*

**🆕 最新更新 (2025-07-22)**
- ✅ 數據導入功能已修復
- ✅ 組件同步優化完成  
- ✅ 用戶體驗全面提升

## 🎯 功能特色

### 📋 核心功能
- **智能任務管理** - 創建、編輯、刪除和組織任務
- **項目分組** - 按項目分類管理任務
- **優先級系統** - 高/中/低優先級設定
- **截止日期提醒** - 日期追蹤和提醒功能
- **進度統計** - 實時任務完成率和統計

### 🍅 生產力工具
- **番茄鐘計時器** - 專注工作時間管理
- **工作/休息循環** - 可自定義的工作和休息時間
- **健康提醒** - 定期休息和姿勢提醒
- **音效通知** - 各階段音效提醒
- **浮動計時器** - 全局可見的計時器小部件

### 📅 日程管理
- **集成日曆** - 月視圖日曆顯示
- **事件管理** - 創建和管理日程事件
- **提醒系統** - 自動提醒和通知
- **甘特圖視圖** - 項目時間線可視化

### 🤖 AI驅動洞察
- **智能分析** - AI驅動的任務和項目分析
- **生產力洞察** - 工作模式和效率建議
- **趨勢預測** - 基於歷史數據的趨勢分析
- **個性化建議** - 針對用戶習慣的優化建議

### ⚙️ 高級設置
- **個人資料管理** - 用戶信息和偏好設置
- **主題切換** - 深色/淺色模式
- **語言支持** - 多語言界面（繁中/簡中/英文）
- **通知控制** - 靈活的通知設置
- **數據管理** - 導入/導出功能

### 💾 數據管理
- **本地存儲** - 數據在本地安全存儲
- **導入/導出** - JSON/CSV格式數據交換
- **備份功能** - 數據備份和恢復
- **統計報告** - 詳細的使用統計

## 🚀 技術棧

- **Frontend**: React 19, TypeScript
- **Build Tool**: Vite 6.0
- **Styling**: CSS3, CSS Custom Properties
- **State Management**: React Context API
- **Persistence**: LocalStorage
- **Testing**: Vitest, React Testing Library
- **Code Quality**: ESLint, Prettier

## 🎨 設計特色

- **響應式設計** - 支持桌面和移動設備
- **無障礙支持** - WCAG 2.1 AA標準
- **Magic UI組件** - 自定義動畫和交互
- **直觀導航** - 清晰的用戶界面設計
- **視覺反饋** - 豐富的狀態指示器

## 📦 快速開始

### 🌐 線上試用
直接訪問 **[Live Demo](https://todo-list-rho-black.vercel.app)** 立即開始使用，無需安裝！

### 💻 本地開發

#### 環境要求
- Node.js 18.0+
- npm 9.0+ 或 yarn 1.22+

#### 安裝與運行

```bash
# 克隆倉庫
git clone https://github.com/henryL642/ProjectTodoList.git
cd ProjectTodoList

# 安裝依賴
npm install

# 啟動開發服務器
npm run dev

# 構建生產版本
npm run build

# 運行測試
npm run test

# 代碼檢查
npm run lint
```

## 🏗️ 項目結構

```
src/
├── components/          # React組件
│   ├── auth/           # 用戶認證組件
│   ├── calendar/       # 日曆相關組件
│   ├── layout/         # 佈局組件
│   ├── productivity/   # 生產力工具組件
│   ├── project/        # 項目管理組件
│   ├── settings/       # 設置組件
│   ├── todo/           # 待辦事項組件
│   └── views/          # 頁面視圖組件
├── context/            # React Context API
├── hooks/              # 自定義Hooks
├── styles/             # CSS樣式文件
├── types/              # TypeScript類型定義
├── utils/              # 工具函數
└── test/               # 測試文件
```

## 💡 使用指南

### 基本操作
1. **註冊/登錄** - 創建用戶帳戶開始使用
2. **創建項目** - 組織你的任務到不同項目中
3. **添加任務** - 使用快捷鍵 `Cmd+T` 快速添加任務
4. **設置優先級** - 為任務設置重要性級別
5. **設置截止日期** - 追蹤任務的時間要求

### 高級功能
- **番茄鐘工作法** - 點擊專注視圖開始計時
- **AI洞察** - 查看儀表板獲得智能建議
- **數據導出** - 在設置中備份你的數據
- **主題定制** - 選擇適合你的視覺主題

## 🔧 配置選項

### 偏好設置
- **外觀設定**: 主題、顏色方案、字體大小
- **任務設定**: 默認優先級、排序方式、顯示選項
- **番茄鐘設定**: 工作時長、休息時間、通知聲音
- **通知設定**: 瀏覽器通知、任務提醒、項目通知

## 🧪 測試

項目包含完整的測試套件：

```bash
# 運行所有測試
npm run test

# 測試覆蓋率
npm run test:coverage

# 監視模式
npm run test:watch
```

## 📈 性能優化

- **代碼分割**: 按路由和功能進行代碼分割
- **懶加載**: 組件和資源的懶加載
- **緩存策略**: 智能的數據緩存機制
- **bundle優化**: Vite的最佳化構建配置

## 🚀 部署

### Vercel 部署 (推薦)

項目已配置自動部署到 Vercel：

```bash
# 部署到 Vercel
npm install -g vercel
vercel --prod
```

### 其他平台

```bash
# 構建生產版本
npm run build

# 預覽構建結果
npm run preview
```

構建產物在 `dist` 目錄中，可部署到任何靜態網站託管服務。

## 🌍 國際化支持

- **繁體中文** (zh-TW)
- **簡體中文** (zh-CN) 
- **English** (en-US)

## 🤝 貢獻

歡迎提交問題和功能請求！如果你想貢獻代碼，請：

1. Fork 這個倉庫
2. 創建你的功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的修改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打開一個 Pull Request

## 📄 許可證

本項目基於 MIT 許可證 - 查看 [LICENSE](LICENSE) 文件了解詳情。

## 🙏 致謝

- **React Team** - 優秀的前端框架
- **Vite Team** - 快速的構建工具
- **TypeScript Team** - 強類型支持
- **Claude Code** - AI輔助開發工具

## 🚧 未來計劃

- [ ] 移動應用版本 (React Native)
- [ ] 雲端同步功能
- [ ] 團隊協作功能
- [ ] 更多AI功能
- [ ] PWA支持
- [ ] 更多導出格式

---

**🤖 Generated with [Claude Code](https://claude.ai/code)**

**Co-Authored-By: Claude <noreply@anthropic.com>**

[![GitHub stars](https://img.shields.io/github/stars/henryL642/ProjectTodoList?style=social)](https://github.com/henryL642/ProjectTodoList)
[![GitHub forks](https://img.shields.io/github/forks/henryL642/ProjectTodoList?style=social)](https://github.com/henryL642/ProjectTodoList)