import { NextRequest, NextResponse } from 'next/server'
import { getAdminSlotsForDay, toggleSlotDisabled } from '@/lib/booking-store'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const masterId = searchParams.get('masterId')
  const date = searchParams.get('date')

  if (!masterId || !date) {
    return NextResponse.json({ error: 'Missing masterId or date' }, { status: 400 })
  }

  const slots = await getAdminSlotsForDay(masterId, date)

  return NextResponse.json(slots)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { masterId, date, time } = body

  if (!masterId || !date || !time) {
    return NextResponse.json(
      { error: 'Missing masterId, date, or time' },
      { status: 400 }
    )
  }

  const slot = await toggleSlotDisabled(masterId, date, time)

  return NextResponse.json(slot)
}
