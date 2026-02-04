'use client'

import useSWR from 'swr'
import { Master } from '@/lib/types'
import { cn } from '@/lib/utils'
import { User, Loader2 } from 'lucide-react'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface MasterSelectorProps {
  selectedMaster: Master | null
  onSelect: (master: Master) => void
}

export function MasterSelector({ selectedMaster, onSelect }: MasterSelectorProps) {
  const { data: masters, isLoading } = useSWR<Master[]>('/api/masters', fetcher)

  if (isLoading) {
    return (
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Выберите мастера
        </h2>
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (!masters || masters.length === 0) {
    return (
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Выберите мастера
        </h2>
        <p className="text-center text-muted-foreground py-8">
          Нет доступных мастеров
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
        Выберите мастера
      </h2>
      <div className="grid grid-cols-3 gap-3">
        {masters.map((master) => (
          <button
            key={master.id}
            onClick={() => onSelect(master)}
            className={cn(
              'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all',
              selectedMaster?.id === master.id
                ? 'border-primary bg-primary/5'
                : 'border-border bg-card hover:border-primary/50'
            )}
          >
            <div
              className={cn(
                'w-12 h-12 rounded-full flex items-center justify-center',
                selectedMaster?.id === master.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground'
              )}
            >
              <User className="w-6 h-6" />
            </div>
            <span className="text-sm font-medium text-center">{master.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
