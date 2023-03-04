using SOS.EventTypes;
using System.Text.Json.Serialization;

namespace SOS
{
    [JsonSourceGenerationOptions(GenerationMode = JsonSourceGenerationMode.Default)]
    [JsonSerializable(typeof(GameUpdateState))]
    [JsonSerializable(typeof(Player))]
    [JsonSerializable(typeof(Ball))]
    [JsonSerializable(typeof(Team))]
    [JsonSerializable(typeof(BallLocation))]
    [JsonSerializable(typeof(CarLocation))]
    [JsonSerializable(typeof(Game))]
    public partial class JsonSerializationContext : JsonSerializerContext
    {
    }
}
