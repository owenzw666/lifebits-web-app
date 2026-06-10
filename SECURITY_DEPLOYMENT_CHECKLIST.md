# Lifebits Production Security Checklist

Complete these items before the public production launch.

## Secrets and hosting

- Store JWT, SMTP, database, map, and OAuth secrets in Azure Key Vault or
  application environment settings. Do not deploy development secrets.
- Run the API only behind HTTPS and keep HSTS enabled.
- Configure trusted forwarded headers for the selected Azure hosting service
  before using client IP addresses for rate limiting or audit records.
- Restrict production CORS origins to the exact Lifebits frontend domains.

## Private data storage

- Move the SQLite database to Azure SQL or managed PostgreSQL with encryption
  at rest, encrypted backups, point-in-time recovery, and restricted network
  access.
- Move note photos to a private Azure Blob Storage container. Serve files only
  after authorization, or through short-lived signed URLs.
- Define retention and deletion rules for account data, notes, photos, account
  tokens, logs, and backups.
- Add per-user limits for note count, photo count, individual file size, and
  total storage usage.

## Operations

- Enable structured security audit events without logging note content,
  passwords, access tokens, refresh tokens, or reset links.
- Add alerts for repeated login failures, unusual refresh-token failures,
  storage growth, and elevated API error rates.
- Test database restore, photo restore, account deletion, session revocation,
  and secret rotation before launch.
- Review privacy policy, terms, breach response, and New Zealand Privacy Act
  obligations before accepting public user data.
