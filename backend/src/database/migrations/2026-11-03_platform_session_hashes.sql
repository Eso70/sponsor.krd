-- Preserve existing administrator cookies while replacing bearer tokens at rest.
-- Deploy with all application processes stopped; old code cannot read digests.
-- New tokens are 43-character base64url values; their SHA-256 digests are hex(64).
UPDATE platform_admin_sessions
SET session_token = encode(digest(session_token, 'sha256'), 'hex')
WHERE session_token !~ '^[0-9a-f]{64}$';
