-- Check what unique constraints exist on tournaments table

SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'tournaments'::regclass
AND contype = 'u';  -- unique constraints

-- Also check indexes
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'tournaments'
AND indexdef LIKE '%UNIQUE%';
