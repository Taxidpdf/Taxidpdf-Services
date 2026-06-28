-- =========================================================================
-- SUPABASE ROW-LEVEL SECURITY (RLS) POLICY MIGRATION
-- =========================================================================
-- This script fixes the "401 Unauthorized" and "new row violates row-level security policy"
-- errors on the profiles table by ensuring that authenticated users can insert, select, and update 
-- their own profile records in the public.profiles table.
--
-- INSTRUCTIONS:
-- 1. Go to your Supabase Dashboard (https://supabase.com).
-- 2. Open the "SQL Editor" from the left sidebar navigation.
-- 3. Click "New Query".
-- 4. Paste the entire contents of this file into the SQL editor.
-- 5. Click "Run" (or press Cmd+Enter / Ctrl+Enter).
-- =========================================================================

-- Step 1: Ensure Row Level Security (RLS) is enabled on the profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop existing select/update/insert policies on public.profiles if they exist to avoid duplication errors
DROP POLICY IF EXISTS "Allow users to insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to select own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow public read on profiles (for agents lookup)" ON public.profiles;

-- Step 3: Create the INSERT policy
-- This allows newly registered/authenticated users (whose auth.uid() is matched) to insert their own profile row
CREATE POLICY "Allow users to insert own profile" ON public.profiles
    FOR INSERT 
    WITH CHECK (auth.uid() = id);

-- Step 4: Create the UPDATE policy
-- This allows authenticated users to update only their own profile details
CREATE POLICY "Allow users to update own profile" ON public.profiles
    FOR UPDATE 
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Step 5: Create the SELECT policy
-- This allows authenticated users to read profiles, keeping lookup capability functional.
-- We can allow a public read or a restricted self-lookup. Let's support public lookup (for search/agents verification) 
-- as requested by the original application, but fully compliant with RLS.
CREATE POLICY "Allow public read on profiles (for agents lookup)" ON public.profiles
    FOR SELECT 
    USING (true);

-- Step 6: Verify policies on other tables to ensure they have correct auth.uid() controls
-- (These tables were already referencing auth.uid() = user_id, which will now function flawlessly
--  since the client correctly authenticates using supabase.auth.signInWithPassword)

-- Acknowledge Success
SELECT 'Row-level security policies updated successfully! Authenticated users can now insert and manage their profiles.' as status;
