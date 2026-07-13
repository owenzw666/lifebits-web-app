using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

namespace Lifebits.Api.Tests;

public sealed class PlacesApiTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public PlacesApiTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task CreatePlaceWithNote_ReturnsPlaceOnMap()
    {
        var client = _factory.CreateClient();
        var userId = await _factory.CreateUserAsync("create-place@lifebits.test");
        client.DefaultRequestHeaders.Add(TestAuthHandler.UserIdHeader, userId.ToString());

        var createResponse = await client.PostAsJsonAsync(
            "/api/Places",
            new
            {
                name = "Wellington Waterfront",
                title = "Evening walk",
                content = "Saved a quiet memory by the harbour.",
                category = "Life",
                eventTime = new DateTime(2026, 6, 14, 18, 30, 0, DateTimeKind.Utc),
                location = new
                {
                    type = "Point",
                    coordinates = new[] { 174.7818, -41.2866 }
                }
            });
        createResponse.EnsureSuccessStatusCode();

        var mapResponse = await client.GetAsync("/api/Places/map");
        mapResponse.EnsureSuccessStatusCode();

        var mapJson = await mapResponse.Content.ReadFromJsonAsync<JsonElement>();
        var feature = mapJson.GetProperty("features").EnumerateArray().Single();
        var properties = feature.GetProperty("properties");

        Assert.Equal("Wellington Waterfront", properties.GetProperty("name").GetString());
        Assert.Equal(1, properties.GetProperty("noteCount").GetInt32());
        Assert.Equal("Evening walk", properties
            .GetProperty("notes")
            .EnumerateArray()
            .Single()
            .GetProperty("title")
            .GetString());
    }

    [Fact]
    public async Task GetPlacesMap_RequiresAuthentication()
    {
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/Places/map");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task ExportNotes_RequiresAuthentication()
    {
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/Places/export");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task ExportNotes_ReturnsCsvForCurrentUser()
    {
        var client = _factory.CreateClient();
        var userId = await _factory.CreateUserAsync("export-notes@lifebits.test");
        client.DefaultRequestHeaders.Add(TestAuthHandler.UserIdHeader, userId.ToString());

        var createResponse = await client.PostAsJsonAsync(
            "/api/Places",
            new
            {
                name = "Export Place",
                title = "Note with, comma",
                content = "=private memory",
                category = "Travel",
                eventTime = new DateTime(2026, 7, 14, 9, 15, 0, DateTimeKind.Utc),
                location = new
                {
                    type = "Point",
                    coordinates = new[] { 174.7762, -41.2865 }
                }
            });
        createResponse.EnsureSuccessStatusCode();

        var response = await client.GetAsync("/api/Places/export");

        response.EnsureSuccessStatusCode();
        Assert.Equal("text/csv", response.Content.Headers.ContentType?.MediaType);

        var csv = await response.Content.ReadAsStringAsync();
        Assert.Contains("Place,Title,Content,Category,EventTime,Longitude,Latitude,PhotoCount", csv);
        Assert.Contains("Export Place", csv);
        Assert.Contains("\"Note with, comma\"", csv);
        Assert.Contains("'=private memory", csv);
        Assert.Contains("Travel", csv);
        Assert.Contains("174.7762", csv);
        Assert.Contains("-41.2865", csv);
    }

    [Fact]
    public async Task DeleteLastNote_RemovesEmptyPlace()
    {
        var client = _factory.CreateClient();
        var userId = await _factory.CreateUserAsync("delete-last-note@lifebits.test");
        client.DefaultRequestHeaders.Add(TestAuthHandler.UserIdHeader, userId.ToString());

        var createResponse = await client.PostAsJsonAsync(
            "/api/Places",
            new
            {
                name = "Petone Foreshore",
                title = "Coffee stop",
                content = "A short note for deletion behavior.",
                category = "Life",
                eventTime = new DateTime(2026, 4, 20, 15, 10, 0, DateTimeKind.Utc),
                location = new
                {
                    type = "Point",
                    coordinates = new[] { 174.8840, -41.2262 }
                }
            });
        createResponse.EnsureSuccessStatusCode();

        var created = await createResponse.Content.ReadFromJsonAsync<JsonElement>();
        var placeId = created.GetProperty("placeId").GetInt32();
        var noteId = created.GetProperty("noteId").GetInt32();

        var deleteResponse = await client.DeleteAsync($"/api/Places/{placeId}/notes/{noteId}");
        Assert.Equal(HttpStatusCode.OK, deleteResponse.StatusCode);

        Assert.Equal(0, await _factory.CountPlacesAsync(userId));
    }
}
