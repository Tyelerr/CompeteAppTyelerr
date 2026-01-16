-- Drop the old fn_pick_random_winners function that is no longer used
-- This function was created during initial setup but the app now uses client-side random selection

-- Drop all versions of the function (in case there are multiple signatures)
DROP FUNCTION IF EXISTS public.fn_pick_random_winners(uuid, integer);
DROP FUNCTION IF EXISTS public.fn_pick_random_winners(text, integer);
DROP FUNCTION IF EXISTS public.fn_pick_random_winners(uuid, int);
DROP FUNCTION IF EXISTS public.fn_pick_random_winners(text, int);

-- Also check for any variations with p_ prefix
DROP FUNCTION IF EXISTS public.fn_pick_random_winners(p_giveaway_id uuid, p_n integer);
DROP FUNCTION IF EXISTS public.fn_pick_random_winners(p_giveaway_id text, p_n integer);
DROP FUNCTION IF EXISTS public.fn_pick_random_winners(p_giveaway_id uuid, p_n int);
DROP FUNCTION IF EXISTS public.fn_pick_random_winners(p_giveaway_id text, p_n int);

-- Verify the function is gone
SELECT 
    routine_name, 
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%pick%random%winner%';
