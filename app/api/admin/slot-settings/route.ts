import { NextRequest, NextResponse } from 'next/server'
import { getSlotSettings, upsertSlotSettings, applySlotSettingsToFutureDates } from '@/lib/booking-store'

function isValidTime(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value)
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const masterId = searchParams.get('masterId')

  if (!masterId) {
    return NextResponse.json({ error: 'Missing masterId' }, { status: 400 })
  }

  const settings = await getSlotSettings(masterId)
  return NextResponse.json(settings)
}

export async function PUT(request: NextRequest) {
  const body = await request.json()
  const { masterId, startTime, endTime, intervalMinutes } = body || {}

  if (!masterId || !startTime || !endTime || !intervalMinutes) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  if (!isValidTime(startTime) || !isValidTime(endTime)) {
    return NextResponse.json({ error: 'Invalid time format' }, { status: 400 })
  }

  const interval = Number(intervalMinutes)
  if (!Number.isFinite(interval) || interval <= 0 || interval > 720) {
    return NextResponse.json({ error: 'Invalid interval' }, { status: 400 })
  }

  if (startTime > endTime) {
    return NextResponse.json({ error: 'Start time must be before end time' }, { status: 400 })
  }

  const settings = await upsertSlotSettings(masterId, startTime, endTime, interval)
  await applySlotSettingsToFutureDates(masterId, { settings, daysAhead: 30 })
  return NextResponse.json(settings)
}
