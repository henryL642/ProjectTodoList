import React from 'react'
import type { FilterType } from '../types/todo'

interface TodoFilterProps {
  currentFilter: FilterType
  onFilterChange: (filter: FilterType) => void
  activeCount: number
  completedCount: number
  onClearCompleted: () => void
}

export const TodoFilter: React.FC<TodoFilterProps> = ({
  currentFilter,
  onFilterChange,
  activeCount,
  completedCount,
  onClearCompleted,
}) => {
  const filters: { label: string; value: FilterType }[] = [
    { label: 'All', value: 'all' },
    { label: 'Active', value: 'active' },
    { label: 'Completed', value: 'completed' },
  ]

  return (
    <div className="todo-footer">
      <span className="todo-count">
        {activeCount} {activeCount === 1 ? 'item' : 'items'} left
      </span>

      <div className="filters">
        {filters.map(filter => (
          <button
            key={filter.value}
            onClick={() => onFilterChange(filter.value)}
            className={`filter-button ${
              currentFilter === filter.value ? 'active' : ''
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {completedCount > 0 && (
        <button onClick={onClearCompleted} className="clear-completed">
          Clear completed
        </button>
      )}
    </div>
  )
}
