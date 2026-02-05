'use client'

import { Booking } from '@/lib/types'
import { cn } from '@/lib/utils'
import {
  Calendar,
  Clock,
  X,
  AlertCircle,
} from 'lucide-react'
import useSWR, { mutate } from 'swr'
import { useState } from 'react'

interface MyBookingsProps {
  userId: string | number | null | undefined
  onClose: () => void
}

const fetcher = async (url: string) => {
  const res = await fetch(url)

  if (!res.ok) {
    throw new Error('Failed to fetch bookings')
  }

  const data = await res.json()

  return Array.isArray(data) ? data : []
}

const MONTHS_RU_GEN = [
  'января',
  'февраля',
  'марта',
  'апреля',
  'мая',
  'июня',
  'июля',
  'августа',
  'сентября',
  'октября',
  'ноября',
  'декабря',
]

function formatDateRu(dateStr?: string): string {
  if (!dateStr) return '—'

  const [year, month, day] = dateStr.split('-').map(Number)

  if (!day || !month) return '—'

  return '${day} ${MONTHS_RU_GEN[month - 1]}'
}

export function MyBookings({
  userId,
  onClose,
}: MyBookingsProps) {
  // ❗️ если пользователя нет — вообще не делаем запрос
  const shouldFetch = Boolean(userId)

  const {
    data: bookings = [],
    isLoading,
    error,
  } = useSWR<Booking[]>(
    shouldFetch
      ? /api/bookings?userId=${userId}
      : null,
    fetcher
  )

  const [cancelingId, setCancelingId] =
    useState<string | null>(null)
  const [confirmCancel, setConfirmCancel] =
    useState<string | null>(null)

  const handleCancel = async (bookingId: string) => {
    setCancelingId(bookingId)

    try {
      const response = await fetch(
        /api/bookings?bookingId=${bookingId}&userId=${userId},
        { method: 'DELETE' }
      )

      if (response.ok) {
        mutate(`/api/bookings?userId=${userId}`)
      }
    } finally {
      setCancelingId(null)
      setConfirmCancel(null)
    }
  }

  const isPast = (date?: string, time?: string) => {
    if (!date || !time) return false
    const bookingDate = new Date(`${date}T${time}`)
    return bookingDate < new Date()
  }

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      <header className="flex items-center justify-between p-4 border-b">
        <h1 className="text-lg font-semibold">
          Мои записи
        </h1>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-secondary transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-32 rounded-xl bg-secondary animate-pulse"
              />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12 text-muted-foreground">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Ошибка загрузки записей</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>У вас пока нет записей</p>
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map((booking) => {
              const past = isPast(
                booking.date,
                booking.time
              )

              return (
                <div
                  key={booking.id}
                  className={cn(
                    'bg-card rounded-xl border p-4',
                    past && 'opacity-60'
                  )}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="font-medium">
                        {booking.serviceName ??
                          booking.service_name ??
                          '—'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {booking.masterName ??
                          booking.master_name ??
                          '—'}
                      </p>
                    </div>

                    <span
                      className={cn(
                        'text-xs px-2 py-1 rounded-full',
                        past
                          ? 'bg-secondary text-muted-foreground'
                          : 'bg-primary/10 text-primary'
                      )}
                    >
                      {past ? 'Прошедшая' : 'Активная'}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      {formatDateRu(booking.date)}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      {booking.time ?? '—'}
                    </div>
                  </div>

                  {!past &&
                    (confirmCancel === booking.id ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            handleCancel(booking.id)
                          }
                          disabled={
                            cancelingId === booking.id
                          }
                          className="flex-1 py-2 px-3 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium"
                        >
                          {cancelingId === booking.id
                            ? 'Отмена...'
                            : 'Подтвердить отмену'}
                        </button>
                        <button
                          onClick={() =>
                            setConfirmCancel(null)
                          }
                          className="py-2 px-3 rounded-lg border text-sm font-medium"
                        >
                          Нет
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() =>
                          setConfirmCancel(booking.id)
                        }
                        className="w-full py-2 rounded-lg border border-destructive text-destructive text-sm font-medium hover:bg-destructive/5 transition-colors"
                      >
                        Отменить запись
                      </button>
                    ))}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
