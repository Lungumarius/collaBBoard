-- Add avatar_url column to users table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'app_auth'
        AND table_name = 'users'
        AND column_name = 'avatar_url'
    ) THEN
        ALTER TABLE app_auth.users ADD COLUMN avatar_url VARCHAR(512);
    END IF;
END $$;
