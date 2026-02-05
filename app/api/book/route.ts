import { NextRequest, NextResponse } from 'next/server'
import { bookSlot } from '@/lib/booking-store'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // принимаем оба варианта
    const masterId = body.masterId
    const date = body.date
    const time = body.time
    const serviceId = body.serviceId
    const masterName = body.masterName
    const serviceName = body.serviceName

    const userId =
      body.userId ?? body.user?.id ?? null

    const userName =
      body.userName ??
      body.user?.name ??
      body.user?.first_name ??
      null

    const userUsername =
      body.userUsername ??
      body.username ??
      body.user?.username ??
      null

    const userPlatform =
      body.userPlatform ??
      body.platform ??
      null

    // запрещаем web-запись
    if (!userPlatform || userPlatform === 'web') {
      return NextResponse.json(
        { error: 'Web booking is not allowed' },
        { status: 400 }
      )
    }

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
