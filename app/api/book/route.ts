import { NextRequest, NextResponse } from 'next/server'
import { bookSlot } from '@/lib/booking-store'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      masterId,
      date,
      time,
      serviceId,
      userId,
      userName,
      userUsername,
      userPlatform,
      masterName,
      serviceName,
    } = body

    if (!masterId || !date || !time || !serviceId || !userId || !userName || !masterName || !serviceName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const booking = await bookSlot(
      masterId,
      date,
      time,
      serviceId,
      userId,
      userName,
      userUsername || null,
      userPlatform || null,
      masterName,
      serviceName
    )

    if (!booking) {
      return NextResponse.json({ error: 'Slot is not available' }, { status: 409 })
    }

    return NextResponse.json(booking)
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
