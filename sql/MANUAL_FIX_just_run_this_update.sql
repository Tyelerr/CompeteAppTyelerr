-- MANUAL FIX - Just run this UPDATE statement directly
-- No functions, no errors, just updates the status

-- Step 1: Update past tournaments to archived status
UPDATE tournaments
SET status = 'archived'
WHERE start_date < CURRENT_DATE 
AND status = 'active';

-- This will return the number of rows updated
-- You should see something like "UPDATE 5" meaning 5 tournaments were archived

-- Step 2: To generate new recurring tournaments, you'll need to do it manually
-- or fix the generate_recurring_tournaments_horizon() function first
-- For now, just focus on cleaning up past tournaments with the UPDATE above
