'use client'

import useSWR from 'swr'
import { Service } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Scissors, Sparkles, Palette, Loader2 } from 'lucide-react'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface ServiceSelectorProps {
  masterId: string
  selectedService: Service | null
  onSelect: (service: Service) => void
}

function getServiceIcon(serviceName: string) {
  const name = serviceName.toLowerCase()
  if (name.includes('маникюр') || name.includes('педикюр')) {
    return <Sparkles className="w-5 h-5" />
  }
  if (name.includes('окраш')) {
    return <Palette className="w-5 h-5" />
  }
  return <Scissors className="w-5 h-5" />
}

export function ServiceSelector({ masterId, selectedService, onSelect }: ServiceSelectorProps) {
  const { data: services, isLoading } = useSWR<Service[]>(
    `/api/masters?masterId=${masterId}`,
    fetcher
  )

  if (isLoading) {
    return (
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Выберите услугу
        </h2>
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (!services || services.length === 0) {
    return (
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Выберите услугу
        </h2>
        <p className="text-center text-muted-foreground py-8">
          У этого мастера нет доступных услуг
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
        Выберите услугу
      </h2>
      <div className="space-y-2">
        {services.map((service) => (
          <button
            key={service.id}
            onClick={() => onSelect(service)}
            className={cn(
              'w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left',
              selectedService?.id === service.id
                ? 'border-primary bg-primary/5'
                : 'border-border bg-card hover:border-primary/50'
            )}
          >
            <div
              className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
                selectedService?.id === service.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground'
              )}
            >
              {getServiceIcon(service.name)}
            </div>
            <span className="font-medium">{service.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
