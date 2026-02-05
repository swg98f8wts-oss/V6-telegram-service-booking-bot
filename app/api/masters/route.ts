import { NextResponse } from 'next/server'
import { getMasters, getServicesForMaster } from '@/lib/booking-store'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const masterId = searchParams.get('masterId')
  
  if (masterId) {
    const services = await getServicesForMaster(masterId)
    return NextResponse.json(services)
  }
  
  const masters = await getMasters()
  return NextResponse.json(masters)
}
