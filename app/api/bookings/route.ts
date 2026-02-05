import { NextRequest, NextResponse } from 'next/server'
import { getUserBookings, cancelBooking, cleanupPastBookings } from '@/lib/booking-store'

export async function GET(request: NextRequest) {
  await cleanupPastBookings()
  const searchParams = request.nextUrl.searchParams
  const userId = searchParams.get('userId')

  if (!userId) {
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
  }

  const bookings = await getUserBookings(userId)

  return NextResponse.json(bookings)
}

export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const bookingId = searchParams.get('bookingId')
  const userId = searchParams.get('userId')

  if (!bookingId || !userId) {
    return NextResponse.json({ error: 'Missing bookingId or userId' }, { status: 400 })
  }

  const success = await cancelBooking(bookingId, userId)

  if (!success) {
    return NextResponse.json({ error: 'Booking not found or not authorized' }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}
