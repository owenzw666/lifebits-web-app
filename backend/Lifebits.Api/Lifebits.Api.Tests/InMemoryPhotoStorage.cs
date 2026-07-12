using System.Collections.Concurrent;
using Lifebits.Api.Services.PhotoStorage;

namespace Lifebits.Api.Tests;

internal sealed class InMemoryPhotoStorage : IPhotoStorage
{
    private readonly ConcurrentDictionary<string, byte[]> _files = new();

    public async Task<string> SaveAsync(
        Stream content,
        string extension,
        CancellationToken cancellationToken)
    {
        var storageKey = $"{Guid.NewGuid():N}{extension}";
        using var output = new MemoryStream();
        await content.CopyToAsync(output, cancellationToken);
        _files[storageKey] = output.ToArray();

        return storageKey;
    }

    public Task<Stream?> OpenReadAsync(
        string storageKey,
        CancellationToken cancellationToken)
    {
        return Task.FromResult<Stream?>(
            _files.TryGetValue(storageKey, out var bytes)
                ? new MemoryStream(bytes)
                : null);
    }

    public Task DeleteAsync(
        string storageKey,
        CancellationToken cancellationToken)
    {
        _files.TryRemove(storageKey, out _);

        return Task.CompletedTask;
    }
}
