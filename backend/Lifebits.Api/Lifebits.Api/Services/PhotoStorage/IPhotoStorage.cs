namespace Lifebits.Api.Services.PhotoStorage
{
    public interface IPhotoStorage
    {
        Task<string> SaveAsync(Stream content, string extension, CancellationToken cancellationToken);
        Task<Stream?> OpenReadAsync(string storageKey, CancellationToken cancellationToken);
        Task DeleteAsync(string storageKey, CancellationToken cancellationToken);
    }
}
