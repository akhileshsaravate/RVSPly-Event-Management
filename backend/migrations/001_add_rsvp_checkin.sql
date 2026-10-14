ALTER TABLE guests
    ADD COLUMN IF NOT EXISTS checkin_token TEXT,
    ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMPTZ;

UPDATE guests
SET checkin_token = gen_random_uuid()::text
WHERE checkin_token IS NULL;

ALTER TABLE guests
    ALTER COLUMN checkin_token SET DEFAULT gen_random_uuid()::text,
    ALTER COLUMN checkin_token SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS guests_checkin_token_uidx
    ON guests (checkin_token);
