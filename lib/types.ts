export interface Master {
  id: string
  name: string
  serviceIds: string[] // Services this master can perform
}

export interface Service {
  id: string
  name: string
}

export type SlotStatus = 'available' | 'booked' | 'disabled'

export interface TimeSlot {
  id: string
  time: string
  status: SlotStatus
  masterId: string
  date: string
  bookedBy?: {
    oderId: string
    serviceId: string
  }
}

export interface Booking {
  id: string
  masterId: string
  masterName: string
  serviceId: string
  serviceName: string
  date: string
  time: string
  userId: string
  userName: string
  userUsername?: string | null
  userPlatform?: string | null
  createdAt: string
}

// Default services - these are constants
export const DEFAULT_SERVICES: Service[] = [
  { id: '1', name: 'Маникюр' },
  { id: '2', name: 'Педикюр' },
  { id: '3', name: 'Окрашивание' },
  { id: '4', name: 'Мужская стрижка' },
  { id: '5', name: 'Женская стрижка' },
]

// Default masters with all services
export const DEFAULT_MASTERS: Master[] = [
  { id: '1', name: 'Анна', serviceIds: ['1', '2', '3', '4', '5'] },
  { id: '2', name: 'Ирина', serviceIds: ['1', '2', '3', '4', '5'] },
  { id: '3', name: 'Олег', serviceIds: ['1', '2', '3', '4', '5'] },
]

export const TIME_SLOTS = [
  '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
]

// Re-export for backwards compatibility (will be dynamic from store)
export const SERVICES = DEFAULT_SERVICES
export const MASTERS = DEFAULT_MASTERS
