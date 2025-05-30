-- Fix RLS policies for app_users table to allow user self-registration

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON app_users;
DROP POLICY IF EXISTS "Users can update own profile" ON app_users;

-- Create new policies
CREATE POLICY "Users can create own profile" ON app_users
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own profile" ON app_users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON app_users
    FOR UPDATE USING (auth.uid() = id);

-- Allow authenticated users to check if they have a profile
CREATE POLICY "Authenticated users can check profile existence" ON app_users
    FOR SELECT USING (auth.uid() IS NOT NULL);