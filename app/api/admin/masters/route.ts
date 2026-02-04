import { NextResponse } from 'next/server'
import { 
  getMasters, 
  addMaster, 
  updateMaster, 
  deleteMaster,
  getServicesForMasters
} from '@/lib/booking-store'

export async function GET() {
  const masters = await getMasters()
  const servicesByMaster = await getServicesForMasters(masters.map((master) => master.id))

  return NextResponse.json({ masters, servicesByMaster })
}

export async function POST(request: Request) {
  const { name, serviceIds } = await request.json()
  
  if (!name) {
    return NextResponse.json({ error: 'Name required' }, { status: 400 })
  }
  
  const master = await addMaster(name, Array.isArray(serviceIds) ? serviceIds : undefined)
  return NextResponse.json(master)
}

export async function PUT(request: Request) {
  const { id, name, serviceIds } = await request.json()
  
  if (!id || !name) {
    return NextResponse.json({ error: 'ID and name required' }, { status: 400 })
  }
  
  const master = await updateMaster(id, name, Array.isArray(serviceIds) ? serviceIds : undefined)
  
  if (!master) {
    return NextResponse.json({ error: 'Master not found' }, { status: 404 })
  }
  
  return NextResponse.json(master)
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const masterId = searchParams.get('masterId')
  
  if (!masterId) {
    return NextResponse.json({ error: 'Master ID required' }, { status: 400 })
  }
  
  const success = await deleteMaster(masterId)
  
  if (!success) {
    return NextResponse.json({ error: 'Master not found' }, { status: 404 })
  }
  
  return NextResponse.json({ success: true })
}
