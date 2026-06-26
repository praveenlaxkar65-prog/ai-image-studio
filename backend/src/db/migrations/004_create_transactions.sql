--- FILE: 004_create_transactions.sql ---

-- Credit ledger and transaction history table

CREATE TYPE transaction_status_enum AS ENUM (
    'success',
    'failed',
    'refunded'
);

CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    tool_key VARCHAR(150) NOT NULL,
    credits_amount INTEGER NOT NULL,
    reason VARCHAR(500),
    idempotency_key VARCHAR(255) NOT NULL UNIQUE,
    status transaction_status_enum NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_transactions_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE
);

CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_tool_key ON transactions(tool_key);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
CREATE INDEX idx_transactions_idempotency_key ON transactions(idempotency_key);
