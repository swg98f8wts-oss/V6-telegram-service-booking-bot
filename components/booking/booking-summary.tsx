'use client'

import { Master, Service } from '@/lib/types'
import { Calendar, Clock, Scissors, User } from 'lucide-react'

interface BookingSummaryProps {
  master: Master
  service: Service
  date: string
  time: string
}

const MONTHS_RU_GEN = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
]

function formatDateRu(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  return `${day} ${MONTHS_RU_GEN[month - 1]} ${year}`
}

export function BookingSummary({ master, service, date, time }: BookingSummaryProps) {
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
        Подтверждение записи
      </h2>
      <div className="bg-card rounded-xl border p-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
            <User className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Мастер</p>
            <p className="font-medium">{master.name}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
            <Scissors className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Услуга</p>
            <p className="font-medium">{service.name}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Дата</p>
            <p className="font-medium">{formatDateRu(date)}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Время</p>
            <p className="font-medium">{time}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
