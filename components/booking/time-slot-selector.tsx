'use client'

import { TimeSlot } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Clock } from 'lucide-react'
import useSWR from 'swr'

interface TimeSlotSelectorProps {
  masterId: string
  date: string
  selectedTime: string | null
  onSelect: (time: string) => void
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function TimeSlotSelector({
  masterId,
  date,
  selectedTime,
  onSelect,
}: TimeSlotSelectorProps) {
  const { data: slots, isLoading } = useSWR<TimeSlot[]>(
    `/api/slots?masterId=${masterId}&date=${date}`,
    fetcher,
    { refreshInterval: 10000 }
  )

  if (isLoading) {
    return (
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Выберите время
        </h2>
        <div className="grid grid-cols-3 gap-2">
          {[...Array(9)].map((_, i) => (
            <div
              key={i}
              className="h-12 rounded-lg bg-secondary animate-pulse"
            />
          ))}
        </div>
      </div>
    )
  }

  const availableSlots = slots?.filter((slot) => slot.status === 'available') || []
  const bookedSlots = slots?.filter((slot) => slot.status === 'booked') || []

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
        Выберите время
      </h2>
      {slots && slots.length > 0 ? (
        <div className="grid grid-cols-3 gap-2">
          {slots.map((slot) => {
            const isAvailable = slot.status === 'available'
            const isSelected = selectedTime === slot.time && isAvailable

            return (
              <button
                key={slot.id}
                onClick={() => isAvailable && onSelect(slot.time)}
                disabled={!isAvailable}
                className={cn(
                  'flex items-center justify-center gap-2 py-3 px-2 rounded-lg text-sm font-medium transition-all',
                  isSelected
                    ? 'bg-primary text-primary-foreground'
                    : isAvailable
                      ? 'bg-card border border-border hover:border-primary'
                      : 'bg-secondary/50 text-muted-foreground cursor-not-allowed'
                )}
              >
                <Clock className="w-4 h-4" />
                {slot.time}
              </button>
            )
          })}
        </div>
      ) : (
        <p className="text-muted-foreground text-center py-8">
          Нет доступных слотов на эту дату
        </p>
      )}
      {availableSlots.length > 0 && (
        <p className="text-xs text-muted-foreground text-center">
          Доступно {availableSlots.length} из {slots?.length || 0} слотов
        </p>
      )}
    </div>
  )
}
