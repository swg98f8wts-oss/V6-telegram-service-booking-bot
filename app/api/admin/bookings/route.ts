import { NextRequest, NextResponse } from 'next/server'
import { getAllBookings, adminCancelBooking, cleanupPastBookings } from '@/lib/booking-store'

export async function GET() {
  await cleanupPastBookings()
  const bookings = await getAllBookings()
  return NextResponse.json(bookings)
}

export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const bookingId = searchParams.get('bookingId')

  if (!bookingId) {
    return NextResponse.json({ error: 'Missing bookingId' }, { status: 400 })
  }

  const success = await adminCancelBooking(bookingId)

  if (!success) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}
