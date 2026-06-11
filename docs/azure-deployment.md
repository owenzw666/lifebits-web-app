# Azure Deployment Guide

This project is a good fit for an Azure-based MVP because the backend is ASP.NET Core and the frontend is a static React app.

## Recommended MVP architecture

- Frontend: Azure Static Web Apps
- Backend: Azure App Service
- Database for first MVP: SQLite with a persistent App Service storage path
- Database for production growth: Azure Database for PostgreSQL

SQLite is acceptable for an early MVP with small traffic and one backend instance. Move to PostgreSQL before scaling to multiple backend instances or handling important production data.

## Frontend settings

Azure Static Web Apps should build from:

```text
frontend/lifebits-web
```

Build command:

```text
npm run build
```

Build output:

```text
dist
```

Set this environment variable in Azure Static Web Apps:

```text
VITE_API_BASE_URL=https://<your-api-app-name>.azurewebsites.net/api
```

## Backend settings

Azure App Service should run the ASP.NET Core project:

```text
backend/Lifebits.Api/Lifebits.Api
```

Health check endpoint:

```text
https://<your-api-app-name>.azurewebsites.net/health
```

Set these App Service application settings:

```text
ASPNETCORE_ENVIRONMENT=Production
Jwt__Key=<long-random-production-secret>
Jwt__Issuer=Lifebits
Jwt__Audience=LifebitsUsers
Jwt__AccessTokenLifetimeMinutes=15
Jwt__RefreshTokenLifetimeDays=30
Jwt__RefreshCookieSameSite=None
ConnectionStrings__DefaultConnection=Data Source=/home/site/data/lifebits.db
Cors__AllowedOrigins__0=https://<your-static-web-app-domain>
Frontend__BaseUrl=https://<your-static-web-app-domain>
Email__Provider=Smtp
Email__FromEmail=no-reply@<your-domain>
Email__FromName=Lifebits
Email__Smtp__Host=<smtp-host>
Email__Smtp__Port=587
Email__Smtp__Username=<smtp-username>
Email__Smtp__Password=<smtp-password>
Email__Smtp__EnableSsl=true
AzureMaps__SubscriptionKey=<azure-maps-subscription-key>
Nominatim__UserAgent=Lifebits/1.0 (contact: your-email@example.com)
Nominatim__Email=your-email@example.com
GoogleAuth__ClientId=<google-oauth-client-id>
```

Use a long random value for `Jwt__Key`. Do not reuse the development key.

`Jwt__RefreshCookieSameSite=None` is required when the frontend and API use
different sites, such as the default Static Web Apps and App Service domains.
The cookie is also marked `Secure` in staging and production. If both services
later use subdomains under one custom site, review whether `Lax` is sufficient.

The API validates security-critical production settings during startup. It
will refuse to start when the JWT key is weak, an HTTPS frontend/CORS URL is
missing, or required SMTP settings still contain placeholders.

## Staging environment

Create staging as a separate App Service deployment slot or small App Service
instance and a separate Static Web App environment. Use:

```text
ASPNETCORE_ENVIRONMENT=Staging
```

Staging should use separate credentials, email sender settings, database, and
photo storage. Never connect staging to the production database.

Build the frontend with:

```text
npm run build:staging
```

Provide `VITE_API_BASE_URL` using `.env.staging` locally or the Azure build
environment. Start from `.env.staging.example`; do not commit the real file.

`AzureMaps__SubscriptionKey` is used by the backend reverse geocoding endpoint to suggest a default place name when the user clicks on the map. If this key is missing, note creation still works, but the place name will not be auto-filled.

If you do not configure Azure Maps, the backend can fall back to Nominatim when `Nominatim__UserAgent` is set. This is useful for MVP testing, but keep usage low, identify the app clearly, and follow the public Nominatim usage policy.

Google sign-in is currently an OAuth-ready placeholder. Before enabling it in production, create a Google OAuth Client ID, add the real frontend domain to Google OAuth authorized origins, set `GoogleAuth__ClientId`, and replace the placeholder `POST /api/Auth/google` implementation with ID token verification.

## SQLite storage note

On Azure App Service, use a stable path for the SQLite file:

```text
/home/site/data/lifebits.db
```

This keeps the database outside the deployed application package. For a real product, also plan backups. SQLite is not a good long-term choice if the app runs on multiple instances.

## PostgreSQL migration path

When the MVP has real users, move from SQLite to Azure Database for PostgreSQL:

1. Add the EF Core PostgreSQL provider.
2. Change `UseSqlite` to choose the provider from configuration.
3. Create a PostgreSQL connection string in Azure App Service.
4. Export existing SQLite data.
5. Import data into PostgreSQL.
6. Run migrations against PostgreSQL.

This should be done as a separate planned task, not mixed into the first deployment.

## CORS checklist

After the frontend is deployed, copy the real Static Web Apps domain and set:

```text
Cors__AllowedOrigins__0=https://<your-static-web-app-domain>
```

Do not use `AllowAnyOrigin` in production.
