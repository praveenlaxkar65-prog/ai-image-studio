--- FILE: 002_create_tools_config.sql ---

-- Tool configuration table for provider assignment and credit rules

CREATE TYPE tool_category_enum AS ENUM (
    'basic',
    'enhance',
    'ai_edit',
    'generate',
    'convert'
);

CREATE TABLE tools_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tool_key VARCHAR(150) NOT NULL UNIQUE,
    tool_name VARCHAR(255) NOT NULL,
    category tool_category_enum NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_free BOOLEAN NOT NULL DEFAULT FALSE,
    credit_cost INTEGER NOT NULL DEFAULT 0,
    assigned_provider_id UUID,
    fallback_provider_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tools_config_tool_key ON tools_config(tool_key);
CREATE INDEX idx_tools_config_category ON tools_config(category);
CREATE INDEX idx_tools_config_active ON tools_config(is_active);
CREATE INDEX idx_tools_config_assigned_provider ON tools_config(assigned_provider_id);
CREATE INDEX idx_tools_config_fallback_provider ON tools_config(fallback_provider_id);
