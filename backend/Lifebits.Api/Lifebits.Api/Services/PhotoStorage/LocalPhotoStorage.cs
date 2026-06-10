namespace Lifebits.Api.Services.PhotoStorage
{
    public class LocalPhotoStorage : IPhotoStorage
    {
        private readonly string _rootPath;

        public LocalPhotoStorage(IWebHostEnvironment environment, IConfiguration configuration)
        {
            var configuredPath = configuration["PhotoStorage:LocalPath"];
            _rootPath = Path.GetFullPath(
                string.IsNullOrWhiteSpace(configuredPath)
                    ? Path.Combine(environment.ContentRootPath, "App_Data", "photos")
                    : Path.IsPathRooted(configuredPath)
                        ? configuredPath
                        : Path.Combine(environment.ContentRootPath, configuredPath));

            Directory.CreateDirectory(_rootPath);
        }

        public async Task<string> SaveAsync(
            Stream content,
            string extension,
            CancellationToken cancellationToken)
        {
            var storageKey = $"{Guid.NewGuid():N}{extension.ToLowerInvariant()}";
            var filePath = GetSafeFilePath(storageKey);

            await using var output = new FileStream(
                filePath,
                FileMode.CreateNew,
                FileAccess.Write,
                FileShare.None,
                81920,
                useAsync: true);

            await content.CopyToAsync(output, cancellationToken);
            return storageKey;
        }

        public Task<Stream?> OpenReadAsync(
            string storageKey,
            CancellationToken cancellationToken)
        {
            var filePath = GetSafeFilePath(storageKey);

            if (!File.Exists(filePath))
            {
                return Task.FromResult<Stream?>(null);
            }

            Stream stream = new FileStream(
                filePath,
                FileMode.Open,
                FileAccess.Read,
                FileShare.Read,
                81920,
                useAsync: true);

            return Task.FromResult<Stream?>(stream);
        }

        public Task DeleteAsync(string storageKey, CancellationToken cancellationToken)
        {
            var filePath = GetSafeFilePath(storageKey);

            if (File.Exists(filePath))
            {
                File.Delete(filePath);
            }

            return Task.CompletedTask;
        }

        private string GetSafeFilePath(string storageKey)
        {
            var fileName = Path.GetFileName(storageKey);
            var filePath = Path.GetFullPath(Path.Combine(_rootPath, fileName));

            if (!filePath.StartsWith(_rootPath, StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException("Invalid photo storage key.");
            }

            return filePath;
        }
    }
}
