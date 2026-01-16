-- Check the actual columns in the tournaments table

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'tournaments'
ORDER BY ordinal_position;
