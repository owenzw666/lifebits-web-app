FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy project files first so Docker can cache NuGet restore separately from source changes.
COPY backend/Lifebits.Api/Lifebits.Api/Lifebits.Api.csproj backend/Lifebits.Api/Lifebits.Api/
RUN dotnet restore backend/Lifebits.Api/Lifebits.Api/Lifebits.Api.csproj

COPY backend/Lifebits.Api/Lifebits.Api backend/Lifebits.Api/Lifebits.Api
RUN dotnet publish backend/Lifebits.Api/Lifebits.Api/Lifebits.Api.csproj \
    --configuration Release \
    --no-restore \
    --output /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

# The API listens on port 8080 inside the container.
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "Lifebits.Api.dll"]
