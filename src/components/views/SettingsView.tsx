import React, { useState } from 'react'
import { UserProfile } from '../UserProfile'
import { DataManagement } from '../settings/DataManagement'
import { PreferencesSettings } from '../settings/PreferencesSettings'
import { NotificationSettingsComponent } from '../settings/NotificationSettings'
import { SimpleSchedulingDemo } from '../demo/SimpleSchedulingDemo'

interface SettingsViewProps {
  initialTab?: 'profile' | 'preferences' | 'notifications' | 'data' | 'demo'
}

export const SettingsView: React.FC<SettingsViewProps> = ({ initialTab = 'profile' }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'notifications' | 'data' | 'demo'>(initialTab)

  const tabs = [
    { id: 'profile', label: '個人資料', icon: '👤' },
    { id: 'preferences', label: '偏好設定', icon: '⚙️' },
    { id: 'notifications', label: '通知設定', icon: '🔔' },
    { id: 'data', label: '數據管理', icon: '📊' },
    { id: 'demo', label: '智慧排程演示', icon: '🍅' }
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="settings-tab">
            <UserProfile />
          </div>
        )
      case 'preferences':
        return (
          <div className="settings-tab">
            <PreferencesSettings />
          </div>
        )
      case 'notifications':
        return (
          <div className="settings-tab">
            <NotificationSettingsComponent />
          </div>
        )
      case 'data':
        return (
          <div className="settings-tab">
            <DataManagement />
          </div>
        )
      case 'demo':
        return (
          <div className="settings-tab">
            <SimpleSchedulingDemo />
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="settings-view">
      <div className="settings-view__header">
        <h2>⚙️ 設定</h2>
        <p>個性化您的魔法待辦清單體驗</p>
      </div>

      <div className="settings-view__content">
        <div className="settings-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`settings-tab__button ${activeTab === tab.id ? 'settings-tab__button--active' : ''}`}
              onClick={() => setActiveTab(tab.id as any)}
            >
              <span className="settings-tab__icon">{tab.icon}</span>
              <span className="settings-tab__label">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="settings-content">
          {renderTabContent()}
        </div>
      </div>
    </div>
  )
}