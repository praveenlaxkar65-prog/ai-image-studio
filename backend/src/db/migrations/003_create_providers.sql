--- FILE: 003_create_providers.sql ---

-- AI provider registry and runtime configuration table

CREATE TYPE provider_status_enum AS ENUM (
    'active',
    'inactive'
);

CREATE TABLE providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_name VARCHAR(255) NOT NULL,
    api_key_encrypted TEXT,
    endpoint_url TEXT,
    supported_features JSONB NOT NULL DEFAULT '[]'::jsonb,
    supports_identity_preservation BOOLEAN NOT NULL DEFAULT FALSE,
    status provider_status_enum NOT NULL DEFAULT 'inactive',
    cost_reference NUMERIC(12,4),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_providers_name ON providers(provider_name);
CREATE INDEX idx_providers_status ON providers(status);
CREATE INDEX idx_providers_identity ON providers(supports_identity_preservation);
CREATE INDEX idx_providers_features ON providers USING GIN(supported_features);

ALTER TABLE tools_config
ADD CONSTRAINT fk_tools_assigned_provider
FOREIGN KEY (assigned_provider_id)
REFERENCES providers(id)
ON DELETE SET NULL;

ALTER TABLE tools_config
ADD CONSTRAINT fk_tools_fallback_provider
FOREIGN KEY (fallback_provider_id)
REFERENCES providers(id)
ON DELETE SET NULL;
