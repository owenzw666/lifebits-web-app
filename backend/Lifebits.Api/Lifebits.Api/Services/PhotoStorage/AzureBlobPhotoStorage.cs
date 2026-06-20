using Azure.Storage.Blobs;

namespace Lifebits.Api.Services.PhotoStorage
{
    public class AzureBlobPhotoStorage : IPhotoStorage
    {
        private readonly BlobContainerClient _containerClient;

        public AzureBlobPhotoStorage(IConfiguration configuration)
        {
            var connectionString = configuration["PhotoStorage:AzureBlob:ConnectionString"];
            var containerName = configuration["PhotoStorage:AzureBlob:ContainerName"]
                ?? "lifebits-photos";

            if (string.IsNullOrWhiteSpace(connectionString))
            {
                throw new InvalidOperationException(
                    "PhotoStorage:AzureBlob:ConnectionString is required when AzureBlob photo storage is enabled.");
            }

            _containerClient = new BlobContainerClient(connectionString, containerName);
        }

        public async Task<string> SaveAsync(
            Stream content,
            string extension,
            CancellationToken cancellationToken)
        {
            await EnsureContainerExists(cancellationToken);

            var storageKey = $"{Guid.NewGuid():N}{extension.ToLowerInvariant()}";
            var blobClient = _containerClient.GetBlobClient(storageKey);

            await blobClient.UploadAsync(content, overwrite: false, cancellationToken);
            return storageKey;
        }

        public async Task<Stream?> OpenReadAsync(
            string storageKey,
            CancellationToken cancellationToken)
        {
            var blobClient = _containerClient.GetBlobClient(GetSafeStorageKey(storageKey));

            if (!await blobClient.ExistsAsync(cancellationToken))
            {
                return null;
            }

            var download = await blobClient.DownloadStreamingAsync(
                cancellationToken: cancellationToken);

            return download.Value.Content;
        }

        public async Task DeleteAsync(
            string storageKey,
            CancellationToken cancellationToken)
        {
            var blobClient = _containerClient.GetBlobClient(GetSafeStorageKey(storageKey));
            await blobClient.DeleteIfExistsAsync(cancellationToken: cancellationToken);
        }

        private async Task EnsureContainerExists(CancellationToken cancellationToken)
        {
            // Keep the container private. Photos are returned only through the
            // authorized Lifebits API endpoint, never through a public blob URL.
            await _containerClient.CreateIfNotExistsAsync(
                cancellationToken: cancellationToken);
        }

        private static string GetSafeStorageKey(string storageKey)
        {
            var safeKey = Path.GetFileName(storageKey);

            if (string.IsNullOrWhiteSpace(safeKey) || safeKey != storageKey)
            {
                throw new InvalidOperationException("Invalid photo storage key.");
            }

            return safeKey;
        }
    }
}
