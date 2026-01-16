-- Add email and phone_number columns to giveaway_entries table
-- Run this in your Supabase SQL Editor

ALTER TABLE giveaway_entries 
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_giveaway_entries_email ON giveaway_entries(email);
CREATE INDEX IF NOT EXISTS idx_giveaway_entries_phone_number ON giveaway_entries(phone_number);

-- Verify the columns were added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'giveaway_entries'
AND column_name IN ('email', 'phone_number');
