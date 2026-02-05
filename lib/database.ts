import { createClient } from "@/lib/supabase/server"
import { Master, Service, TimeSlot, Booking, DEFAULT_SERVICES, SlotStatus } from "./types"

const DEFAULT_SLOT_SETTINGS = {
  startTime: "10:00",
  endTime: "18:00",
  intervalMinutes: 60,
}

// ==================== Masters ====================

export async function getMasters(): Promise<Master[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("masters")
    .select("*")
    .order("name")

  if (error) {
    console.error("Error fetching masters:", error)
    return []
  }

  return data.map((row) => ({
    id: row.id,
    name: row.name,
    serviceIds: row.service_ids || [],
  }))
}

export async function getMasterById(id: string): Promise<Master | undefined> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("masters")
    .select("*")
    .eq("id", id)
    .single()

  if (error || !data) {
    return undefined
  }

  return {
    id: data.id,
    name: data.name,
    serviceIds: data.service_ids || [],
  }
}

export async function addMaster(name: string, serviceIds?: string[]): Promise<Master> {
  const supabase = await createClient()
  const id = `master-${Date.now()}-${Math.random().toString(36).slice(2)}`
  const finalServiceIds = serviceIds && serviceIds.length > 0
    ? serviceIds
    : DEFAULT_SERVICES.map((service) => service.id)
  
  const { error } = await supabase
    .from("masters")
    .insert({ id, name, service_ids: finalServiceIds })

  if (error) {
    console.error("Error adding master:", error)
    throw error
  }

  await seedDefaultServicesForMaster(id, finalServiceIds)
  await upsertSlotSettings(id, DEFAULT_SLOT_SETTINGS.startTime, DEFAULT_SLOT_SETTINGS.endTime, DEFAULT_SLOT_SETTINGS.intervalMinutes)

  return { id, name, serviceIds: finalServiceIds }
}

export async function updateMaster(id: string, name: string, serviceIds?: string[]): Promise<Master | null> {
  const supabase = await createClient()
  const updatePayload: { name: string; service_ids?: string[] } = { name }
  if (serviceIds) {
    updatePayload.service_ids = serviceIds
  }

  const { error } = await supabase
    .from("masters")
    .update(updatePayload)
    .eq("id", id)

  if (error) {
    console.error("Error updating master:", error)
    return null
  }

  const finalServiceIds = serviceIds ?? (await getMasterById(id))?.serviceIds ?? []
  return { id, name, serviceIds: finalServiceIds }
}

export async function deleteMaster(id: string): Promise<boolean> {
  const supabase = await createClient()
  
  // Delete associated bookings first
  await supabase.from("bookings").delete().eq("master_id", id)
  
  // Delete associated slots
  await supabase.from("slots").delete().eq("master_id", id)

  // Delete associated services
  await supabase.from("services").delete().eq("master_id", id)
  
  // Delete the master
  const { error } = await supabase.from("masters").delete().eq("id", id)

  if (error) {
    console.error("Error deleting master:", error)
    return false
  }

  return true
}

export async function getServicesForMaster(masterId: string): Promise<Service[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("services")
    .select("id, name")
    .eq("master_id", masterId)
    .order("name")

  if (error) {
    console.error("Error fetching services:", error)
    return []
  }

  return (data || []).map((row) => ({ id: row.id, name: row.name }))
}

export function getServices(): Service[] {
  return DEFAULT_SERVICES
}

async function seedDefaultServicesForMaster(masterId: string, serviceIds?: string[]): Promise<Service[]> {
  const supabase = await createClient()
  const targetServiceIds = serviceIds && serviceIds.length > 0
    ? serviceIds
    : DEFAULT_SERVICES.map((service) => service.id)
  const baseServices = DEFAULT_SERVICES.filter((service) => targetServiceIds.includes(service.id))

  if (baseServices.length === 0) return []

  const rows = baseServices.map((service) => ({
    id: `svc-${masterId}-${service.id}`,
    master_id: masterId,
    name: service.name,
  }))

  const { error } = await supabase.from("services").upsert(rows, { onConflict: "id" })
  if (error) {
    console.error("Error seeding services:", error)
  }

  return rows.map((row) => ({ id: row.id, name: row.name }))
}

export async function getServicesForMasters(masterIds: string[]): Promise<Record<string, Service[]>> {
  if (masterIds.length === 0) return {}
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("services")
    .select("id, name, master_id")
    .in("master_id", masterIds)
    .order("name")

  if (error) {
    console.error("Error fetching services for masters:", error)
    return {}
  }

  const result: Record<string, Service[]> = {}
  for (const row of data || []) {
    if (!result[row.master_id]) result[row.master_id] = []
    result[row.master_id].push({ id: row.id, name: row.name })
  }
  for (const masterId of Object.keys(result)) {
    result[masterId].sort((a, b) => a.name.localeCompare(b.name))
  }
  return result
}

export async function addServiceToMaster(masterId: string, name: string): Promise<Service | null> {
  const supabase = await createClient()
  const trimmedName = name.trim()
  if (!trimmedName) return null

  const id = `service-${Date.now()}-${Math.random().toString(36).slice(2)}`
  const { data, error } = await supabase
    .from("services")
    .insert({ id, master_id: masterId, name: trimmedName })
    .select("id, name")
    .single()

  if (error || !data) {
    console.error("Error adding service:", error)
    return null
  }

  return { id: data.id, name: data.name }
}

export async function deleteService(serviceId: string): Promise<boolean> {
  const supabase = await createClient()
  const { error } = await supabase.from("services").delete().eq("id", serviceId)
  if (error) {
    console.error("Error deleting service:", error)
    return false
  }
  return true
}

// ==================== Slots ====================

function getSlotKey(masterId: string, date: string, time: string): string {
  return `${masterId}-${date}-${time}`
}

function parseTimeToMinutes(time: string): number | null {
  const [h, m] = time.split(":").map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return null
  if (h < 0 || h > 23 || m < 0 || m > 59) return null
  return h * 60 + m
}

function formatMinutesToTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`
}

function buildTimeSlots(startTime: string, endTime: string, intervalMinutes: number): string[] {
  const startMinutes = parseTimeToMinutes(startTime)
  const endMinutes = parseTimeToMinutes(endTime)

  if (startMinutes === null || endMinutes === null || intervalMinutes <= 0) {
    return []
  }

  const slots: string[] = []
  for (let current = startMinutes; current <= endMinutes; current += intervalMinutes) {
    slots.push(formatMinutesToTime(current))
  }
  return slots
}

function getVolgogradDateString(date: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Volgograd',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const parts = formatter.formatToParts(date)
  const year = parts.find((part) => part.type === 'year')?.value ?? ''
  const month = parts.find((part) => part.type === 'month')?.value ?? ''
  const day = parts.find((part) => part.type === 'day')?.value ?? ''
  return `${year}-${month}-${day}`
}

function addDaysToDateString(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split("-").map(Number)
  const base = new Date(Date.UTC(year, month - 1, day))
  base.setUTCDate(base.getUTCDate() + days)
  return base.toISOString().slice(0, 10)
}

function buildDateRange(startDate: string, days: number): string[] {
  const range: string[] = []
  for (let i = 0; i <= days; i += 1) {
    range.push(addDaysToDateString(startDate, i))
  }
  return range
}

export async function getSlotSettings(masterId: string): Promise<{
  startTime: string
  endTime: string
  intervalMinutes: number
}> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("slot_settings")
    .select("start_time, end_time, interval_minutes")
    .eq("master_id", masterId)
    .single()

  if (error || !data) {
    return DEFAULT_SLOT_SETTINGS
  }

  return {
    startTime: data.start_time,
    endTime: data.end_time,
    intervalMinutes: data.interval_minutes,
  }
}

export async function upsertSlotSettings(
  masterId: string,
  startTime: string,
  endTime: string,
  intervalMinutes: number
): Promise<{ startTime: string; endTime: string; intervalMinutes: number }> {
  const supabase = await createClient()
  const payload = {
    master_id: masterId,
    start_time: startTime,
    end_time: endTime,
    interval_minutes: intervalMinutes,
  }

  const { error } = await supabase
    .from("slot_settings")
    .upsert(payload, { onConflict: "master_id" })

  if (error) {
    console.error("Error updating slot settings:", error)
    throw error
  }

  return {
    startTime,
    endTime,
    intervalMinutes,
  }
}

export async function applySlotSettingsToFutureDates(
  masterId: string,
  options?: { daysAhead?: number; settings?: { startTime: string; endTime: string; intervalMinutes: number } }
): Promise<void> {
  const supabase = await createClient()
  const daysAhead = options?.daysAhead ?? 30
  const settings = options?.settings || (await getSlotSettings(masterId))
  const desiredTimes = buildTimeSlots(settings.startTime, settings.endTime, settings.intervalMinutes)
  if (desiredTimes.length === 0) return

  const startDate = getVolgogradDateString()
  const endDate = addDaysToDateString(startDate, daysAhead)

  const { data: existingSlots, error } = await supabase
    .from("slots")
    .select("*")
    .eq("master_id", masterId)
    .gte("date", startDate)
    .lte("date", endDate)

  if (error) {
    console.error("Error fetching future slots:", error)
    return
  }

  const slotsByDate = new Map<string, Map<string, any>>()
  for (const slot of existingSlots || []) {
    if (!slotsByDate.has(slot.date)) {
      slotsByDate.set(slot.date, new Map())
    }
    slotsByDate.get(slot.date)!.set(slot.time, slot)
  }

  const dates = buildDateRange(startDate, daysAhead)
  const missingSlots: Array<{
    id: string
    time: string
    status: string
    master_id: string
    date: string
  }> = []
  const disableIds: string[] = []
  const enableIds: string[] = []

  for (const date of dates) {
    const slotsForDate = slotsByDate.get(date) || new Map<string, any>()

    for (const time of desiredTimes) {
      const existing = slotsForDate.get(time)
      if (existing) {
        if (existing.status === "disabled") {
          enableIds.push(existing.id)
        }
        continue
      }

      const key = getSlotKey(masterId, date, time)
      missingSlots.push({
        id: key,
        time,
        status: "available",
        master_id: masterId,
        date,
      })
    }

    for (const slot of slotsForDate.values()) {
      if (desiredTimes.includes(slot.time)) continue
      if (slot.status === "booked") continue
      if (slot.status !== "disabled") {
        disableIds.push(slot.id)
      }
    }
  }

  if (missingSlots.length > 0) {
    const { error: upsertError } = await supabase
      .from("slots")
      .upsert(missingSlots, { onConflict: "id" })
    if (upsertError) {
      console.error("Error creating future slots:", upsertError)
    }
  }

  if (enableIds.length > 0) {
    const { error: enableError } = await supabase
      .from("slots")
      .update({ status: "available" })
      .in("id", enableIds)
    if (enableError) {
      console.error("Error enabling slots:", enableError)
    }
  }

  if (disableIds.length > 0) {
    const { error: disableError } = await supabase
      .from("slots")
      .update({ status: "disabled" })
      .in("id", disableIds)
    if (disableError) {
      console.error("Error disabling slots:", disableError)
    }
  }
}

export async function generateSlotsForDay(masterId: string, date: string): Promise<TimeSlot[]> {
  const supabase = await createClient()
  const result: TimeSlot[] = []
  const settings = await getSlotSettings(masterId)
  const desiredTimes = buildTimeSlots(
    settings.startTime,
    settings.endTime,
    settings.intervalMinutes
  )

  // Get existing slots for this master and date
  const { data: existingSlots } = await supabase
    .from("slots")
    .select("*")
    .eq("master_id", masterId)
    .eq("date", date)

  const slotsMap = new Map(
    (existingSlots || []).map((s) => [s.time, s])
  )

  for (const time of desiredTimes) {
    const existingSlot = slotsMap.get(time)

    if (existingSlot) {
      const slot: TimeSlot = {
        id: existingSlot.id,
        time: existingSlot.time,
        status: existingSlot.status as SlotStatus,
        masterId: existingSlot.master_id,
        date: existingSlot.date,
      }
      if (existingSlot.booked_order_id && existingSlot.booked_service_id) {
        slot.bookedBy = {
          oderId: existingSlot.booked_order_id,
          serviceId: existingSlot.booked_service_id,
        }
      }
      result.push(slot)
    } else {
      // Create new slot entry
      const key = getSlotKey(masterId, date, time)
      const slot: TimeSlot = {
        id: key,
        time,
        status: "available",
        masterId,
        date,
      }

      // Insert into database (ignore if already exists)
      await supabase.from("slots").upsert({
        id: key,
        time,
        status: "available",
        master_id: masterId,
        date,
      }, { onConflict: 'id' })

      result.push(slot)
    }
  }

  for (const slot of existingSlots || []) {
    if (desiredTimes.includes(slot.time)) continue
    if (slot.status === "booked") {
      result.push({
        id: slot.id,
        time: slot.time,
        status: slot.status as SlotStatus,
        masterId: slot.master_id,
        date: slot.date,
        bookedBy: slot.booked_order_id && slot.booked_service_id ? {
          oderId: slot.booked_order_id,
          serviceId: slot.booked_service_id,
        } : undefined,
      })
      continue
    }

    if (slot.status !== "disabled") {
      await supabase
        .from("slots")
        .update({ status: "disabled" })
        .eq("id", slot.id)
    }
  }

  return result
}

export async function getSlotsForDay(masterId: string, date: string): Promise<TimeSlot[]> {
  return generateSlotsForDay(masterId, date)
}

export async function getAdminSlotsForDay(masterId: string, date: string): Promise<TimeSlot[]> {
  return generateSlotsForDay(masterId, date)
}

// ==================== Bookings ====================

export async function bookSlot(
  masterId: string,
  date: string,
  time: string,
  serviceId: string,
  userId: string,
  userName: string,
  userUsername: string | null,
  userPlatform: string | null,
  masterName: string,
  serviceName: string
): Promise<Booking | null> {
  const supabase = await createClient()
  const key = getSlotKey(masterId, date, time)

  // Ensure service exists for this master
  const { data: service } = await supabase
    .from("services")
    .select("id, name")
    .eq("id", serviceId)
    .eq("master_id", masterId)
    .single()

  if (!service) {
    return null
  }

  // Check if slot exists and is available
  const { data: existingSlot } = await supabase
    .from("slots")
    .select("*")
    .eq("master_id", masterId)
    .eq("date", date)
    .eq("time", time)
    .single()

  if (existingSlot && existingSlot.status !== "available") {
    return null
  }

  // If slot doesn't exist, create it
  if (!existingSlot) {
    await supabase.from("slots").insert({
      id: key,
      time,
      status: "available",
      master_id: masterId,
      date,
    })
  }

  // Create booking
  const bookingId = `booking-${Date.now()}-${Math.random().toString(36).slice(2)}`
  const createdAt = new Date().toISOString()

  const { error: bookingError } = await supabase.from("bookings").insert({
    id: bookingId,
    master_id: masterId,
    master_name: masterName,
    service_id: serviceId,
    service_name: service.name || serviceName,
    date,
    time,
    user_id: userId,
    user_name: userName,
    user_username: userUsername,
    user_platform: userPlatform,
    created_at: createdAt,
  })

  if (bookingError) {
    console.error("Error creating booking:", bookingError)
    return null
  }

  // Update slot status
  const { error: slotError } = await supabase
    .from("slots")
    .update({
      status: "booked",
      booked_order_id: bookingId,
      booked_service_id: serviceId,
    })
    .eq("master_id", masterId)
    .eq("date", date)
    .eq("time", time)

  if (slotError) {
    console.error("Error updating slot:", slotError)
    // Rollback booking
    await supabase.from("bookings").delete().eq("id", bookingId)
    return null
  }

  return {
    id: bookingId,
    masterId,
    masterName,
    serviceId,
    serviceName,
    date,
    time,
    userId,
    userName,
    userUsername,
    userPlatform,
    createdAt,
  }
}

export async function getUserBookings(userId: string): Promise<Booking[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: false })

  if (error) {
    console.error("Error fetching user bookings:", error)
    return []
  }

  return data.map((row) => ({
    id: row.id,
    masterId: row.master_id,
    masterName: row.master_name,
    serviceId: row.service_id,
    serviceName: row.service_name,
    date: row.date,
    time: row.time,
    userId: row.user_id,
    userName: row.user_name,
    userUsername: row.user_username,
    userPlatform: row.user_platform,
    createdAt: row.created_at,
  }))
}

export async function cancelBooking(bookingId: string, userId: string): Promise<boolean> {
  const supabase = await createClient()

  // Find the booking
  const { data: booking } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .eq("user_id", userId)
    .single()

  if (!booking) return false

  // Update slot status back to available
  await supabase
    .from("slots")
    .update({
      status: "available",
      booked_order_id: null,
      booked_service_id: null,
    })
    .eq("master_id", booking.master_id)
    .eq("date", booking.date)
    .eq("time", booking.time)

  // Delete the booking
  const { error } = await supabase.from("bookings").delete().eq("id", bookingId)

  if (error) {
    console.error("Error canceling booking:", error)
    return false
  }

  return true
}

export async function getBookingById(bookingId: string): Promise<Booking | undefined> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .single()

  if (error || !data) {
    return undefined
  }

  return {
    id: data.id,
    masterId: data.master_id,
    masterName: data.master_name,
    serviceId: data.service_id,
    serviceName: data.service_name,
    date: data.date,
    time: data.time,
    userId: data.user_id,
    userName: data.user_name,
    userUsername: data.user_username,
    userPlatform: data.user_platform,
    createdAt: data.created_at,
  }
}

// ==================== Admin Functions ====================

export async function getAllBookings(): Promise<Booking[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .order("date", { ascending: true })
    .order("time", { ascending: true })

  if (error) {
    console.error("Error fetching all bookings:", error)
    return []
  }

  return data.map((row) => ({
    id: row.id,
    masterId: row.master_id,
    masterName: row.master_name,
    serviceId: row.service_id,
    serviceName: row.service_name,
    date: row.date,
    time: row.time,
    userId: row.user_id,
    userName: row.user_name,
    userUsername: row.user_username,
    userPlatform: row.user_platform,
    createdAt: row.created_at,
  }))
}

export async function cleanupPastBookings(): Promise<number> {
  const supabase = await createClient()
  const today = getVolgogradDateString()

  const { data: pastBookings, error } = await supabase
    .from("bookings")
    .select("id, master_id, date, time")
    .lt("date", today)

  if (error) {
    console.error("Error fetching past bookings:", error)
    return 0
  }

  if (!pastBookings || pastBookings.length === 0) {
    return 0
  }

  await Promise.all(
    pastBookings.map((booking) =>
      supabase
        .from("slots")
        .update({
          status: "available",
          booked_order_id: null,
          booked_service_id: null,
        })
        .eq("master_id", booking.master_id)
        .eq("date", booking.date)
        .eq("time", booking.time)
    )
  )

  const ids = pastBookings.map((booking) => booking.id)
  const { error: deleteError } = await supabase
    .from("bookings")
    .delete()
    .in("id", ids)

  if (deleteError) {
    console.error("Error deleting past bookings:", deleteError)
    return 0
  }

  return ids.length
}

export async function adminCancelBooking(bookingId: string): Promise<boolean> {
  const supabase = await createClient()

  // Find the booking
  const { data: booking } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .single()

  if (!booking) return false

  // Update slot status back to available
  await supabase
    .from("slots")
    .update({
      status: "available",
      booked_order_id: null,
      booked_service_id: null,
    })
    .eq("master_id", booking.master_id)
    .eq("date", booking.date)
    .eq("time", booking.time)

  // Delete the booking
  const { error } = await supabase.from("bookings").delete().eq("id", bookingId)

  if (error) {
    console.error("Error admin canceling booking:", error)
    return false
  }

  return true
}

export async function toggleSlotDisabled(masterId: string, date: string, time: string): Promise<TimeSlot> {
  const supabase = await createClient()
  const key = getSlotKey(masterId, date, time)

  // Check if slot exists
  const { data: existingSlot } = await supabase
    .from("slots")
    .select("*")
    .eq("master_id", masterId)
    .eq("date", date)
    .eq("time", time)
    .single()

  if (!existingSlot) {
    // Create new disabled slot
    await supabase.from("slots").insert({
      id: key,
      time,
      status: "disabled",
      master_id: masterId,
      date,
    })

    return {
      id: key,
      time,
      status: "disabled",
      masterId,
      date,
    }
  }

  // Don't toggle if booked
  if (existingSlot.status === "booked") {
    const slot: TimeSlot = {
      id: existingSlot.id,
      time: existingSlot.time,
      status: existingSlot.status as SlotStatus,
      masterId: existingSlot.master_id,
      date: existingSlot.date,
    }
    if (existingSlot.booked_order_id && existingSlot.booked_service_id) {
      slot.bookedBy = {
        oderId: existingSlot.booked_order_id,
        serviceId: existingSlot.booked_service_id,
      }
    }
    return slot
  }

  // Toggle between available and disabled
  const newStatus = existingSlot.status === "disabled" ? "available" : "disabled"
  await supabase
    .from("slots")
    .update({ status: newStatus })
    .eq("master_id", masterId)
    .eq("date", date)
    .eq("time", time)

  return {
    id: existingSlot.id,
    time: existingSlot.time,
    status: newStatus as SlotStatus,
    masterId: existingSlot.master_id,
    date: existingSlot.date,
  }
}
