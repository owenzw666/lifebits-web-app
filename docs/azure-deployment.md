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
Jwt__TokenLifetimeDays=7
ConnectionStrings__DefaultConnection=Data Source=/home/site/data/lifebits.db
Cors__AllowedOrigins__0=https://<your-static-web-app-domain>
AzureMaps__SubscriptionKey=<azure-maps-subscription-key>
Nominatim__UserAgent=Lifebits/1.0 (contact: your-email@example.com)
Nominatim__Email=your-email@example.com
GoogleAuth__ClientId=<google-oauth-client-id>
```

Use a long random value for `Jwt__Key`. Do not reuse the development key.

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
