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

    // ❌ запрещаем запись из обычного браузера
    if (!userPlatform || userPlatform === 'web') {
      return NextResponse.json(
        { error: 'Web booking is not allowed' },
        { status: 400 }
      )
    }

    // базовая валидация (username НЕ обязателен)
    if (
      !masterId ||
      !date ||
      !time ||
      !serviceId ||
      !userId ||
      !userName ||
      !masterName ||
      !serviceName
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // username может отсутствовать (VK)
    const safeUsername =
      userUsername && userUsername.length > 0
        ? userUsername
        : '${userPlatform}_${userId}'

    const booking = await bookSlot(
      masterId,
      date,
      time,
      serviceId,
      userId,
      userName,
      safeUsername,
      userPlatform,
      masterName,
      serviceName
    )

    if (!booking) {
      return NextResponse.json(
        { error: 'Slot is not available' },
        { status: 409 }
      )
    }

    return NextResponse.json(booking)
  } catch (error) {
    console.error('BOOKING ERROR:', error)

    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    )
  }
}
