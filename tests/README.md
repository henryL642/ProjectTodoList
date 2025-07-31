# 🧪 測試文件目錄

本目錄包含魔法待辦清單專案的各種測試文件，包括手動測試工具和自動化測試相關資源。

## 📁 目錄結構

```
tests/
├── README.md       # 本文件 - 測試目錄說明
└── manual/         # 手動測試工具
    ├── localStorage-test.html     # localStorage 功能測試
    └── test-persistence.html      # 專案持久化測試
```

## 🔧 手動測試工具

### 1. localStorage 測試 (`manual/localStorage-test.html`)
- **用途**: 測試瀏覽器 localStorage 功能是否正常
- **功能**:
  - 基本 localStorage 讀寫測試
  - JSON 數據存儲測試
  - 顯示當前 localStorage 中的所有數據
- **使用方法**: 直接在瀏覽器中打開此文件

### 2. 專案持久化測試 (`manual/test-persistence.html`)
- **用途**: 測試專案數據的本地存儲功能
- **功能**:
  - 創建測試專案並存儲到 localStorage
  - 顯示所有存儲的專案
  - 查看 localStorage 中的原始數據
  - 清空存儲數據
  - 監聽存儲變化事件
- **使用方法**: 直接在瀏覽器中打開此文件

## 📋 自動化測試

### 單元測試
自動化測試位於 `src/` 目錄下的 `__tests__` 子目錄中：
- `src/components/__tests__/` - 組件測試
- `src/hooks/__tests__/` - Hook 測試
- `src/context/__tests__/` - Context 測試
- `src/types/__tests__/` - 類型測試

### 測試命令
```bash
# 運行所有測試
npm run test

# 運行測試並顯示覆蓋率
npm run test:coverage

# 以監視模式運行測試
npm run test:watch

# 運行測試 UI
npm run test:ui
```

## 🎯 測試分類

### 功能測試
- **localStorage 功能**: 數據持久化能力
- **專案管理**: 專案 CRUD 操作
- **任務管理**: 任務增刪改查
- **用戶認證**: 登錄註冊流程

### 集成測試
- **組件交互**: 組件間的數據傳遞
- **狀態管理**: Context 和 Hook 的協作
- **數據流**: 完整的用戶操作流程

### 手動測試
- **瀏覽器兼容性**: 跨瀏覽器功能驗證
- **數據持久化**: localStorage 功能驗證
- **用戶體驗**: 界面操作流暢性

## 🔄 測試流程

### 開發階段
1. 編寫功能代碼
2. 編寫單元測試
3. 運行自動化測試
4. 使用手動測試工具驗證

### 部署前
1. 運行完整測試套件
2. 檢查測試覆蓋率
3. 進行手動回歸測試
4. 驗證關鍵功能

## 📝 添加新測試

### 添加手動測試工具
1. 在 `manual/` 目錄下創建 HTML 文件
2. 命名格式：`test-[功能名稱].html`
3. 更新本 README 文件

### 添加自動化測試
1. 在對應的 `__tests__/` 目錄下創建測試文件
2. 命名格式：`[組件名稱].test.tsx` 或 `[功能名稱].test.ts`
3. 使用 Vitest 和 React Testing Library

## 🚀 最佳實踐

1. **測試覆蓋率**: 保持 80% 以上的測試覆蓋率
2. **測試命名**: 使用描述性的測試名稱
3. **獨立性**: 確保測試之間相互獨立
4. **清理**: 測試後清理副作用（localStorage 等）
5. **文檔**: 為複雜測試添加註釋說明

## 🔍 故障排除

### 常見問題
- **localStorage 不工作**: 檢查瀏覽器設置和隱私模式
- **測試失敗**: 確認 Node.js 版本和依賴是否正確
- **覆蓋率不準確**: 清除測試緩存後重新運行

### 調試技巧
- 使用 `console.log()` 在測試中輸出調試信息
- 利用瀏覽器開發者工具檢查 localStorage
- 使用 Vitest UI 模式進行可視化調試

---

**最後更新**: 2025-07-31