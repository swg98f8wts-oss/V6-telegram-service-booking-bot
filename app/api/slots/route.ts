import { NextRequest, NextResponse } from 'next/server'
import { getSlotsForDay } from '@/lib/booking-store'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const masterId = searchParams.get('masterId')
  const date = searchParams.get('date')

  if (!masterId || !date) {
    return NextResponse.json({ error: 'Missing masterId or date' }, { status: 400 })
  }

  const slots = await getSlotsForDay(masterId, date)
  
  // Filter out disabled slots and hide booking details for non-owners
  const publicSlots = slots
    .filter(slot => slot.status !== 'disabled')
    .map(slot => ({
      id: slot.id,
      time: slot.time,
      status: slot.status,
      masterId: slot.masterId,
      date: slot.date,
    }))

  return NextResponse.json(publicSlots)
}
