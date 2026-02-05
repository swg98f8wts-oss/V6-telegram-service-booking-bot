import { NextRequest, NextResponse } from 'next/server'
import { bookSlot } from '@/lib/booking-store'

export async function POST(request: NextRequest) {
  const body = await request.json()

  console.log('📩 BOOK REQUEST BODY:', body)

  const masterId = body.masterId
  const date = body.date
  const time = body.time
  const serviceId = body.serviceId
  const masterName = body.masterName
  const serviceName = body.serviceName

  const userId = body.userId ?? body.user?.id
  const userName =
    body.userName ??
    body.user?.name ??
    body.user?.first_name

  const userUsername =
    body.userUsername ??
    body.username ??
    body.user?.username ??
    null

  const userPlatform =
    body.userPlatform ??
    body.platform ??
    null

  console.log('👤 USER:', {
    userId,
    userName,
    userUsername,
    userPlatform,
  })

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
    console.error('❌ VALIDATION FAILED')
    return NextResponse.json(
      { error: 'Missing required fields', debug: body },
      { status: 400 }
    )
  }

  const safeUsername =
    userUsername && userUsername.length > 0
      ? userUsername
      : `${userPlatform}_${userId}`

  console.log('📦 BOOKING CALL PARAMS:', {
    masterId,
    date,
    time,
    serviceId,
    userId,
    userName,
    safeUsername,
    userPlatform,
    masterName,
    serviceName,
  })

  // ❗ ВАЖНО: НЕ ЛОВИМ ОШИБКУ
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

  console.log('✅ BOOKING RESULT:', booking)

  return NextResponse.json(booking)
}
