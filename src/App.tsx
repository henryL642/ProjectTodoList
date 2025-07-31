import { useState, useEffect } from 'react'
import { MainLayout } from './components/layout/MainLayout'
import { AuthModal } from './components/auth/AuthModal'
import { MagicButton } from './components/MagicButton'
import { ThemeToggle } from './components/ThemeToggle'
import { UserProvider, useUser } from './context/UserContext'
import { ProjectProvider } from './context/ProjectContext'
import { AIProvider } from './context/AIContext'
import { PomodoroProvider } from './context/PomodoroContext'
import { CalendarProvider } from './context/CalendarContext'
import { SchedulingProvider } from './context/SchedulingContext'
import { preferencesManager } from './utils/preferencesManager'
import { autoBackupManager } from './utils/autoBackup'
import { autoMigrate } from './utils/dataMigration'
import './App.css'
import './styles/magic.css'
import './styles/layout.css'
import './styles/views.css'
import './styles/auto-backup.css'
import './styles/demo.css'
import './styles/scheduling.css'
import './styles/today-focus.css'
import './styles/event-edit-modal.css'

function TodoApp() {
  const { isAuthenticated } = useUser()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')

  // 初始化偏好設定管理器、自動備份和數據遷移
  useEffect(() => {
    preferencesManager.init()
    
    // 自動遷移數據到新格式
    autoMigrate({ verbose: true })
    
    // 初始化自動備份管理器（已經是單例，會自動啟動）
  }, [])

  const handleLoginClick = () => {
    setAuthMode('login')
    setShowAuthModal(true)
  }

  const handleRegisterClick = () => {
    setAuthMode('register')
    setShowAuthModal(true)
  }

  if (!isAuthenticated) {
    return (
      <div className="app">
        <header className="app-header">
          <div className="header-content">
            <h1>✨ 魔法待辦清單</h1>
            <ThemeToggle />
          </div>
        </header>

        <main className="auth-container">
          <div className="welcome-section">
            <h2>歡迎使用魔法待辦清單</h2>
            <p>管理您的任務，提升生產力</p>
            
            <div className="auth-buttons">
              <MagicButton
                onClick={handleLoginClick}
                variant="primary"
                size="large"
              >
                登錄
              </MagicButton>
              
              <MagicButton
                onClick={handleRegisterClick}
                variant="secondary"
                size="large"
              >
                註冊
              </MagicButton>
            </div>
          </div>
        </main>

        <footer className="app-footer">
          <p>使用 TDD 方法與魔法 UI 組件構建 ✨</p>
        </footer>

        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          initialMode={authMode}
        />
      </div>
    )
  }

  // 用戶已登錄，顯示主應用界面
  return <MainLayout />
}

function ProductivityProviders({ children, userId }: { children: React.ReactNode; userId: string }) {
  return (
    <AIProvider userId={userId}>
      <PomodoroProvider userId={userId}>
        <CalendarProvider userId={userId}>
          <SchedulingProvider>
            {children}
          </SchedulingProvider>
        </CalendarProvider>
      </PomodoroProvider>
    </AIProvider>
  )
}

function AppWithProviders() {
  const { user } = useUser()
  
  return (
    <ProjectProvider>
      {user ? (
        <ProductivityProviders userId={user.id}>
          <TodoApp />
        </ProductivityProviders>
      ) : (
        <TodoApp />
      )}
    </ProjectProvider>
  )
}

function App() {
  return (
    <UserProvider>
      <AppWithProviders />
    </UserProvider>
  )
}

export default App
