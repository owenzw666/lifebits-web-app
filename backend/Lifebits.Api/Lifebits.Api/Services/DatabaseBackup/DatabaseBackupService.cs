using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Microsoft.Data.Sqlite;

namespace Lifebits.Api.Services.DatabaseBackup
{
    public sealed class DatabaseBackupService : BackgroundService
    {
        private const string BackupPrefix = "sqlite/";
        private readonly IConfiguration _configuration;
        private readonly ILogger<DatabaseBackupService> _logger;

        public DatabaseBackupService(
            IConfiguration configuration,
            ILogger<DatabaseBackupService> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            if (!_configuration.GetValue<bool>("DatabaseBackup:Enabled"))
            {
                _logger.LogInformation("Automatic database backup is disabled.");
                return;
            }

            var intervalHours = Math.Max(
                1,
                _configuration.GetValue<int?>("DatabaseBackup:IntervalHours") ?? 24);

            // Wait until startup migrations have finished and the app is serving requests.
            await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await CreateBackupAsync(stoppingToken);
                }
                catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
                {
                    break;
                }
                catch (Exception exception)
                {
                    // A failed backup must be visible in App Service logs without stopping the API.
                    _logger.LogError(exception, "Automatic database backup failed.");
                }

                await Task.Delay(TimeSpan.FromHours(intervalHours), stoppingToken);
            }
        }

        private async Task CreateBackupAsync(CancellationToken cancellationToken)
        {
            var databaseConnectionString = _configuration
                .GetConnectionString("DefaultConnection")
                ?? throw new InvalidOperationException(
                    "ConnectionStrings:DefaultConnection is required for database backup.");

            var storageConnectionString =
                _configuration["DatabaseBackup:AzureBlob:ConnectionString"]
                ?? _configuration["PhotoStorage:AzureBlob:ConnectionString"]
                ?? throw new InvalidOperationException(
                    "An Azure Blob connection string is required for database backup.");

            var containerName = _configuration["DatabaseBackup:AzureBlob:ContainerName"]
                ?? "lifebits-db-backups";
            var retentionDays = Math.Max(
                1,
                _configuration.GetValue<int?>("DatabaseBackup:RetentionDays") ?? 30);

            var temporaryPath = Path.Combine(
                Path.GetTempPath(),
                $"lifebits-{Guid.NewGuid():N}.db");

            try
            {
                // SQLite's online backup API creates a consistent snapshot while the live
                // application continues reading from and writing to the source database.
                await using (var source = new SqliteConnection(databaseConnectionString))
                await using (var destination = new SqliteConnection(
                    new SqliteConnectionStringBuilder { DataSource = temporaryPath }.ToString()))
                {
                    await source.OpenAsync(cancellationToken);
                    await destination.OpenAsync(cancellationToken);
                    source.BackupDatabase(destination);
                }

                await VerifyBackupAsync(temporaryPath, cancellationToken);

                var container = new BlobContainerClient(
                    storageConnectionString,
                    containerName);
                await container.CreateIfNotExistsAsync(
                    PublicAccessType.None,
                    cancellationToken: cancellationToken);

                var blobName = $"{BackupPrefix}lifebits-{DateTime.UtcNow:yyyyMMdd-HHmmss}.db";
                var blob = container.GetBlobClient(blobName);

                await using var backupStream = File.OpenRead(temporaryPath);
                await blob.UploadAsync(
                    backupStream,
                    new BlobUploadOptions
                    {
                        HttpHeaders = new BlobHttpHeaders
                        {
                            ContentType = "application/vnd.sqlite3"
                        }
                    },
                    cancellationToken);

                await DeleteExpiredBackupsAsync(
                    container,
                    retentionDays,
                    cancellationToken);

                _logger.LogInformation(
                    "Database backup uploaded successfully as {BlobName}.",
                    blobName);
            }
            finally
            {
                if (File.Exists(temporaryPath))
                {
                    File.Delete(temporaryPath);
                }
            }
        }

        private static async Task VerifyBackupAsync(
            string backupPath,
            CancellationToken cancellationToken)
        {
            await using var connection = new SqliteConnection(
                new SqliteConnectionStringBuilder
                {
                    DataSource = backupPath,
                    Mode = SqliteOpenMode.ReadOnly
                }.ToString());
            await connection.OpenAsync(cancellationToken);

            await using var command = connection.CreateCommand();
            command.CommandText = "PRAGMA quick_check;";
            var result = await command.ExecuteScalarAsync(cancellationToken);

            if (!string.Equals(result?.ToString(), "ok", StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException(
                    $"SQLite backup integrity check failed: {result ?? "no result"}.");
            }
        }

        private static async Task DeleteExpiredBackupsAsync(
            BlobContainerClient container,
            int retentionDays,
            CancellationToken cancellationToken)
        {
            var cutoff = DateTimeOffset.UtcNow.AddDays(-retentionDays);

            await foreach (var item in container.GetBlobsAsync(
                traits: BlobTraits.None,
                states: BlobStates.None,
                prefix: BackupPrefix,
                cancellationToken: cancellationToken))
            {
                if (item.Properties.LastModified < cutoff)
                {
                    await container.DeleteBlobIfExistsAsync(
                        item.Name,
                        cancellationToken: cancellationToken);
                }
            }
        }
    }
}
