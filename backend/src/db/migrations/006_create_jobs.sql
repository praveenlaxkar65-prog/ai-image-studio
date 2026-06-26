--- FILE: 006_create_jobs.sql ---

-- Processing jobs and workflow execution tracking table

CREATE TYPE job_type_enum AS ENUM (
    'single_tool',
    'multi_step_prompt'
);

CREATE TYPE job_status_enum AS ENUM (
    'queued',
    'processing',
    'completed',
    'failed'
);

CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    project_id UUID,
    job_type job_type_enum NOT NULL,
    steps JSONB NOT NULL DEFAULT '[]'::jsonb,
    overall_status job_status_enum NOT NULL DEFAULT 'queued',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_jobs_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE,

    CONSTRAINT fk_jobs_project
    FOREIGN KEY (project_id)
    REFERENCES projects(id)
    ON DELETE SET NULL
);

CREATE INDEX idx_jobs_user_id ON jobs(user_id);
CREATE INDEX idx_jobs_project_id ON jobs(project_id);
CREATE INDEX idx_jobs_status ON jobs(overall_status);
CREATE INDEX idx_jobs_type ON jobs(job_type);
CREATE INDEX idx_jobs_created_at ON jobs(created_at);
CREATE INDEX idx_jobs_steps_gin ON jobs USING GIN(steps);
