-- ============================================================================
-- FIX: Role case mismatch issue
-- Your role is 'bar-admin' but policy checks for 'BarAdmin'
-- This updates the policy to accept both formats
-- ============================================================================

-- Drop the existing policy
DROP POLICY IF EXISTS "bar_owners_can_insert_venues" ON venues CASCADE;

-- Create new policy that handles BOTH role formats
CREATE POLICY "bar_owners_can_insert_venues" ON venues
FOR INSERT
TO authenticated
WITH CHECK (
    -- Allow BarAdmin OR bar-admin (case insensitive, handles hyphen)
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND (
            profiles.role ILIKE 'BarAdmin' 
            OR profiles.role ILIKE 'bar-admin'
            OR profiles.role ILIKE 'bar_admin'
        )
    )
    OR
    -- Allow BarOwner OR bar-owner (case insensitive, handles hyphen)
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND (
            profiles.role ILIKE 'BarOwner'
            OR profiles.role ILIKE 'bar-owner'
            OR profiles.role ILIKE 'bar_owner'
        )
        AND profiles.id_auto = venues.barowner_id
    )
);

-- Verify the policy was created
SELECT 
    policyname,
    cmd,
    with_check
FROM pg_policies 
WHERE tablename = 'venues' 
AND policyname = 'bar_owners_can_insert_venues';
