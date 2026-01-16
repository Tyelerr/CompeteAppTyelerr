-- Script to set up a test bar owner for venue performance testing
-- Replace 'your-user-email@example.com' with your actual user email

-- Step 1: Update user role to BarAdmin (replace email with your actual email)
UPDATE profiles 
SET role = 'BarAdmin'
WHERE email = 'your-user-email@example.com';  -- CHANGE THIS TO YOUR EMAIL

-- Step 2: Get the user ID and venue IDs for assignment
DO $$
DECLARE
    test_user_id INTEGER;
    venue1_id INTEGER;
    venue2_id INTEGER;
    venue3_id INTEGER;
BEGIN
    -- Get user ID (replace email with your actual email)
    SELECT id_auto INTO test_user_id 
    FROM profiles 
    WHERE email = 'your-user-email@example.com'  -- CHANGE THIS TO YOUR EMAIL
    LIMIT 1;
    
    IF test_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found. Please update the email in this script to match your user account.';
    END IF;
    
    -- Get venue IDs
    SELECT id INTO venue1_id FROM venues WHERE venue = 'The Pool Hall' LIMIT 1;
    SELECT id INTO venue2_id FROM venues WHERE venue = 'Billiards Central' LIMIT 1;
    SELECT id INTO venue3_id FROM venues WHERE venue = 'Corner Pocket Bar' LIMIT 1;
    
    -- Assign user as bar owner to all test venues
    IF venue1_id IS NOT NULL THEN
        UPDATE venues SET barowner_id = test_user_id WHERE id = venue1_id;
        RAISE NOTICE 'Assigned user % as bar owner of The Pool Hall (venue ID: %)', test_user_id, venue1_id;
    END IF;
    
    IF venue2_id IS NOT NULL THEN
        UPDATE venues SET barowner_id = test_user_id WHERE id = venue2_id;
        RAISE NOTICE 'Assigned user % as bar owner of Billiards Central (venue ID: %)', test_user_id, venue2_id;
    END IF;
    
    IF venue3_id IS NOT NULL THEN
        UPDATE venues SET barowner_id = test_user_id WHERE id = venue3_id;
        RAISE NOTICE 'Assigned user % as bar owner of Corner Pocket Bar (venue ID: %)', test_user_id, venue3_id;
    END IF;
    
    RAISE NOTICE 'Bar owner setup complete! User % now owns all test venues.', test_user_id;
END $$;

-- Verify the setup
SELECT 
    p.id_auto as user_id,
    p.email,
    p.role,
    v.id as venue_id,
    v.venue as venue_name
FROM profiles p
JOIN venues v ON p.id_auto = v.barowner_id
WHERE v.venue IN ('The Pool Hall', 'Billiards Central', 'Corner Pocket Bar')
ORDER BY v.venue;
