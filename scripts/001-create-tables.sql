-- Create masters table
CREATE TABLE IF NOT EXISTS masters (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  service_ids JSONB NOT NULL DEFAULT '[]'::jsonb
);

-- Create services table
CREATE TABLE IF NOT EXISTS services (
  id TEXT PRIMARY KEY,
  master_id TEXT NOT NULL,
  name TEXT NOT NULL,
  UNIQUE(master_id, name)
);

-- Create slot settings table
CREATE TABLE IF NOT EXISTS slot_settings (
  master_id TEXT PRIMARY KEY,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  interval_minutes INTEGER NOT NULL
);

-- Create slots table
CREATE TABLE IF NOT EXISTS slots (
  id TEXT PRIMARY KEY,
  time TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'available',
  master_id TEXT NOT NULL,
  date TEXT NOT NULL,
  booked_order_id TEXT,
  booked_service_id TEXT,
  UNIQUE(master_id, date, time)
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY,
  master_id TEXT NOT NULL,
  master_name TEXT NOT NULL,
  service_id TEXT NOT NULL,
  service_name TEXT NOT NULL,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_username TEXT,
  user_platform TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_services_master ON services(master_id);
CREATE INDEX IF NOT EXISTS idx_slot_settings_master ON slot_settings(master_id);
CREATE INDEX IF NOT EXISTS idx_slots_master_date ON slots(master_id, date);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(date, time);
CREATE INDEX IF NOT EXISTS idx_bookings_master ON bookings(master_id);

-- Ensure new booking columns exist (for existing databases)
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS user_username TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS user_platform TEXT;

-- Enable RLS (but allow all operations for this mini app - no auth required)
ALTER TABLE masters ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE slot_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (this is a Telegram mini app without auth)
CREATE POLICY "Allow public read masters" ON masters FOR SELECT USING (true);
CREATE POLICY "Allow public insert masters" ON masters FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update masters" ON masters FOR UPDATE USING (true);
CREATE POLICY "Allow public delete masters" ON masters FOR DELETE USING (true);

CREATE POLICY "Allow public read services" ON services FOR SELECT USING (true);
CREATE POLICY "Allow public insert services" ON services FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update services" ON services FOR UPDATE USING (true);
CREATE POLICY "Allow public delete services" ON services FOR DELETE USING (true);

CREATE POLICY "Allow public read slot settings" ON slot_settings FOR SELECT USING (true);
CREATE POLICY "Allow public insert slot settings" ON slot_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update slot settings" ON slot_settings FOR UPDATE USING (true);
CREATE POLICY "Allow public delete slot settings" ON slot_settings FOR DELETE USING (true);

CREATE POLICY "Allow public read slots" ON slots FOR SELECT USING (true);
CREATE POLICY "Allow public insert slots" ON slots FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update slots" ON slots FOR UPDATE USING (true);
CREATE POLICY "Allow public delete slots" ON slots FOR DELETE USING (true);

CREATE POLICY "Allow public read bookings" ON bookings FOR SELECT USING (true);
CREATE POLICY "Allow public insert bookings" ON bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update bookings" ON bookings FOR UPDATE USING (true);
CREATE POLICY "Allow public delete bookings" ON bookings FOR DELETE USING (true);

-- Insert default masters
INSERT INTO masters (id, name, service_ids) VALUES
  ('1', 'Анна', '["1", "2", "3", "4", "5"]'::jsonb),
  ('2', 'Ирина', '["1", "2", "3", "4", "5"]'::jsonb),
  ('3', 'Олег', '["1", "2", "3", "4", "5"]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Insert default services for masters
INSERT INTO services (id, master_id, name) VALUES
  ('svc-1-1', '1', 'Маникюр'),
  ('svc-1-2', '1', 'Педикюр'),
  ('svc-1-3', '1', 'Окрашивание'),
  ('svc-1-4', '1', 'Мужская стрижка'),
  ('svc-1-5', '1', 'Женская стрижка'),
  ('svc-2-1', '2', 'Маникюр'),
  ('svc-2-2', '2', 'Педикюр'),
  ('svc-2-3', '2', 'Окрашивание'),
  ('svc-2-4', '2', 'Мужская стрижка'),
  ('svc-2-5', '2', 'Женская стрижка'),
  ('svc-3-1', '3', 'Маникюр'),
  ('svc-3-2', '3', 'Педикюр'),
  ('svc-3-3', '3', 'Окрашивание'),
  ('svc-3-4', '3', 'Мужская стрижка'),
  ('svc-3-5', '3', 'Женская стрижка')
ON CONFLICT (id) DO NOTHING;

-- Insert default slot settings for masters
INSERT INTO slot_settings (master_id, start_time, end_time, interval_minutes) VALUES
  ('1', '10:00', '18:00', 60),
  ('2', '10:00', '18:00', 60),
  ('3', '10:00', '18:00', 60)
ON CONFLICT (master_id) DO NOTHING;
