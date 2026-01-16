-- Mock data for testing venue performance and time period filtering
-- This script creates mock tournaments, venues, and tournament likes with various timestamps

-- First, let's create some mock venues if they don't exist
-- Check if venues already exist before inserting
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM venues WHERE venue = 'The Pool Hall') THEN
        INSERT INTO venues (venue, address, phone, created_at) 
        VALUES ('The Pool Hall', '123 Main St, Austin, TX 78701', '512-555-0101', NOW() - INTERVAL '30 days');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM venues WHERE venue = 'Billiards Central') THEN
        INSERT INTO venues (venue, address, phone, created_at) 
        VALUES ('Billiards Central', '456 Oak Ave, Dallas, TX 75201', '214-555-0102', NOW() - INTERVAL '25 days');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM venues WHERE venue = 'Corner Pocket Bar') THEN
        INSERT INTO venues (venue, address, phone, created_at) 
        VALUES ('Corner Pocket Bar', '789 Pine St, Houston, TX 77001', '713-555-0103', NOW() - INTERVAL '20 days');
    END IF;
END $$;

-- Get venue IDs for reference and create tournaments and likes
DO $$
DECLARE
    venue1_id INTEGER;
    venue2_id INTEGER;
    venue3_id INTEGER;
    tournament1_id INTEGER;
    tournament2_id INTEGER;
    tournament3_id INTEGER;
    tournament4_id INTEGER;
    tournament5_id INTEGER;
    tournament6_id INTEGER;
    user1_id UUID;
    user2_id UUID;
    user3_id UUID;
    user4_id UUID;
    user5_id UUID;
BEGIN
    -- Get venue IDs
    SELECT id INTO venue1_id FROM venues WHERE venue = 'The Pool Hall' LIMIT 1;
    SELECT id INTO venue2_id FROM venues WHERE venue = 'Billiards Central' LIMIT 1;
    SELECT id INTO venue3_id FROM venues WHERE venue = 'Corner Pocket Bar' LIMIT 1;

    -- Create mock tournaments for different time periods (check if they exist first)
    IF NOT EXISTS (SELECT 1 FROM tournaments WHERE id_unique_number = 1001) THEN
        INSERT INTO tournaments (
            tournament_name, game_type, format, director_name, venue, venue_id,
            address, start_date, tournament_fee, status, created_at, id_unique_number
        ) VALUES 
        ('Daily 8-Ball Championship', '8-ball', 'Single Elimination', 'John Smith', 'The Pool Hall', venue1_id,
         '123 Main St', NOW() + INTERVAL '2 days', 25.00, 'approved', NOW() - INTERVAL '12 hours', 1001);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM tournaments WHERE id_unique_number = 1002) THEN
        INSERT INTO tournaments (
            tournament_name, game_type, format, director_name, venue, venue_id,
            address, start_date, tournament_fee, status, created_at, id_unique_number
        ) VALUES 
        ('Weekly 9-Ball Tournament', '9-ball', 'Double Elimination', 'Jane Doe', 'Billiards Central', venue2_id,
         '456 Oak Ave', NOW() + INTERVAL '5 days', 35.00, 'approved', NOW() - INTERVAL '5 days', 1002);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM tournaments WHERE id_unique_number = 1003) THEN
        INSERT INTO tournaments (
            tournament_name, game_type, format, director_name, venue, venue_id,
            address, start_date, tournament_fee, status, created_at, id_unique_number
        ) VALUES 
        ('Corner Pocket Classic', '10-ball', 'Round Robin', 'Mike Johnson', 'Corner Pocket Bar', venue3_id,
         '789 Pine St', NOW() + INTERVAL '7 days', 50.00, 'approved', NOW() - INTERVAL '6 days', 1003);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM tournaments WHERE id_unique_number = 1004) THEN
        INSERT INTO tournaments (
            tournament_name, game_type, format, director_name, venue, venue_id,
            address, start_date, tournament_fee, status, created_at, id_unique_number
        ) VALUES 
        ('Monthly Masters', '8-ball', 'Single Elimination', 'Sarah Wilson', 'The Pool Hall', venue1_id,
         '123 Main St', NOW() + INTERVAL '10 days', 75.00, 'approved', NOW() - INTERVAL '15 days', 1004);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM tournaments WHERE id_unique_number = 1005) THEN
        INSERT INTO tournaments (
            tournament_name, game_type, format, director_name, venue, venue_id,
            address, start_date, tournament_fee, status, created_at, id_unique_number
        ) VALUES 
        ('Billiards Bonanza', '9-ball', 'Swiss System', 'Tom Brown', 'Billiards Central', venue2_id,
         '456 Oak Ave', NOW() + INTERVAL '12 days', 40.00, 'approved', NOW() - INTERVAL '20 days', 1005);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM tournaments WHERE id_unique_number = 1006) THEN
        INSERT INTO tournaments (
            tournament_name, game_type, format, director_name, venue, venue_id,
            address, start_date, tournament_fee, status, created_at, id_unique_number
        ) VALUES 
        ('Annual Championship', '10-ball', 'Double Elimination', 'Lisa Davis', 'Corner Pocket Bar', venue3_id,
         '789 Pine St', NOW() + INTERVAL '15 days', 100.00, 'approved', NOW() - INTERVAL '45 days', 1006);
    END IF;

    -- Get tournament IDs
    SELECT id INTO tournament1_id FROM tournaments WHERE id_unique_number = 1001 LIMIT 1;
    SELECT id INTO tournament2_id FROM tournaments WHERE id_unique_number = 1002 LIMIT 1;
    SELECT id INTO tournament3_id FROM tournaments WHERE id_unique_number = 1003 LIMIT 1;
    SELECT id INTO tournament4_id FROM tournaments WHERE id_unique_number = 1004 LIMIT 1;
    SELECT id INTO tournament5_id FROM tournaments WHERE id_unique_number = 1005 LIMIT 1;
    SELECT id INTO tournament6_id FROM tournaments WHERE id_unique_number = 1006 LIMIT 1;

    -- Create mock users if they don't exist
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = '550e8400-e29b-41d4-a716-446655440001') THEN
        INSERT INTO profiles (id, user_name, name, email, role, created_at)
        VALUES ('550e8400-e29b-41d4-a716-446655440001', 'player1', 'Alex Player', 'alex@example.com', 'User', NOW() - INTERVAL '60 days');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = '550e8400-e29b-41d4-a716-446655440002') THEN
        INSERT INTO profiles (id, user_name, name, email, role, created_at)
        VALUES ('550e8400-e29b-41d4-a716-446655440002', 'player2', 'Bob Shooter', 'bob@example.com', 'User', NOW() - INTERVAL '55 days');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = '550e8400-e29b-41d4-a716-446655440003') THEN
        INSERT INTO profiles (id, user_name, name, email, role, created_at)
        VALUES ('550e8400-e29b-41d4-a716-446655440003', 'player3', 'Carol Cue', 'carol@example.com', 'User', NOW() - INTERVAL '50 days');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = '550e8400-e29b-41d4-a716-446655440004') THEN
        INSERT INTO profiles (id, user_name, name, email, role, created_at)
        VALUES ('550e8400-e29b-41d4-a716-446655440004', 'player4', 'Dave Rack', 'dave@example.com', 'User', NOW() - INTERVAL '45 days');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = '550e8400-e29b-41d4-a716-446655440005') THEN
        INSERT INTO profiles (id, user_name, name, email, role, created_at)
        VALUES ('550e8400-e29b-41d4-a716-446655440005', 'player5', 'Eve Break', 'eve@example.com', 'User', NOW() - INTERVAL '40 days');
    END IF;

    -- Set user IDs
    user1_id := '550e8400-e29b-41d4-a716-446655440001';
    user2_id := '550e8400-e29b-41d4-a716-446655440002';
    user3_id := '550e8400-e29b-41d4-a716-446655440003';
    user4_id := '550e8400-e29b-41d4-a716-446655440004';
    user5_id := '550e8400-e29b-41d4-a716-446655440005';

    -- Delete existing likes for these tournaments to avoid duplicates
    DELETE FROM likes WHERE turnament_id IN (tournament1_id, tournament2_id, tournament3_id, tournament4_id, tournament5_id, tournament6_id);
    DELETE FROM tournament_likes_history WHERE tournament_id IN (tournament1_id, tournament2_id, tournament3_id, tournament4_id, tournament5_id, tournament6_id);
    DELETE FROM tournament_views WHERE tournament_id IN (tournament1_id, tournament2_id, tournament3_id, tournament4_id, tournament5_id, tournament6_id);

    -- Insert tournament likes with various timestamps for testing time period filters
    
    -- Recent likes (last 24 hours) - for tournament1
    INSERT INTO likes (turnament_id, user_id, is_liked, created_at) VALUES
    (tournament1_id, user1_id, true, NOW() - INTERVAL '2 hours'),
    (tournament1_id, user2_id, true, NOW() - INTERVAL '5 hours'),
    (tournament1_id, user3_id, true, NOW() - INTERVAL '8 hours'),
    (tournament1_id, user4_id, true, NOW() - INTERVAL '12 hours'),
    (tournament1_id, user5_id, true, NOW() - INTERVAL '18 hours');

    -- Last week likes - for tournament2 and tournament3
    INSERT INTO likes (turnament_id, user_id, is_liked, created_at) VALUES
    (tournament2_id, user1_id, true, NOW() - INTERVAL '2 days'),
    (tournament2_id, user2_id, true, NOW() - INTERVAL '3 days'),
    (tournament2_id, user3_id, true, NOW() - INTERVAL '4 days'),
    (tournament3_id, user1_id, true, NOW() - INTERVAL '5 days'),
    (tournament3_id, user4_id, true, NOW() - INTERVAL '6 days'),
    (tournament3_id, user5_id, true, NOW() - INTERVAL '6 days');

    -- Last month likes - for tournament4 and tournament5
    INSERT INTO likes (turnament_id, user_id, is_liked, created_at) VALUES
    (tournament4_id, user1_id, true, NOW() - INTERVAL '10 days'),
    (tournament4_id, user2_id, true, NOW() - INTERVAL '12 days'),
    (tournament4_id, user3_id, true, NOW() - INTERVAL '15 days'),
    (tournament4_id, user4_id, true, NOW() - INTERVAL '18 days'),
    (tournament5_id, user1_id, true, NOW() - INTERVAL '20 days'),
    (tournament5_id, user2_id, true, NOW() - INTERVAL '22 days'),
    (tournament5_id, user5_id, true, NOW() - INTERVAL '25 days');

    -- Older likes (more than a month) - for tournament6
    INSERT INTO likes (turnament_id, user_id, is_liked, created_at) VALUES
    (tournament6_id, user1_id, true, NOW() - INTERVAL '35 days'),
    (tournament6_id, user2_id, true, NOW() - INTERVAL '40 days'),
    (tournament6_id, user3_id, true, NOW() - INTERVAL '42 days'),
    (tournament6_id, user4_id, true, NOW() - INTERVAL '45 days'),
    (tournament6_id, user5_id, true, NOW() - INTERVAL '50 days');

    -- Also insert some tournament likes history for comprehensive tracking
    INSERT INTO tournament_likes_history (tournament_id, user_id, action, created_at) VALUES
    -- Recent activity
    (tournament1_id, user1_id, 'liked', NOW() - INTERVAL '2 hours'),
    (tournament1_id, user2_id, 'liked', NOW() - INTERVAL '5 hours'),
    (tournament1_id, user3_id, 'liked', NOW() - INTERVAL '8 hours'),
    (tournament1_id, user4_id, 'liked', NOW() - INTERVAL '12 hours'),
    (tournament1_id, user5_id, 'liked', NOW() - INTERVAL '18 hours'),
    
    -- Weekly activity
    (tournament2_id, user1_id, 'liked', NOW() - INTERVAL '2 days'),
    (tournament2_id, user2_id, 'liked', NOW() - INTERVAL '3 days'),
    (tournament2_id, user3_id, 'liked', NOW() - INTERVAL '4 days'),
    (tournament3_id, user1_id, 'liked', NOW() - INTERVAL '5 days'),
    (tournament3_id, user4_id, 'liked', NOW() - INTERVAL '6 days'),
    (tournament3_id, user5_id, 'liked', NOW() - INTERVAL '6 days'),
    
    -- Monthly activity
    (tournament4_id, user1_id, 'liked', NOW() - INTERVAL '10 days'),
    (tournament4_id, user2_id, 'liked', NOW() - INTERVAL '12 days'),
    (tournament4_id, user3_id, 'liked', NOW() - INTERVAL '15 days'),
    (tournament4_id, user4_id, 'liked', NOW() - INTERVAL '18 days'),
    (tournament5_id, user1_id, 'liked', NOW() - INTERVAL '20 days'),
    (tournament5_id, user2_id, 'liked', NOW() - INTERVAL '22 days'),
    (tournament5_id, user5_id, 'liked', NOW() - INTERVAL '25 days'),
    
    -- Older activity
    (tournament6_id, user1_id, 'liked', NOW() - INTERVAL '35 days'),
    (tournament6_id, user2_id, 'liked', NOW() - INTERVAL '40 days'),
    (tournament6_id, user3_id, 'liked', NOW() - INTERVAL '42 days'),
    (tournament6_id, user4_id, 'liked', NOW() - INTERVAL '45 days'),
    (tournament6_id, user5_id, 'liked', NOW() - INTERVAL '50 days');

    -- Insert some tournament views for testing
    INSERT INTO tournament_views (tournament_id, user_id, created_at) VALUES
    -- Recent views
    (tournament1_id, user1_id, NOW() - INTERVAL '1 hour'),
    (tournament1_id, user2_id, NOW() - INTERVAL '3 hours'),
    (tournament1_id, user3_id, NOW() - INTERVAL '6 hours'),
    (tournament1_id, user4_id, NOW() - INTERVAL '10 hours'),
    (tournament1_id, user5_id, NOW() - INTERVAL '15 hours'),
    
    -- Weekly views
    (tournament2_id, user1_id, NOW() - INTERVAL '1 day'),
    (tournament2_id, user2_id, NOW() - INTERVAL '2 days'),
    (tournament2_id, user3_id, NOW() - INTERVAL '3 days'),
    (tournament3_id, user1_id, NOW() - INTERVAL '4 days'),
    (tournament3_id, user4_id, NOW() - INTERVAL '5 days'),
    
    -- Monthly views
    (tournament4_id, user1_id, NOW() - INTERVAL '8 days'),
    (tournament4_id, user2_id, NOW() - INTERVAL '11 days'),
    (tournament5_id, user1_id, NOW() - INTERVAL '19 days'),
    (tournament5_id, user2_id, NOW() - INTERVAL '21 days'),
    
    -- Older views
    (tournament6_id, user1_id, NOW() - INTERVAL '33 days'),
    (tournament6_id, user2_id, NOW() - INTERVAL '38 days');

    RAISE NOTICE 'Mock venue performance data inserted successfully!';
    RAISE NOTICE 'Venues created: The Pool Hall (ID: %), Billiards Central (ID: %), Corner Pocket Bar (ID: %)', venue1_id, venue2_id, venue3_id;
    RAISE NOTICE 'Tournaments created with IDs: %, %, %, %, %, %', tournament1_id, tournament2_id, tournament3_id, tournament4_id, tournament5_id, tournament6_id;
    RAISE NOTICE 'Expected likes by time period:';
    RAISE NOTICE '- Last 24 hours: 5 likes (tournament 1001)';
    RAISE NOTICE '- Last week: 11 likes (tournaments 1001, 1002, 1003)';
    RAISE NOTICE '- Last month: 18 likes (tournaments 1001-1005)';
    RAISE NOTICE '- Last year/lifetime: 23 likes (all tournaments)';

END $$;

-- Verify the data was inserted
SELECT 
    'Venues' as table_name,
    COUNT(*) as count
FROM venues 
WHERE venue IN ('The Pool Hall', 'Billiards Central', 'Corner Pocket Bar')

UNION ALL

SELECT 
    'Tournaments' as table_name,
    COUNT(*) as count
FROM tournaments 
WHERE id_unique_number BETWEEN 1001 AND 1006

UNION ALL

SELECT 
    'Tournament Likes' as table_name,
    COUNT(*) as count
FROM likes l
JOIN tournaments t ON l.turnament_id = t.id
WHERE t.id_unique_number BETWEEN 1001 AND 1006

UNION ALL

SELECT 
    'Tournament Views' as table_name,
    COUNT(*) as count
FROM tournament_views tv
JOIN tournaments t ON tv.tournament_id = t.id
WHERE t.id_unique_number BETWEEN 1001 AND 1006;
