import React from 'react'
import { AIInsightsPanel } from '../productivity/AIInsightsPanel'

export const AnalyticsView: React.FC = () => {
  return (
    <div className="analytics-view">
      <div className="analytics-view__container">
        <AIInsightsPanel />
      </div>
    </div>
  )
}