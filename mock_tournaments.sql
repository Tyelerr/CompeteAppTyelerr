-- Delete all likes referencing tournaments first to avoid foreign key constraint errors
DELETE FROM public.likes;

-- Then delete all existing tournaments
DELETE FROM public.tournaments;

-- Insert mock tournament data for testing
INSERT INTO public.tournaments (
  id, tournament_name, game_type, format, director_name, equipment, custom_equipment,
  is_recurring, reports_to_fargo, is_open_tournament, description, game_spot, venue,
  venue_lat, venue_lng, address, phone, thumbnail_type, thumbnail_url, start_date,
  race_details, table_size, number_of_tables, max_fargo, tournament_fee, uuid,
  id_unique_number, side_pots, point_location, venue_id, status
) VALUES
  (
    gen_random_uuid(),
    'Mock Tournament 1',
    '8-ball',
    'double-elimination',
    'Director A',
    'Standard',
    '',
    false,
    true,
    true,
    'Description for Mock Tournament 1',
    'Game Spot 1',
    'Venue 1',
    40.7128,
    -74.0060,
    '123 Main St, New York, NY',
    '555-1234',
    'default',
    '',
    '2025-07-01 10:00:00+00',
    'Race to 7',
    '9ft',
    4,
    900,
    50,
    NULL,
    1,
    ARRAY['{"potName": "Side Pot 1", "amount": 100}']::json[],
    'POINT(-74.0060 40.7128)',
    1,
    'approved'
  ),
  (
    gen_random_uuid(),
    'Mock Tournament 2',
    '9-ball',
    'round-robin',
    'Director B',
    'Custom',
    'Custom Cue',
    true,
    false,
    false,
    'Description for Mock Tournament 2',
    'Game Spot 2',
    'Venue 2',
    34.0522,
    -118.2437,
    '456 Elm St, Los Angeles, CA',
    '555-5678',
    'default',
    '',
    '2025-07-05 14:00:00+00',
    'Race to 9',
    '7ft',
    6,
    850,
    75,
    NULL,
    2,
    ARRAY['{"potName": "Side Pot A", "amount": 150}']::json[],
    'POINT(-118.2437 34.0522)',
    2,
    'approved'
  );

-- Add more mock data as needed
