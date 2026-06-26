--- FILE: 005_create_projects.sql ---

-- User uploaded/generated project storage table

CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    file_url TEXT NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    storage_provider VARCHAR(255),
    metadata JSONB,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '12 hours'),
    is_permanent BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_projects_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE
);

CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_file_type ON projects(file_type);
CREATE INDEX idx_projects_storage_provider ON projects(storage_provider);
CREATE INDEX idx_projects_expires_at ON projects(expires_at);
CREATE INDEX idx_projects_is_permanent ON projects(is_permanent);
