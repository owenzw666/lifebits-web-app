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
Jwt__TokenLifetimeDays=7
ConnectionStrings__DefaultConnection=Data Source=/app/data/lifebits.db
Cors__AllowedOrigins__0=https://your-lifebits-domain.com
AzureMaps__SubscriptionKey=<azure-maps-subscription-key>
Nominatim__UserAgent=Lifebits/1.0 (contact: your-email@example.com)
Nominatim__Email=your-email@example.com
GoogleAuth__ClientId=<google-oauth-client-id>
```

Do not use the development JWT key in production.

Reverse geocoding uses Azure Maps when `AzureMaps__SubscriptionKey` is configured.
If that key is missing, the backend can fall back to Nominatim when `Nominatim__UserAgent` is configured.
Use a real contact email in the User-Agent before production deployment.

Google sign-in is currently prepared as an OAuth-ready placeholder.
To enable it later, create a Google OAuth Client ID, set `GoogleAuth__ClientId`, and implement ID token verification in `POST /api/Auth/google`.

## Deployment

The recommended interview-friendly MVP deployment path is Azure Static Web Apps for the React frontend and Azure App Service for the ASP.NET Core backend.

See [Azure Deployment Guide](docs/azure-deployment.md) for the setup checklist.
