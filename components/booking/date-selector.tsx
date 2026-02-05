'use client'

import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState, useMemo } from 'react'

interface DateSelectorProps {
  selectedDate: string | null
  onSelect: (date: string) => void
}

const DAYS_RU = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']
const MONTHS_RU = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
]

function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function DateSelector({ selectedDate, onSelect }: DateSelectorProps) {
  const today = useMemo(() => new Date(), [])
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [currentYear, setCurrentYear] = useState(today.getFullYear())

  const maxDate = useMemo(() => {
    const max = new Date(today)
    max.setDate(max.getDate() + 30)
    return max
  }, [today])

  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1)
    const lastDay = new Date(currentYear, currentMonth + 1, 0)
    const startDayOfWeek = firstDay.getDay()
    
    const days: (Date | null)[] = []
    
    // Add empty slots for days before the first day of month
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null)
    }
    
    // Add all days of the month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push(new Date(currentYear, currentMonth, day))
    }
    
    return days
  }, [currentMonth, currentYear])

  const canGoPrev = currentYear > today.getFullYear() || 
    (currentYear === today.getFullYear() && currentMonth > today.getMonth())
  
  const canGoNext = currentYear < maxDate.getFullYear() || 
    (currentYear === maxDate.getFullYear() && currentMonth < maxDate.getMonth())

  const goToPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
  }

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
  }

  const isDateSelectable = (date: Date): boolean => {
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    return date >= todayStart && date <= maxDate
  }

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
        Выберите дату
      </h2>
      <div className="bg-card rounded-xl border p-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={goToPrevMonth}
            disabled={!canGoPrev}
            className={cn(
              'p-2 rounded-lg transition-colors',
              canGoPrev ? 'hover:bg-secondary' : 'opacity-30 cursor-not-allowed'
            )}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="font-semibold">
            {MONTHS_RU[currentMonth]} {currentYear}
          </span>
          <button
            onClick={goToNextMonth}
            disabled={!canGoNext}
            className={cn(
              'p-2 rounded-lg transition-colors',
              canGoNext ? 'hover:bg-secondary' : 'opacity-30 cursor-not-allowed'
            )}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        
        <div className="grid grid-cols-7 gap-1 mb-2">
          {DAYS_RU.map((day) => (
            <div
              key={day}
              className="text-center text-xs font-medium text-muted-foreground py-2"
            >
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((date, index) => {
            if (!date) {
              return <div key={`empty-${index}`} className="aspect-square" />
            }
            
            const dateStr = formatDate(date)
            const isSelected = selectedDate === dateStr
            const isSelectable = isDateSelectable(date)
            const isToday = formatDate(today) === dateStr
            
            return (
              <button
                key={dateStr}
                onClick={() => isSelectable && onSelect(dateStr)}
                disabled={!isSelectable}
                className={cn(
                  'aspect-square rounded-lg text-sm font-medium transition-all flex items-center justify-center',
                  isSelected
                    ? 'bg-primary text-primary-foreground'
                    : isSelectable
                      ? 'hover:bg-secondary'
                      : 'text-muted-foreground/40 cursor-not-allowed',
                  isToday && !isSelected && 'ring-1 ring-primary'
                )}
              >
                {date.getDate()}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
