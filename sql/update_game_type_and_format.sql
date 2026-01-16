-- Update game_type values from kebab-case to Title Case
UPDATE tournaments
SET game_type = '8-Ball'
WHERE LOWER(game_type) = '8-ball' OR game_type = '8-ball';

UPDATE tournaments
SET game_type = '9-Ball'
WHERE LOWER(game_type) = '9-ball' OR game_type = '9-ball';

UPDATE tournaments
SET game_type = '10-Ball'
WHERE LOWER(game_type) = '10-ball' OR game_type = '10-ball';

UPDATE tournaments
SET game_type = 'One Pocket'
WHERE LOWER(game_type) = 'one-pocket' OR game_type = 'one-pocket' OR LOWER(game_type) = 'one pocket';

UPDATE tournaments
SET game_type = 'Straight Pool'
WHERE LOWER(game_type) = 'straight-pool' OR game_type = 'straight-pool' OR LOWER(game_type) = 'straight pool';

UPDATE tournaments
SET game_type = 'Bank Pool'
WHERE LOWER(game_type) = 'bank-pool' OR game_type = 'bank-pool' OR LOWER(game_type) = 'bank pool';

-- Update format values from kebab-case to Title Case
UPDATE tournaments
SET format = 'Single Elimination'
WHERE LOWER(format) = 'single-elimination' OR format = 'single-elimination' OR LOWER(format) = 'single elimination';

UPDATE tournaments
SET format = 'Double Elimination'
WHERE LOWER(format) = 'double-elimination' OR format = 'double-elimination' OR LOWER(format) = 'double elimination';

UPDATE tournaments
SET format = 'Round Robin'
WHERE LOWER(format) = 'round-robin' OR format = 'round-robin' OR LOWER(format) = 'round robin';

UPDATE tournaments
SET format = 'Double Round Robin'
WHERE LOWER(format) = 'double-round-robin' OR format = 'double-round-robin' OR LOWER(format) = 'double round robin';

UPDATE tournaments
SET format = 'Swiss System'
WHERE LOWER(format) = 'swiss-system' OR format = 'swiss-system' OR LOWER(format) = 'swiss system';

UPDATE tournaments
SET format = 'Chip Tournament'
WHERE LOWER(format) = 'chip-tournament' OR format = 'chip-tournament' OR LOWER(format) = 'chip tournament';

-- Verify the updates
SELECT game_type, COUNT(*) as count
FROM tournaments
WHERE game_type IS NOT NULL AND game_type != ''
GROUP BY game_type
ORDER BY game_type;

SELECT format, COUNT(*) as count
FROM tournaments
WHERE format IS NOT NULL AND format != ''
GROUP BY format
ORDER BY format;
