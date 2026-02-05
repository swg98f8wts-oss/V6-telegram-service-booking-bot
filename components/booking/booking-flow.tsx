'use client'

import { useState } from 'react'
import { Master, Service, Booking } from '@/lib/types'
import { usePlatform } from '@/hooks/use-platform'
import { MasterSelector } from './master-selector'
import { ServiceSelector } from './service-selector'
import { DateSelector } from './date-selector'
import { TimeSlotSelector } from './time-slot-selector'
import { BookingSummary } from './booking-summary'
import { MyBookings } from './my-bookings'
import { ChevronLeft, Calendar, CheckCircle, Loader2, Settings } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

type Step = 'master' | 'service' | 'date' | 'time' | 'confirm' | 'success'

export function BookingFlow() {
  const { user, platform, isReady } = usePlatform()
  const [step, setStep] = useState<Step>('master')
  const [selectedMaster, setSelectedMaster] = useState<Master | null>(null)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [booking, setBooking] = useState<Booking | null>(null)
  const [showMyBookings, setShowMyBookings] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleMasterSelect = (master: Master) => {
    setSelectedMaster(master)
    setSelectedService(null) // Reset service when master changes
    setStep('service')
  }

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service)
    setStep('date')
  }

  const handleDateSelect = (date: string) => {
    setSelectedDate(date)
    setSelectedTime(null)
    setStep('time')
  }

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time)
    setStep('confirm')
  }

  const handleBack = () => {
    setError(null)
    switch (step) {
      case 'service':
        setStep('master')
        break
      case 'date':
        setStep('service')
        break
      case 'time':
        setStep('date')
        break
      case 'confirm':
        setStep('time')
        break
      case 'success':
        resetFlow()
        break
    }
  }

  const resetFlow = () => {
    setStep('master')
    setSelectedMaster(null)
    setSelectedService(null)
    setSelectedDate(null)
    setSelectedTime(null)
    setBooking(null)
    setError(null)
  }

  const handleConfirm = async () => {
    if (!selectedMaster || !selectedService || !selectedDate || !selectedTime) {
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          masterId: selectedMaster.id,
          date: selectedDate,
          time: selectedTime,
          serviceId: selectedService.id,
          userId,
          userName,
          userUsername,
          userPlatform: platform,
          masterName: selectedMaster.name,
          serviceName: selectedService.name,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        setBooking(result)
        setStep('success')
      } else if (response.status === 409) {
        setError('Этот слот уже занят. Пожалуйста, выберите другое время.')
        setStep('time')
        setSelectedTime(null)
      } else {
        setError('Произошла ошибка. Попробуйте еще раз.')
      }
    } catch {
      setError('Произошла ошибка. Попробуйте еще раз.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (showMyBookings) {
    return <MyBookings userId={userId} onClose={() => setShowMyBookings(false)} />
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex items-center justify-between p-4">
          {step !== 'master' && step !== 'success' ? (
            <button
              onClick={handleBack}
              className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              Назад
            </button>
          ) : (
            <div />
          )}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowMyBookings(true)}
              className="flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg hover:bg-secondary transition-colors"
            >
              <Calendar className="w-4 h-4" />
              Мои записи
            </button>
            <Link
              href="/admin"
              className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground"
              title="Админ панель"
            >
              <Settings className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 p-4 pb-24">
        {step === 'success' && booking ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-xl font-semibold mb-2">Вы записаны!</h1>
            <p className="text-muted-foreground mb-6">
              {booking.serviceName} к мастеру {booking.masterName}
            </p>
            <div className="bg-card rounded-xl border p-4 w-full max-w-sm text-left mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-muted-foreground">Дата</span>
                <span className="font-medium">{booking.date}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Время</span>
                <span className="font-medium">{booking.time}</span>
              </div>
            </div>
            <button
              onClick={resetFlow}
              className="w-full max-w-sm py-3 rounded-xl bg-primary text-primary-foreground font-medium"
            >
              Записаться ещё
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Progress */}
            <div className="flex items-center gap-2">
              {['master', 'service', 'date', 'time', 'confirm'].map((s, i) => (
                <div
                  key={s}
                  className={cn(
                    'h-1 flex-1 rounded-full transition-colors',
                    ['master', 'service', 'date', 'time', 'confirm'].indexOf(step) >= i
                      ? 'bg-primary'
                      : 'bg-border'
                  )}
                />
              ))}
            </div>

            {/* Error message */}
            {error && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Step content */}
            {step === 'master' && (
              <MasterSelector
                selectedMaster={selectedMaster}
                onSelect={handleMasterSelect}
              />
            )}

            {step === 'service' && selectedMaster && (
              <ServiceSelector
                masterId={selectedMaster.id}
                selectedService={selectedService}
                onSelect={handleServiceSelect}
              />
            )}

            {step === 'date' && (
              <DateSelector
                selectedDate={selectedDate}
                onSelect={handleDateSelect}
              />
            )}

            {step === 'time' && selectedMaster && selectedDate && (
              <TimeSlotSelector
                masterId={selectedMaster.id}
                date={selectedDate}
                selectedTime={selectedTime}
                onSelect={handleTimeSelect}
              />
            )}

            {step === 'confirm' &&
              selectedMaster &&
              selectedService &&
              selectedDate &&
              selectedTime && (
                <BookingSummary
                  master={selectedMaster}
                  service={selectedService}
                  date={selectedDate}
                  time={selectedTime}
                />
              )}
          </div>
        )}
      </main>

      {/* Bottom action */}
      {step === 'confirm' && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t">
          <button
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-medium flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Записываем...
              </>
            ) : (
              'Подтвердить запись'
            )}
          </button>
        </div>
      )}
    </div>
  )
}
