DROP SCHEMA IF EXISTS app_auth CASCADE;

CREATE SCHEMA app_auth;
ALTER SCHEMA app_auth OWNER TO postgres;

CREATE TABLE app_auth.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(512),
    is_active BOOLEAN DEFAULT true,
    is_email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE app_auth.refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES app_auth.users(id) ON DELETE CASCADE,
    token VARCHAR(512) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON app_auth.users(email);
CREATE INDEX idx_refresh_tokens_token ON app_auth.refresh_tokens(token);

ALTER TABLE app_auth.users OWNER TO postgres;
ALTER TABLE app_auth.refresh_tokens OWNER TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA app_auth TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA app_auth TO postgres;
