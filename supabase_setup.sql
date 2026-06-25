-- =========================================================================
-- SUPABASE POSTGRESQL SCHEMA FOR JTB TIN SLIP GENERATOR PORTAL
-- =========================================================================
-- This script sets up the full database schema on Supabase.
-- Copy and run this script in your Supabase SQL Editor (Dashboard -> SQL Editor -> New Query).
-- It includes automatic profile triggers linked to Supabase Auth, Row Level Security (RLS) policies,
-- foreign keys, indexes, and initial configuration seeds.
-- =========================================================================

-- Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES / USERS TABLE
-- Maps to your custom User interface in types.ts.
-- It integrates with Supabase Auth schema (auth.users).
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    profile_picture TEXT,
    registration_date TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    wallet_balance NUMERIC(12, 2) DEFAULT 0.00 NOT NULL CHECK (wallet_balance >= 0.00),
    nin TEXT,
    is_admin BOOLEAN DEFAULT FALSE NOT NULL,
    
    -- Subscriptions fields embedded
    subscription_tier TEXT DEFAULT 'Starter' NOT NULL CHECK (subscription_tier IN ('Trial', 'Starter', 'Basic', 'Premium', 'Unlimited')),
    downloads_used INTEGER DEFAULT 0 NOT NULL CHECK (downloads_used >= 0),
    download_limit INTEGER DEFAULT 99999 NOT NULL CHECK (download_limit >= 0),
    subscription_expires_at TIMESTAMPTZ DEFAULT (TIMEZONE('utc'::text, NOW()) + INTERVAL '1 year') NOT NULL,
    
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Index for searching users
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- 2. TRANSACTIONS TABLE
-- Records credit (funding) and debit (downloads, upgrades) logs
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
    amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0.00),
    description TEXT NOT NULL,
    date TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(date DESC);

-- 3. SAVED SLIPS TABLE
-- Houses CAC corporate records generated/saved by users
CREATE TABLE IF NOT EXISTS public.saved_slips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    taxpayer_name TEXT NOT NULL,
    tin TEXT NOT NULL,
    cac_number TEXT NOT NULL,
    registered_address TEXT NOT NULL,
    lga TEXT,
    state TEXT,
    tax_office TEXT,
    phone TEXT,
    email TEXT,
    date_created TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_saved_slips_user_id ON public.saved_slips(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_slips_tin ON public.saved_slips(tin);

-- 4. PENDING TOPUPS TABLE
-- Handles manually submitted wallet bank transfer approvals for JTB admins
CREATE TABLE IF NOT EXISTS public.pending_topups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    user_email TEXT NOT NULL,
    user_name TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0.00),
    reference TEXT UNIQUE NOT NULL,
    date TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'approved', 'rejected'))
);

CREATE INDEX IF NOT EXISTS idx_pending_topups_user_id ON public.pending_topups(user_id);
CREATE INDEX IF NOT EXISTS idx_pending_topups_status ON public.pending_topups(status);

-- 5. SUPPORT CHATS TABLE
-- Manages conversations between agents and clients/AI
CREATE TABLE IF NOT EXISTS public.support_chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    user_email TEXT NOT NULL,
    user_name TEXT NOT NULL,
    is_rep_responding BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_support_chats_user_id ON public.support_chats(user_id);

-- 6. CHAT MESSAGES TABLE
-- Individual messages inside conversations
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID NOT NULL REFERENCES public.support_chats(id) ON DELETE CASCADE,
    sender TEXT NOT NULL CHECK (sender IN ('user', 'ai', 'admin')),
    text TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_chat_id ON public.chat_messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_timestamp ON public.chat_messages(timestamp ASC);

-- 7. PORTAL SYSTEM SETTINGS TABLE
-- Single row holding configurations (fee schemas, display copy, content lists)
CREATE TABLE IF NOT EXISTS public.portal_settings (
    id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    trial_fee NUMERIC(12, 2) DEFAULT 100.00 NOT NULL,
    on_demand_fee NUMERIC(12, 2) DEFAULT 750.00 NOT NULL,
    basic_fee NUMERIC(12, 2) DEFAULT 2500.00 NOT NULL,
    premium_fee NUMERIC(12, 2) DEFAULT 5000.00 NOT NULL,
    unlimited_fee NUMERIC(12, 2) DEFAULT 10000.00 NOT NULL,
    basic_limit INTEGER DEFAULT 5 NOT NULL,
    premium_limit INTEGER DEFAULT 50 NOT NULL,
    
    landing_title TEXT NOT NULL,
    landing_description TEXT NOT NULL,
    disclaimer_text TEXT NOT NULL,
    support_email TEXT NOT NULL,
    form_title TEXT NOT NULL,
    form_description TEXT NOT NULL,
    footer_disclaimer TEXT NOT NULL,
    footer_copyright_text TEXT NOT NULL,
    
    -- Storing complex lists as JSONB
    faqs JSONB NOT NULL DEFAULT '[]'::jsonb,
    features JSONB NOT NULL DEFAULT '[]'::jsonb,
    news_list JSONB NOT NULL DEFAULT '[]'::jsonb,
    benefits JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- =========================================================================
-- AUTO-TRIGGER FOR NEW PROFILE ON AUTH SIGNUP
-- =========================================================================
-- When a user registers through Supabase Auth, this function automatically
-- provisions their matching row in the public profiles database.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    full_name, 
    email, 
    profile_picture, 
    nin, 
    is_admin, 
    wallet_balance, 
    subscription_tier, 
    downloads_used, 
    download_limit, 
    subscription_expires_at
  )
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'JTB Agent'),
    new.email,
    new.raw_user_meta_data->>'profile_picture',
    new.raw_user_meta_data->>'nin',
    CASE WHEN new.email = 'seiminiyifafranklin@gmail.com' THEN TRUE ELSE FALSE END, -- Auto-escalate default super admin
    0.00,
    'Starter',
    0,
    99999,
    (NOW() + INTERVAL '1 year')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================================================
-- INITIAL SYSTEM SETTINGS SEED (DEFAULT_SETTINGS matching types.ts)
-- =========================================================================
INSERT INTO public.portal_settings (
    id,
    trial_fee,
    on_demand_fee,
    basic_fee,
    premium_fee,
    unlimited_fee,
    basic_limit,
    premium_limit,
    landing_title,
    landing_description,
    disclaimer_text,
    support_email,
    form_title,
    form_description,
    footer_disclaimer,
    footer_copyright_text,
    faqs,
    features,
    news_list,
    benefits
) VALUES (
    1,
    100.00,
    750.00,
    2500.00,
    5000.00,
    10000.00,
    5,
    50,
    'Download your JTB TIN Slip instantly.',
    'Need a physical copy of your Tax Identification Number? Use our secure portal to query the Joint Tax Board (JTB) registers, format your particulars, and generate your high-quality PDF slip ready for printing.',
    'Disclaimer: taxidpdf.com operates solely as a third-party helper wrapper facilitating official tax database queries. We do not issue corporate TIN registrations or represent state boards. All original ownership is preserved with the Nigeria Revenue Services (NRS) and the Joint Tax Board (JTB) of Nigeria.',
    'support@taxidpf.com',
    'Corporate JTB TIN Slip',
    'Fill in your business details exactly as registered with the CAC to automatically compile and align them in front of the official JTB PDF slip template.',
    'This website is an independent third-party wrapper to make CAC agents and business owners generate the JTB/NRS TIN as shown on the official website https://taxid.nrs.gov.ng/. We only work with the information available publicly on this website.',
    'TaxIDPDF Independent Document Utility. For corrections or updates, approach authorized physical state board offices.',
    '[
      {"q": "What is JTB?", "a": "The Joint Tax Board is the umbrella organization of all tax authorities in Nigeria."},
      {"q": "How can I verify a TIN?", "a": "You can verify the status of a TIN using the public NRS portal search fields."}
    ]'::jsonb,
    '[
      {"title": "CAC Integration", "desc": "Supply corporate RC Number to instantly pull up registered items."}
    ]'::jsonb,
    '[]'::jsonb,
    '["Instant Watermarked PDFs", "Wallet Instant Transfers", "Unlimited History Logs", "Full NRS/JTB Compliance"]'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- =========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================
-- Secure your tables to prevent unauthenticated users or malicious actors
-- from reading/writing others' data.

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_slips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_topups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_settings ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Allow public read on profiles (for agents lookup)" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Allow users to update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Transactions Policies
CREATE POLICY "Allow users to read own transactions" ON public.transactions
    FOR SELECT USING (auth.uid() = user_id OR (SELECT is_admin FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Allow users to insert own transactions" ON public.transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Saved Slips Policies
CREATE POLICY "Allow users to read own saved slips" ON public.saved_slips
    FOR SELECT USING (auth.uid() = user_id OR (SELECT is_admin FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Allow users to insert own slips" ON public.saved_slips
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Pending Topups Policies
CREATE POLICY "Allow users to read own topups" ON public.pending_topups
    FOR SELECT USING (auth.uid() = user_id OR (SELECT is_admin FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Allow users to create topups" ON public.pending_topups
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin update policy" ON public.pending_topups
    FOR UPDATE USING ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()));

-- Support Chats Policies
CREATE POLICY "Allow users to read/update own chats" ON public.support_chats
    FOR ALL USING (auth.uid() = user_id OR (SELECT is_admin FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Allow message exchange" ON public.chat_messages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.support_chats 
            WHERE id = chat_id AND (user_id = auth.uid() OR (SELECT is_admin FROM public.profiles WHERE id = auth.uid()))
        )
    );

-- Portal Settings Policies
CREATE POLICY "Allow public read of system settings" ON public.portal_settings
    FOR SELECT USING (true);

CREATE POLICY "Allow only admins to edit system settings" ON public.portal_settings
    FOR UPDATE USING ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()));
