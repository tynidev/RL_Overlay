using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace SOS
{
    public class SosMessage
    {
        [JsonProperty("data")]
        public JToken Data = "";

        [JsonProperty("event")]
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
    }
}
