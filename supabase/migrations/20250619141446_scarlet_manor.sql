/*
  # Initial Schema for ParkPass Application

  1. New Tables
    - `users` - User accounts (customers, owners, admins)
    - `user_profiles` - Extended user profile information
    - `owner_profiles` - Additional information for parking spot owners
    - `vehicles` - Customer vehicle information
    - `parking_spots` - Main parking spot information with geolocation
    - `parking_spot_availability` - Time-based availability management
    - `bookings` - Parking reservations
    - `payment_slips` - Uploaded payment proof for QR/bank transfer payments
    - `reviews` - Customer reviews and ratings
    - `notifications` - System notifications for users
    - `admin_logs` - Audit trail for admin actions
    - `system_settings` - Application configuration

  2. Security
    - Enable RLS on all tables
    - Add policies for user data access
    - Add policies for admin access
    - Add policies for owner access to their spots and bookings

  3. Performance
    - Add indexes for common queries
    - Add triggers for automatic updates
*/

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text,
  name text NOT NULL,
  phone text,
  user_type text NOT NULL CHECK (user_type IN ('customer', 'owner', 'admin')) DEFAULT 'customer',
  email_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- User profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  avatar_url text,
  date_of_birth date,
  address text,
  city text,
  state text,
  postal_code text,
  country text DEFAULT 'US',
  preferences jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Owner profiles table
CREATE TABLE IF NOT EXISTS owner_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  business_name text,
  business_address text,
  business_phone text,
  tax_id text,
  bank_account_number text,
  bank_routing_number text,
  payment_qr_code_url text,
  verification_status text DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  verification_documents jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  make text NOT NULL,
  model text NOT NULL,
  year integer,
  color text,
  license_plate text NOT NULL,
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Parking spots table
CREATE TABLE IF NOT EXISTS parking_spots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  address text NOT NULL,
  latitude decimal(10, 8) NOT NULL,
  longitude decimal(11, 8) NOT NULL,
  total_slots integer NOT NULL DEFAULT 1,
  available_slots integer NOT NULL DEFAULT 1,
  price decimal(10, 2) NOT NULL,
  price_type text NOT NULL CHECK (price_type IN ('hour', 'day', 'month')),
  phone text,
  opening_hours text DEFAULT '24/7',
  amenities jsonb DEFAULT '[]',
  images jsonb DEFAULT '[]',
  features jsonb DEFAULT '{}',
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
  rating decimal(3, 2) DEFAULT 0,
  review_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Parking spot availability table
CREATE TABLE IF NOT EXISTS parking_spot_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  spot_id uuid REFERENCES parking_spots(id) ON DELETE CASCADE,
  date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  status text NOT NULL CHECK (status IN ('available', 'blocked', 'maintenance')),
  reason text,
  slots_affected integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(spot_id, date, start_time, end_time)
);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  spot_id uuid REFERENCES parking_spots(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  vehicle_id uuid REFERENCES vehicles(id) ON DELETE SET NULL,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  total_cost decimal(10, 2) NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'active', 'completed', 'cancelled')),
  payment_method text CHECK (payment_method IN ('card', 'qr', 'bank_transfer', 'wallet')),
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  qr_code text NOT NULL,
  pin text NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Payment slips table
CREATE TABLE IF NOT EXISTS payment_slips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  file_url text NOT NULL,
  file_name text NOT NULL,
  file_size integer,
  upload_status text DEFAULT 'pending' CHECK (upload_status IN ('pending', 'verified', 'rejected')),
  verification_notes text,
  verified_by uuid REFERENCES users(id) ON DELETE SET NULL,
  verified_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE,
  spot_id uuid REFERENCES parking_spots(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  photos jsonb DEFAULT '[]',
  aspect_ratings jsonb DEFAULT '{}',
  is_anonymous boolean DEFAULT false,
  status text DEFAULT 'published' CHECK (status IN ('published', 'hidden', 'flagged')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL CHECK (type IN ('booking', 'payment', 'review', 'system', 'promotion')),
  data jsonb DEFAULT '{}',
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Admin logs table
CREATE TABLE IF NOT EXISTS admin_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES users(id) ON DELETE SET NULL,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid,
  details jsonb DEFAULT '{}',
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- System settings table
CREATE TABLE IF NOT EXISTS system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL,
  description text,
  updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
  updated_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_type ON users(user_type);
CREATE INDEX IF NOT EXISTS idx_parking_spots_owner ON parking_spots(owner_id);
CREATE INDEX IF NOT EXISTS idx_parking_spots_location ON parking_spots(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_parking_spots_status ON parking_spots(status);
CREATE INDEX IF NOT EXISTS idx_parking_spots_rating ON parking_spots(rating DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_spot ON bookings(spot_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_dates ON bookings(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_payment_slips_booking ON payment_slips(booking_id);
CREATE INDEX IF NOT EXISTS idx_payment_slips_status ON payment_slips(upload_status);
CREATE INDEX IF NOT EXISTS idx_reviews_spot ON reviews(spot_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE owner_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE parking_spots ENABLE ROW LEVEL SECURITY;
ALTER TABLE parking_spot_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_slips ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can read own data" ON users
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can manage own profile" ON user_profiles
  FOR ALL TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Owners can manage own profile" ON owner_profiles
  FOR ALL TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage own vehicles" ON vehicles
  FOR ALL TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Anyone can read active spots" ON parking_spots
  FOR SELECT TO authenticated
  USING (status = 'active');

CREATE POLICY "Owners can manage own spots" ON parking_spots
  FOR ALL TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Owners can manage spot availability" ON parking_spot_availability
  FOR ALL TO authenticated
  USING (spot_id IN (SELECT id FROM parking_spots WHERE owner_id = auth.uid()));

CREATE POLICY "Users can read relevant bookings" ON bookings
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR 
         spot_id IN (SELECT id FROM parking_spots WHERE owner_id = auth.uid()));

CREATE POLICY "Users can create bookings" ON bookings
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own bookings" ON bookings
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage relevant payment slips" ON payment_slips
  FOR ALL TO authenticated
  USING (user_id = auth.uid() OR 
         booking_id IN (SELECT id FROM bookings WHERE 
                       spot_id IN (SELECT id FROM parking_spots WHERE owner_id = auth.uid())));

CREATE POLICY "Anyone can read published reviews" ON reviews
  FOR SELECT TO authenticated
  USING (status = 'published');

CREATE POLICY "Users can create reviews for their bookings" ON reviews
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND 
              booking_id IN (SELECT id FROM bookings WHERE user_id = auth.uid()));

CREATE POLICY "Users can read own notifications" ON notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can read all admin logs" ON admin_logs
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND user_type = 'admin'));

CREATE POLICY "Admins can manage system settings" ON system_settings
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND user_type = 'admin'));

-- Functions and triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_spot_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE parking_spots 
  SET 
    rating = (SELECT AVG(rating)::decimal(3,2) FROM reviews WHERE spot_id = NEW.spot_id AND status = 'published'),
    review_count = (SELECT COUNT(*) FROM reviews WHERE spot_id = NEW.spot_id AND status = 'published')
  WHERE id = NEW.spot_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_owner_profiles_updated_at BEFORE UPDATE ON owner_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_parking_spots_updated_at BEFORE UPDATE ON parking_spots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_spot_rating_trigger
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_spot_rating();

-- Insert default system settings
INSERT INTO system_settings (key, value, description) VALUES
('app_name', '"ParkPass"', 'Application name'),
('default_currency', '"USD"', 'Default currency for payments'),
('booking_cancellation_hours', '2', 'Hours before booking start time when cancellation is allowed'),
('max_booking_duration_hours', '168', 'Maximum booking duration in hours (7 days)'),
('payment_verification_timeout_hours', '24', 'Hours to verify payment slips')
ON CONFLICT (key) DO NOTHING;