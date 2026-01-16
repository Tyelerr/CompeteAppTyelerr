-- Add primary key to tournaments_archive table
-- This allows direct deletion of archived tournaments from the Supabase dashboard

-- The 'id' column already exists (copied from tournaments table structure)
-- We just need to make it the primary key

ALTER TABLE tournaments_archive 
ADD PRIMARY KEY (id);

-- Verify the primary key was added
SELECT 
    tc.table_name, 
    kcu.column_name,
    tc.constraint_type
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'tournaments_archive' 
    AND tc.constraint_type = 'PRIMARY KEY';

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Primary key added to tournaments_archive table successfully!';
    RAISE NOTICE 'You can now delete rows directly from the Supabase dashboard.';
END $$;
