'use client'

import { useState, useCallback, useEffect } from 'react'
import useSWR, { mutate } from 'swr'
import { Master, Service, TimeSlot, Booking } from '@/lib/types'
import { cn } from '@/lib/utils'
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  X,
  Ban,
  Check,
  Loader2,
  Users,
  Clock,
  LogOut,
  Lock,
  ArrowLeft,
  UserCog,
  Plus,
  Pencil,
  Trash2,
} from 'lucide-react'
import Link from 'next/link'

const ADMIN_KEY = 'ggstj,>}%_228'
const ADMIN_SESSION_KEY = 'admin_session'
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000 // 1 day

const fetcher = (url: string) => fetch(url).then((res) => res.json())

function checkAdminSession(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const session = localStorage.getItem(ADMIN_SESSION_KEY)
    if (!session) return false
    const { timestamp } = JSON.parse(session)
    if (Date.now() - timestamp < SESSION_DURATION_MS) {
      return true
    }
    localStorage.removeItem(ADMIN_SESSION_KEY)
    return false
  } catch {
    return false
  }
}

function saveAdminSession(): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify({ timestamp: Date.now() }))
}

function clearAdminSession(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(ADMIN_SESSION_KEY)
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

function formatDisplayDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('ru-RU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

interface MasterFormProps {
  master?: Master
  onSave: (name: string) => void
  onCancel: () => void
}

function MasterForm({ master, onSave, onCancel }: MasterFormProps) {
  const [name, setName] = useState(master?.name || '')

  const handleSubmit = () => {
    if (!name.trim()) return
    onSave(name.trim())
  }

  return (
    <div className="bg-card rounded-xl border p-4 space-y-4">
      <div>
        <label className="text-sm text-muted-foreground mb-2 block">
          Имя мастера
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Введите имя"
          className="w-full px-4 py-3 rounded-xl border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
        />
      </div>

      <p className="text-xs text-muted-foreground">
        Услуги можно добавлять и удалять после сохранения мастера.
      </p>

      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 py-3 px-4 rounded-xl border bg-background font-medium hover:bg-secondary transition-colors"
        >
          Отмена
        </button>
        <button
          onClick={handleSubmit}
          disabled={!name.trim()}
          className="flex-1 py-3 px-4 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {master ? 'Сохранить' : 'Добавить'}
        </button>
      </div>
    </div>
  )
}

export function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [keyInput, setKeyInput] = useState('')
  const [authError, setAuthError] = useState(false)
  const [selectedMasterId, setSelectedMasterId] = useState<string | null>(null)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [activeTab, setActiveTab] = useState<'slots' | 'bookings' | 'masters'>('slots')
  const [editingMaster, setEditingMaster] = useState<Master | null>(null)
  const [isAddingMaster, setIsAddingMaster] = useState(false)
  const [newServiceNames, setNewServiceNames] = useState<Record<string, string>>({})
  const [showSlotSettings, setShowSlotSettings] = useState(false)
  const [slotStartTime, setSlotStartTime] = useState('10:00')
  const [slotEndTime, setSlotEndTime] = useState('18:00')
  const [slotInterval, setSlotInterval] = useState('60')
  const [slotSettingsError, setSlotSettingsError] = useState<string | null>(null)
  
  // Bookings filters
  const [filterMasterId, setFilterMasterId] = useState<string>('all')
  const [filterDate, setFilterDate] = useState<string>('')

  // Check session on mount
  useEffect(() => {
    if (checkAdminSession()) {
      setIsAuthenticated(true)
    }
  }, [])

  const handleLogin = () => {
    if (keyInput === ADMIN_KEY) {
      setIsAuthenticated(true)
      setAuthError(false)
      saveAdminSession()
    } else {
      setAuthError(true)
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setKeyInput('')
    clearAdminSession()
  }

  const dateStr = formatDate(currentDate)

  // Fetch masters and services for masters tab
  const { data: mastersData, isLoading: mastersLoading } = useSWR<{
    masters: Master[]
    servicesByMaster: Record<string, Service[]>
  }>(isAuthenticated ? '/api/admin/masters' : null, fetcher)

  const masters = mastersData?.masters || []
  const servicesByMaster = mastersData?.servicesByMaster || {}

  // Set default selected master when masters load
  useEffect(() => {
    if (masters.length > 0 && !selectedMasterId) {
      setSelectedMasterId(masters[0].id)
    }
  }, [masters, selectedMasterId])

  useEffect(() => {
    setShowSlotSettings(false)
    setSlotSettingsError(null)
    setSlotStartTime('10:00')
    setSlotEndTime('18:00')
    setSlotInterval('60')
  }, [selectedMasterId])

  const selectedMaster = masters.find((m) => m.id === selectedMasterId)

  const { data: slots, isLoading: slotsLoading } = useSWR<TimeSlot[]>(
    activeTab === 'slots' && selectedMasterId
      ? `/api/admin/slots?masterId=${selectedMasterId}&date=${dateStr}`
      : null,
    fetcher
  )

  const { data: slotSettings } = useSWR<{
    startTime: string
    endTime: string
    intervalMinutes: number
  }>(
    activeTab === 'slots' && selectedMasterId
      ? `/api/admin/slot-settings?masterId=${selectedMasterId}`
      : null,
    fetcher
  )

  const { data: bookings, isLoading: bookingsLoading } = useSWR<Booking[]>(
    activeTab === 'bookings' ? '/api/admin/bookings' : null,
    fetcher
  )

  useEffect(() => {
    if (!slotSettings) return
    setSlotStartTime(slotSettings.startTime)
    setSlotEndTime(slotSettings.endTime)
    setSlotInterval(String(slotSettings.intervalMinutes))
  }, [slotSettings, selectedMasterId])

  const goToPrevDay = () => {
    const prev = new Date(currentDate)
    prev.setDate(prev.getDate() - 1)
    setCurrentDate(prev)
  }

  const goToNextDay = () => {
    const next = new Date(currentDate)
    next.setDate(next.getDate() + 1)
    setCurrentDate(next)
  }

  const toggleSlot = useCallback(
    async (time: string) => {
      await fetch('/api/admin/slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          masterId: selectedMasterId,
          date: dateStr,
          time,
        }),
      })
      mutate(`/api/admin/slots?masterId=${selectedMasterId}&date=${dateStr}`)
    },
    [selectedMasterId, dateStr]
  )

  const handleSaveSlotSettings = useCallback(async () => {
    if (!selectedMasterId) return
    setSlotSettingsError(null)

    const response = await fetch('/api/admin/slot-settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        masterId: selectedMasterId,
        startTime: slotStartTime,
        endTime: slotEndTime,
        intervalMinutes: Number(slotInterval),
      }),
    })

    if (!response.ok) {
      const data = await response.json().catch(() => null)
      setSlotSettingsError(data?.error || 'Не удалось сохранить настройки')
      return
    }

    mutate(`/api/admin/slot-settings?masterId=${selectedMasterId}`)
    mutate(`/api/admin/slots?masterId=${selectedMasterId}&date=${dateStr}`)
    setShowSlotSettings(false)
  }, [selectedMasterId, slotStartTime, slotEndTime, slotInterval, dateStr])

  const cancelBooking = useCallback(async (bookingId: string) => {
    if (!confirm('Вы уверены, что хотите отменить эту запись?')) return

    await fetch(`/api/admin/bookings?bookingId=${bookingId}`, {
      method: 'DELETE',
    })
    mutate('/api/admin/bookings')
  }, [])

  const handleAddMaster = async (name: string) => {
    await fetch('/api/admin/masters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    mutate('/api/admin/masters')
    setIsAddingMaster(false)
  }

  const handleUpdateMaster = async (name: string) => {
    if (!editingMaster) return
    await fetch('/api/admin/masters', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editingMaster.id, name }),
    })
    mutate('/api/admin/masters')
    setEditingMaster(null)
  }

  const handleDeleteMaster = async (masterId: string) => {
    if (!confirm('Удалить мастера? Все его записи будут отменены.')) return
    await fetch(`/api/admin/masters?masterId=${masterId}`, {
      method: 'DELETE',
    })
    mutate('/api/admin/masters')
    if (selectedMasterId === masterId) {
      setSelectedMasterId(null)
    }
  }

  const handleAddService = useCallback(async (masterId: string) => {
    const name = (newServiceNames[masterId] || '').trim()
    if (!name) return

    await fetch('/api/admin/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ masterId, name }),
    })
    mutate('/api/admin/masters')
    setNewServiceNames((prev) => ({ ...prev, [masterId]: '' }))
  }, [newServiceNames])

  const handleDeleteService = useCallback(async (serviceId: string) => {
    if (!confirm('Удалить услугу?')) return

    await fetch(`/api/admin/services?serviceId=${serviceId}`, {
      method: 'DELETE',
    })
    mutate('/api/admin/masters')
  }, [])

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="p-4 flex items-center gap-3">
            <Link
              href="/"
              className="p-2 -ml-2 rounded-lg hover:bg-secondary transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-lg font-semibold">Вход в панель</h1>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-sm space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-secondary rounded-full flex items-center justify-center mb-4">
                <Lock className="w-8 h-8 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Панель администратора</h2>
              <p className="text-sm text-muted-foreground">
                Введите ключ доступа для входа
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <input
                  type="password"
                  value={keyInput}
                  onChange={(e) => {
                    setKeyInput(e.target.value)
                    setAuthError(false)
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  placeholder="Ключ доступа"
                  className={cn(
                    'w-full px-4 py-3 rounded-xl border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all',
                    authError && 'border-destructive focus:ring-destructive/20'
                  )}
                />
                {authError && (
                  <p className="text-sm text-destructive mt-2">
                    Неверный ключ доступа
                  </p>
                )}
              </div>

              <button
                onClick={handleLogin}
                className="w-full py-3 px-4 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
              >
                Войти
              </button>

              <Link
                href="/"
                className="block text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Вернуться к записи
              </Link>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 -ml-2 rounded-lg hover:bg-secondary transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-lg font-semibold">Панель администратора</h1>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            title="Выйти"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('slots')}
            className={cn(
              'flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors',
              activeTab === 'slots'
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground'
            )}
          >
            <Clock className="w-4 h-4" />
            Слоты
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            className={cn(
              'flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors',
              activeTab === 'bookings'
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground'
            )}
          >
            <Users className="w-4 h-4" />
            Записи
          </button>
          <button
            onClick={() => setActiveTab('masters')}
            className={cn(
              'flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors',
              activeTab === 'masters'
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground'
            )}
          >
            <UserCog className="w-4 h-4" />
            Мастера
          </button>
        </div>
      </header>

      <main className="flex-1 p-4">
        {activeTab === 'slots' && (
          <div className="space-y-4">
            {/* Master selector */}
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">
                Мастер
              </label>
              {mastersLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : masters.length === 0 ? (
                <p className="text-sm text-muted-foreground">Нет мастеров</p>
              ) : (
                <div className="flex gap-2 flex-wrap">
                  {masters.map((master) => (
                    <button
                      key={master.id}
                      onClick={() => setSelectedMasterId(master.id)}
                      className={cn(
                        'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                        selectedMasterId === master.id
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-secondary-foreground'
                      )}
                    >
                      {master.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedMasterId && (
              <>
                {/* Date navigation */}
                <div className="flex items-center justify-between bg-card rounded-xl border p-3">
                  <button
                    onClick={goToPrevDay}
                    className="p-2 rounded-lg hover:bg-secondary transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{formatDisplayDate(dateStr)}</span>
                  </div>
                  <button
                    onClick={goToNextDay}
                    className="p-2 rounded-lg hover:bg-secondary transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                {/* Slots grid */}
                <div>
                  <h2 className="text-sm text-muted-foreground mb-3">
                    Слоты для {selectedMaster?.name}
                  </h2>

                  {slotsLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {slots?.map((slot) => (
                        <button
                          key={slot.id}
                          onClick={() =>
                            slot.status !== 'booked' && toggleSlot(slot.time)
                          }
                          disabled={slot.status === 'booked'}
                          className={cn(
                            'p-3 rounded-xl border text-sm font-medium transition-all flex flex-col items-center gap-1',
                            slot.status === 'available' &&
                              'bg-card hover:bg-secondary border-border',
                            slot.status === 'booked' &&
                              'bg-primary/10 border-primary/30 cursor-not-allowed',
                            slot.status === 'disabled' &&
                              'bg-destructive/10 border-destructive/30 text-destructive'
                          )}
                        >
                          <span>{slot.time}</span>
                          <span className="text-xs">
                            {slot.status === 'available' && (
                              <span className="flex items-center gap-1 text-muted-foreground">
                                <Check className="w-3 h-3" /> Доступен
                              </span>
                            )}
                            {slot.status === 'booked' && (
                              <span className="flex items-center gap-1 text-primary">
                                <Users className="w-3 h-3" /> Занят
                              </span>
                            )}
                            {slot.status === 'disabled' && (
                              <span className="flex items-center gap-1">
                                <Ban className="w-3 h-3" /> Закрыт
                              </span>
                            )}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground mt-4 text-center">
                    Нажмите на слот, чтобы закрыть/открыть его для записи
                  </p>

                  <div className="mt-4">
                    <button
                      onClick={() => setShowSlotSettings((prev) => !prev)}
                      className="w-full py-2 rounded-lg border bg-background text-sm font-medium hover:bg-secondary transition-colors"
                    >
                      Настроить слоты
                    </button>
                  </div>

                  {showSlotSettings && (
                    <div className="mt-4 bg-card rounded-xl border p-4 space-y-3">
                      <h3 className="text-sm font-medium">Настройки слотов</h3>

                      {slotSettingsError && (
                        <div className="bg-destructive/10 text-destructive text-xs p-2 rounded-lg">
                          {slotSettingsError}
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">
                            Начало
                          </label>
                          <input
                            type="time"
                            value={slotStartTime}
                            onChange={(e) => setSlotStartTime(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">
                            Конец
                          </label>
                          <input
                            type="time"
                            value={slotEndTime}
                            onChange={(e) => setSlotEndTime(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">
                            Интервал (мин)
                          </label>
                          <input
                            type="number"
                            min="5"
                            max="720"
                            step="5"
                            value={slotInterval}
                            onChange={(e) => setSlotInterval(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                          />
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowSlotSettings(false)}
                          className="flex-1 py-2 rounded-lg border bg-background text-sm font-medium hover:bg-secondary transition-colors"
                        >
                          Отмена
                        </button>
                        <button
                          onClick={handleSaveSlotSettings}
                          className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                        >
                          Сохранить
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'bookings' && (
          <div className="space-y-4">
            <h2 className="text-sm text-muted-foreground">Все записи</h2>

            {/* Filters */}
            <div className="bg-card rounded-xl border p-4 space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Master filter */}
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground mb-1.5 block">
                    Мастер
                  </label>
                  <select
                    value={filterMasterId}
                    onChange={(e) => setFilterMasterId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="all">Все мастера</option>
                    {masters.map((master) => (
                      <option key={master.id} value={master.id}>
                        {master.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date filter */}
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground mb-1.5 block">
                    Дата
                  </label>
                  <input
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              {/* Clear filters */}
              {(filterMasterId !== 'all' || filterDate) && (
                <button
                  onClick={() => {
                    setFilterMasterId('all')
                    setFilterDate('')
                  }}
                  className="text-xs text-primary hover:underline"
                >
                  Сбросить фильтры
                </button>
              )}
            </div>

            {(() => {
              if (bookingsLoading) {
                return (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                )
              }
              
              const filteredBookings = (bookings || [])
                .filter((booking) => {
                  if (filterMasterId !== 'all' && booking.masterId !== filterMasterId) {
                    return false
                  }
                  if (filterDate && booking.date !== filterDate) {
                    return false
                  }
                  return true
                })
                .sort((a, b) => {
                  // Sort by date descending, then by time
                  const dateCompare = b.date.localeCompare(a.date)
                  if (dateCompare !== 0) return dateCompare
                  return a.time.localeCompare(b.time)
                })

              if (filteredBookings.length === 0) {
                const hasFilters = filterMasterId !== 'all' || filterDate
                return (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground">
                      {hasFilters ? 'Нет записей по выбранным фильтрам' : 'Нет активных записей'}
                    </p>
                  </div>
                )
              }

              return (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Найдено записей: {filteredBookings.length}
                  </p>
                  {filteredBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="bg-card rounded-xl border p-4"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-medium">{booking.serviceName}</p>
                          <p className="text-sm text-muted-foreground">
                            Мастер: {booking.masterName}
                          </p>
                        </div>
                        <button
                          onClick={() => cancelBooking(booking.id)}
                          className="p-2 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
                          title="Отменить запись"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex gap-4 text-sm">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          {formatDisplayDate(booking.date)}
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          {booking.time}
                        </div>
                      </div>
                      <div className="mt-2 pt-2 border-t text-xs text-muted-foreground">
                        Клиент: {booking.userName}
                        {booking.userUsername ? ` (${booking.userUsername})` : ''}
                      </div>
                    </div>
                  ))}
                </div>
              )
            })()}
          </div>
        )}

        {activeTab === 'masters' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm text-muted-foreground">Управление мастерами</h2>
              {!isAddingMaster && !editingMaster && (
                <button
                  onClick={() => setIsAddingMaster(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Добавить
                </button>
              )}
            </div>

            {mastersLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {isAddingMaster && (
                  <MasterForm
                    onSave={handleAddMaster}
                    onCancel={() => setIsAddingMaster(false)}
                  />
                )}

                {editingMaster && (
                  <MasterForm
                    master={editingMaster}
                    onSave={handleUpdateMaster}
                    onCancel={() => setEditingMaster(null)}
                  />
                )}

                {!isAddingMaster && !editingMaster && (
                  <div className="space-y-3">
                    {masters.length === 0 ? (
                      <div className="text-center py-12">
                        <UserCog className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                        <p className="text-muted-foreground">Нет мастеров</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Добавьте первого мастера
                        </p>
                      </div>
                    ) : (
                      masters.map((master) => {
                        const masterServices = servicesByMaster[master.id] || []
                        return (
                          <div
                            key={master.id}
                            className="bg-card rounded-xl border p-4"
                          >
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <p className="font-medium text-lg">{master.name}</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {masterServices.length > 0
                                    ? masterServices.map((s) => s.name).join(', ')
                                    : 'Нет услуг'}
                                </p>
                              </div>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => setEditingMaster(master)}
                                  className="p-2 rounded-lg hover:bg-secondary transition-colors"
                                  title="Редактировать"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteMaster(master.id)}
                                  className="p-2 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
                                  title="Удалить"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {masterServices.map((service) => (
                                <button
                                  key={service.id}
                                  onClick={() => handleDeleteService(service.id)}
                                  className="px-2 py-1 bg-secondary rounded-md text-xs flex items-center gap-1 hover:bg-destructive/10 transition-colors"
                                  title="Удалить услугу"
                                >
                                  {service.name}
                                  <X className="w-3 h-3 text-muted-foreground" />
                                </button>
                              ))}
                            </div>
                            <div className="mt-3 flex gap-2">
                              <input
                                type="text"
                                value={newServiceNames[master.id] || ''}
                                onChange={(e) =>
                                  setNewServiceNames((prev) => ({
                                    ...prev,
                                    [master.id]: e.target.value,
                                  }))
                                }
                                placeholder="Новая услуга"
                                className="flex-1 px-3 py-2 rounded-lg border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                              />
                              <button
                                onClick={() => handleAddService(master.id)}
                                disabled={!newServiceNames[master.id]?.trim()}
                                className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                              >
                                Добавить
                              </button>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
