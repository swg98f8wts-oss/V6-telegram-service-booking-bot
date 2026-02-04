import { NextRequest, NextResponse } from 'next/server'
import { addServiceToMaster, deleteService } from '@/lib/booking-store'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { masterId, name } = body || {}

  if (!masterId || !name || !name.trim()) {
    return NextResponse.json(
      { error: 'Missing masterId or name' },
      { status: 400 }
    )
  }

  const service = await addServiceToMaster(masterId, name)

  if (!service) {
    return NextResponse.json({ error: 'Failed to add service' }, { status: 500 })
  }

  return NextResponse.json(service)
}

export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const serviceId = searchParams.get('serviceId')

  if (!serviceId) {
    return NextResponse.json({ error: 'Missing serviceId' }, { status: 400 })
  }

  const success = await deleteService(serviceId)

  if (!success) {
    return NextResponse.json({ error: 'Service not found' }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}
