-- Enable Row Level Security
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- Create custom types
CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'declined', 'expired');
CREATE TYPE service_type AS ENUM ('oil_change', 'tire_rotation', 'brake_service', 'general_maintenance', 'repair', 'inspection', 'other');

-- Profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email text UNIQUE NOT NULL,
  full_name text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Vehicles table
CREATE TABLE vehicles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  make text NOT NULL,
  model text NOT NULL,
  year integer NOT NULL CHECK (year >= 1900 AND year <= extract(year from now()) + 2),
  license_plate text NOT NULL,
  vin text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, license_plate)
);

-- Groups table
CREATE TABLE groups (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  owner_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Group members table
CREATE TABLE group_members (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id uuid REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  joined_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(group_id, user_id)
);

-- Group invitations table
CREATE TABLE group_invitations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id uuid REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  email text NOT NULL,
  invited_by uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status invitation_status DEFAULT 'pending' NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  UNIQUE(group_id, email, status) -- Prevent duplicate pending invitations
);

-- Mileage logs table
CREATE TABLE mileage_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id uuid REFERENCES vehicles(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  odometer_reading integer NOT NULL CHECK (odometer_reading >= 0),
  date date NOT NULL,
  notes text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Fuel logs table
CREATE TABLE fuel_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id uuid REFERENCES vehicles(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  liters_filled numeric(8,2) NOT NULL CHECK (liters_filled > 0),
  cost numeric(10,2) CHECK (cost >= 0),
  date date NOT NULL,
  odometer_reading integer NOT NULL CHECK (odometer_reading >= 0),
  location text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Service logs table
CREATE TABLE service_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id uuid REFERENCES vehicles(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  service_type service_type NOT NULL,
  description text NOT NULL,
  cost numeric(10,2) CHECK (cost >= 0),
  date date NOT NULL,
  odometer_reading integer NOT NULL CHECK (odometer_reading >= 0),
  next_service_due date,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX idx_vehicles_user_id ON vehicles(user_id);
CREATE INDEX idx_groups_owner_id ON groups(owner_id);
CREATE INDEX idx_group_members_group_id ON group_members(group_id);
CREATE INDEX idx_group_members_user_id ON group_members(user_id);
CREATE INDEX idx_group_invitations_group_id ON group_invitations(group_id);
CREATE INDEX idx_group_invitations_email ON group_invitations(email);
CREATE INDEX idx_mileage_logs_vehicle_id ON mileage_logs(vehicle_id);
CREATE INDEX idx_mileage_logs_date ON mileage_logs(date);
CREATE INDEX idx_fuel_logs_vehicle_id ON fuel_logs(vehicle_id);
CREATE INDEX idx_fuel_logs_date ON fuel_logs(date);
CREATE INDEX idx_service_logs_vehicle_id ON service_logs(vehicle_id);
CREATE INDEX idx_service_logs_date ON service_logs(date);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security Policies

-- Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Vehicles
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own vehicles" ON vehicles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own vehicles" ON vehicles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own vehicles" ON vehicles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own vehicles" ON vehicles FOR DELETE USING (auth.uid() = user_id);

-- Groups
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Group members can view groups they belong to" ON groups FOR SELECT
  USING (
    auth.uid() = owner_id OR
    EXISTS (SELECT 1 FROM group_members WHERE group_id = groups.id AND user_id = auth.uid())
  );
CREATE POLICY "Users can create groups" ON groups FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Group owners can update their groups" ON groups FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Group owners can delete their groups" ON groups FOR DELETE USING (auth.uid() = owner_id);

-- Group members
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Group members can view group membership" ON group_members FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM groups WHERE id = group_id AND owner_id = auth.uid())
  );
CREATE POLICY "Users can join groups (through invitations)" ON group_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave groups or owners can remove members" ON group_members FOR DELETE
  USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM groups WHERE id = group_id AND owner_id = auth.uid())
  );

-- Group invitations
ALTER TABLE group_invitations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Group owners can manage invitations" ON group_invitations FOR ALL
  USING (EXISTS (SELECT 1 FROM groups WHERE id = group_id AND owner_id = auth.uid()));
CREATE POLICY "Invited users can view their invitations" ON group_invitations FOR SELECT
  USING (
    email = (SELECT email FROM profiles WHERE id = auth.uid()) OR
    EXISTS (SELECT 1 FROM groups WHERE id = group_id AND owner_id = auth.uid())
  );

-- Mileage logs
ALTER TABLE mileage_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage logs for their vehicles" ON mileage_logs FOR ALL
  USING (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM vehicles WHERE id = vehicle_id AND user_id = auth.uid())
  );

-- Fuel logs
ALTER TABLE fuel_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage logs for their vehicles" ON fuel_logs FOR ALL
  USING (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM vehicles WHERE id = vehicle_id AND user_id = auth.uid())
  );

-- Service logs
ALTER TABLE service_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage logs for their vehicles" ON service_logs FOR ALL
  USING (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM vehicles WHERE id = vehicle_id AND user_id = auth.uid())
  );

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();