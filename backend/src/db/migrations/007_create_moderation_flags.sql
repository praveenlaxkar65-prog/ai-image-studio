--- FILE: 007_create_moderation_flags.sql ---

-- Content moderation and review workflow table

CREATE TYPE moderation_flag_type_enum AS ENUM (
    'nsfw',
    'deepfake',
    'copyright'
);

CREATE TYPE moderation_review_status_enum AS ENUM (
    'pending',
    'approved',
    'rejected'
);

CREATE TABLE moderation_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL,
    flag_reason VARCHAR(500),
    flag_type moderation_flag_type_enum NOT NULL,
    review_status moderation_review_status_enum NOT NULL DEFAULT 'pending',
    reviewed_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_moderation_project
    FOREIGN KEY (project_id)
    REFERENCES projects(id)
    ON DELETE CASCADE,

    CONSTRAINT fk_moderation_reviewer
    FOREIGN KEY (reviewed_by)
    REFERENCES users(id)
    ON DELETE SET NULL
);

CREATE INDEX idx_moderation_project_id ON moderation_flags(project_id);
CREATE INDEX idx_moderation_flag_type ON moderation_flags(flag_type);
CREATE INDEX idx_moderation_review_status ON moderation_flags(review_status);
CREATE INDEX idx_moderation_reviewed_by ON moderation_flags(reviewed_by);
