# Lifebits Web App

A map-based note-taking web application built with React and ASP.NET Core.

## Environment configuration

Frontend API URLs are configured with Vite environment files.
Local `.env.*` files are ignored by Git, so create them from the example file:

```text
cp frontend/lifebits-web/.env.example frontend/lifebits-web/.env.development
```

For production deployment, set this value in the hosting platform:

```text
VITE_API_BASE_URL=https://api.your-lifebits-domain.com/api
```

Backend production secrets should be provided by the hosting platform environment variables:

```text
Jwt__Key=<long-random-production-secret>
Jwt__Issuer=Lifebits
Jwt__Audience=LifebitsUsers
Jwt__AccessTokenLifetimeMinutes=15
Jwt__RefreshTokenLifetimeDays=30
Jwt__RefreshCookieSameSite=None
ConnectionStrings__DefaultConnection=Data Source=/app/data/lifebits.db
Cors__AllowedOrigins__0=https://your-lifebits-domain.com
Frontend__BaseUrl=https://your-lifebits-domain.com
Email__Provider=Smtp
Email__FromEmail=no-reply@your-lifebits-domain.com
Email__Smtp__Host=<smtp-host>
Email__Smtp__Port=587
Email__Smtp__Username=<smtp-username>
Email__Smtp__Password=<smtp-password>
AzureMaps__SubscriptionKey=<azure-maps-subscription-key>
Nominatim__UserAgent=Lifebits/1.0 (contact: your-email@example.com)
Nominatim__Email=your-email@example.com
GoogleAuth__ClientId=<google-oauth-client-id>
```

The local API reads `Jwt:Key` from .NET User Secrets. Set it once with:

```powershell
dotnet user-secrets set "Jwt:Key" "<long-random-local-secret>"
```

Run this command from `backend/Lifebits.Api/Lifebits.Api`. User Secrets are
stored outside the repository and must never be reused in production.

Staging and production use the same setting names. Only their values, domains,
credentials, databases, and storage resources should differ.

Reverse geocoding uses Azure Maps when `AzureMaps__SubscriptionKey` is configured.
If that key is missing, the backend can fall back to Nominatim when `Nominatim__UserAgent` is configured.
Use a real contact email in the User-Agent before production deployment.

Google sign-in is currently prepared as an OAuth-ready placeholder.
To enable it later, create a Google OAuth Client ID, set `GoogleAuth__ClientId`, and implement ID token verification in `POST /api/Auth/google`.

## Deployment

The recommended interview-friendly MVP deployment path is Azure Static Web Apps for the React frontend and Azure App Service for the ASP.NET Core backend.

See [Azure Deployment Guide](docs/azure-deployment.md) for the setup checklist.
