-- Replace 'c97d4dff-07cd-4112-8de1-542f0256991c' with your actual user UUID
DO $$
BEGIN
  -- Reinsert profile for the user if missing
  INSERT INTO profiles (id, email, created_at)
  SELECT id, email, NOW()
  FROM auth.users
  WHERE id = 'c97d4dff-07cd-4112-8de1-542f0256991c'
  ON CONFLICT (id) DO NOTHING;

  -- Grant master admin permissions
  INSERT INTO permissions (id_user_need_permission, permission_name, granted_at)
  VALUES ('c97d4dff-07cd-4112-8de1-542f0256991c', 'master_admin', NOW())
  ON CONFLICT (id_user_need_permission, permission_name) DO NOTHING;
END $$;
