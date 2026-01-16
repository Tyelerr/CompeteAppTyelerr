-- Create junction table for multiple tournament directors per venue
-- This allows venues to have multiple tournament directors assigned

-- Create the venue_tournament_directors table
CREATE TABLE IF NOT EXISTS public.venue_tournament_directors (
  id BIGSERIAL PRIMARY KEY,
  venue_id BIGINT NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  user_id_auto BIGINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(venue_id, user_id_auto) -- Prevent duplicate assignments
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_venue_tournament_directors_venue_id 
ON public.venue_tournament_directors(venue_id);

CREATE INDEX IF NOT EXISTS idx_venue_tournament_directors_user_id_auto 
ON public.venue_tournament_directors(user_id_auto);

-- Enable RLS
ALTER TABLE public.venue_tournament_directors ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- Allow authenticated users to read venue_tournament_directors
CREATE POLICY "Anyone can view venue tournament directors"
ON public.venue_tournament_directors
FOR SELECT
TO authenticated
USING (true);

-- Allow bar owners to insert TDs for their venues
CREATE POLICY "Bar owners can assign TDs to their venues"
ON public.venue_tournament_directors
FOR INSERT
TO authenticated
WITH CHECK (
  venue_id IN (
    SELECT id FROM public.venues 
    WHERE barowner_id = (SELECT id_auto FROM public.profiles WHERE id = auth.uid())
  )
  OR
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('MasterAdministrator', 'CompeteAdmin', 'BarAdmin')
);

-- Allow bar owners to delete TDs from their venues
CREATE POLICY "Bar owners can remove TDs from their venues"
ON public.venue_tournament_directors
FOR DELETE
TO authenticated
USING (
  venue_id IN (
    SELECT id FROM public.venues 
    WHERE barowner_id = (SELECT id_auto FROM public.profiles WHERE id = auth.uid())
  )
  OR
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('MasterAdministrator', 'CompeteAdmin', 'BarAdmin')
);

-- Verify the table was created
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'venue_tournament_directors'
ORDER BY ordinal_position;

-- Verify RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'venue_tournament_directors';
