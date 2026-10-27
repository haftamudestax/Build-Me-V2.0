DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = 'public.users'::regclass
          AND conname = 'users_role_allowed_values'
    ) THEN
        ALTER TABLE public.users
        ADD CONSTRAINT users_role_allowed_values
        CHECK (role IN ('user', 'moderator', 'admin', 'super_admin'));
    END IF;
END
$$;