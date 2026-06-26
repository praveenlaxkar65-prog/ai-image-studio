--- FILE: 009_create_analytics_logs.sql ---

-- Analytics and activity tracking table

CREATE TABLE analytics_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    event_type VARCHAR(255) NOT NULL,
    event_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_analytics_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE SET NULL
);

CREATE INDEX idx_analytics_user_id ON analytics_logs(user_id);
CREATE INDEX idx_analytics_event_type ON analytics_logs(event_type);
CREATE INDEX idx_analytics_created_at ON analytics_logs(created_at);
CREATE INDEX idx_analytics_event_data_gin ON analytics_logs USING GIN(event_data);
