-- Apply as an additive migration before deploying; never modifies shared tables.
CREATE TABLE IF NOT EXISTS afters_security_rate_limits (
 key TEXT PRIMARY KEY, count INTEGER NOT NULL CHECK (count > 0), reset_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS afters_security_rate_limits_expiry ON afters_security_rate_limits(reset_at);
-- Retention: DELETE FROM afters_security_rate_limits WHERE reset_at < now() - interval '1 day';

-- At-most-once reminder dispatch claims; failed sends remain visible for operator review.
CREATE TABLE IF NOT EXISTS afters_security_reminders(key TEXT PRIMARY KEY,claimed_at TIMESTAMPTZ NOT NULL DEFAULT now());
