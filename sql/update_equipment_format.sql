-- Update equipment values from kebab-case to Title Case
-- This ensures consistency with the new dropdown values

UPDATE tournaments
SET equipment = 'Diamond Tables'
WHERE LOWER(equipment) = 'diamond-tables' OR equipment = 'diamond-tables';

UPDATE tournaments
SET equipment = 'Rasson Tables'
WHERE LOWER(equipment) = 'rasson-tables' OR equipment = 'rasson-tables';

UPDATE tournaments
SET equipment = 'Predator Tables'
WHERE LOWER(equipment) = 'predator-tables' OR equipment = 'predator-tables';

UPDATE tournaments
SET equipment = 'Brunswick Gold Crowns'
WHERE LOWER(equipment) = 'brunswick-gold-crowns' OR equipment = 'brunswick-gold-crowns';

UPDATE tournaments
SET equipment = 'Valley Tables'
WHERE LOWER(equipment) = 'valley-tables' OR equipment = 'valley-tables';

UPDATE tournaments
SET equipment = 'Gabriel Carom Tables'
WHERE LOWER(equipment) = 'gabriel-carom-tables' OR equipment = 'gabriel-carom-tables';

-- Verify the updates
SELECT equipment, COUNT(*) as count
FROM tournaments
WHERE equipment IS NOT NULL AND equipment != ''
GROUP BY equipment
ORDER BY equipment;
