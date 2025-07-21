import React from 'react'
import { PomodoroWidget } from '../productivity/PomodoroWidget'

interface FocusViewProps {
  onNavigateToSettings?: () => void
}

export const FocusView: React.FC<FocusViewProps> = ({ onNavigateToSettings }) => {
  return (
    <div className="focus-view">
      <div className="focus-view__container">
        <PomodoroWidget onNavigateToSettings={onNavigateToSettings} />
      </div>
    </div>
  )
}