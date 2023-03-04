using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.Json.Serialization;

namespace SOS
{
    public class SosMessage
    {
        [JsonPropertyName("data")]
        public JsonElement Data;

        [JsonPropertyName("event")]
        public string Event
        {
            set
            {
                var pieces = value.Split(':');
                if (pieces.Length == 2)
                {
                    Channel = pieces[0].ToLowerInvariant();
                    Function = pieces[1].ToLowerInvariant();
                }
            }
            get
            {
                return $"{Channel}:{Function}";
            }
        }

        [JsonIgnore]
        public string Channel = "";

        [JsonIgnore]
        public string Function = "";

        public string ToJson()
        {
            return $"{{ \"event\":\"{this.Event}\", \"data\":{JsonSerializer.Serialize(this.Data)}}}";
        }
    }
}
