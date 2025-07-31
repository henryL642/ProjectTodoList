/**
 * MVP 功能驗證快速檢查腳本
 * 在瀏覽器控制台中執行
 */

console.log('🚀 開始 MVP 功能驗證...');

// 1. 檢查資料模型
function validateDataModel() {
  console.log('\n📊 檢查資料模型...');
  
  // 檢查 Priority 枚舉
  try {
    const todos = JSON.parse(localStorage.getItem('magic-todos') || '[]');
    console.log('✅ 找到', todos.length, '個待辦事項');
    
    // 檢查新欄位
    const hasNewFields = todos.some(todo => 
      todo.hasOwnProperty('priority') && 
      todo.hasOwnProperty('totalPomodoros') && 
      todo.hasOwnProperty('completedPomodoros')
    );
    
    if (hasNewFields) {
      console.log('✅ 新資料模型欄位存在');
    } else {
      console.log('⚠️ 部分待辦事項可能需要資料遷移');
    }
    
    // 顯示優先級分布
    const priorityCount = todos.reduce((acc, todo) => {
      acc[todo.priority] = (acc[todo.priority] || 0) + 1;
      return acc;
    }, {});
    
    console.log('📈 優先級分布:', priorityCount);
    
  } catch (error) {
    console.error('❌ 資料模型檢查失敗:', error);
  }
}

// 2. 檢查排程資料
function validateScheduling() {
  console.log('\n⏰ 檢查排程資料...');
  
  try {
    const slots = JSON.parse(localStorage.getItem('scheduled-slots') || '[]');
    console.log('✅ 找到', slots.length, '個排程時段');
    
    if (slots.length > 0) {
      const today = new Date().toDateString();
      const todaySlots = slots.filter(slot => 
        new Date(slot.date).toDateString() === today
      );
      console.log('📅 今日排程:', todaySlots.length, '個時段');
      
      // 檢查時間格式
      const validTimeFormat = todaySlots.every(slot => 
        /^\d{2}:\d{2}$/.test(slot.startTime)
      );
      
      if (validTimeFormat) {
        console.log('✅ 時間格式正確');
      } else {
        console.log('❌ 時間格式有問題');
      }
    }
    
  } catch (error) {
    console.error('❌ 排程資料檢查失敗:', error);
  }
}

// 3. 檢查頁面元素
function validateUIElements() {
  console.log('\n🎨 檢查 UI 元素...');
  
  // 檢查今日焦點頁面元素
  const todayFocusElements = {
    '今日焦點標題': document.querySelector('h1:contains("今日焦點")'),
    '進度條': document.querySelector('.progress-bar-container'),
    '緊急任務區塊': document.querySelector('.urgent-tasks-section'),
    '時間軸容器': document.querySelector('.timeline-view'),
    '衝突管理器': document.querySelector('.timeline-conflict-manager')
  };
  
  Object.entries(todayFocusElements).forEach(([name, element]) => {
    if (element) {
      console.log('✅', name, '存在');
    } else {
      console.log('❌', name, '缺失');
    }
  });
}

// 4. 檢查功能運作
function validateFunctionality() {
  console.log('\n⚙️ 檢查功能運作...');
  
  // 檢查快速操作按鈕
  const smartScheduleBtn = document.querySelector('button:contains("智能排程")');
  if (smartScheduleBtn) {
    console.log('✅ 智能排程按鈕存在');
    console.log('💡 可以點擊測試排程功能');
  } else {
    console.log('❌ 找不到智能排程按鈕');
  }
  
  // 檢查時間軸狀態按鈕
  const statusButtons = document.querySelectorAll('.status-btn');
  if (statusButtons.length > 0) {
    console.log('✅ 找到', statusButtons.length, '個狀態操作按鈕');
  } else {
    console.log('⚠️ 沒有發現狀態操作按鈕（可能沒有當前任務）');
  }
}

// 5. 測試衝突檢測
function testConflictDetection() {
  console.log('\n🚨 測試衝突檢測...');
  
  // 創建測試衝突
  const testConflicts = [
    { id: '1', time: '10:00', task: { title: '測試任務A' }, status: 'scheduled' },
    { id: '2', time: '10:15', task: { title: '測試任務B' }, status: 'scheduled' }
  ];
  
  console.log('💡 可以在控制台中手動測試：');
  console.log('// 創建衝突測試資料');
  console.log('window.testConflicts =', JSON.stringify(testConflicts, null, 2));
  
  // 儲存到 window 供手動測試
  window.testConflicts = testConflicts;
}

// 執行所有驗證
function runAllValidations() {
  validateDataModel();
  validateScheduling();
  validateUIElements();
  validateFunctionality();
  testConflictDetection();
  
  console.log('\n🎯 驗證總結：');
  console.log('📋 請檢查上方各項目的狀態');
  console.log('🔧 如有 ❌ 項目，請檢查對應功能');
  console.log('💡 可以手動測試互動功能');
  
  console.log('\n📖 建議測試流程：');
  console.log('1. 創建新任務（不同優先級）');
  console.log('2. 點擊「智能排程」');
  console.log('3. 觀察時間軸顯示');
  console.log('4. 測試狀態變更按鈕');
  console.log('5. 檢查衝突警示');
}

// 自動執行驗證
runAllValidations();

// 提供手動測試函數
window.mvpValidation = {
  dataModel: validateDataModel,
  scheduling: validateScheduling,
  ui: validateUIElements,
  functionality: validateFunctionality,
  conflicts: testConflictDetection,
  all: runAllValidations
};

console.log('\n🎮 手動測試指令：');
console.log('mvpValidation.all() - 重新執行所有驗證');
console.log('mvpValidation.dataModel() - 只檢查資料模型');
console.log('mvpValidation.scheduling() - 只檢查排程');
console.log('mvpValidation.ui() - 只檢查 UI 元素');