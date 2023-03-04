using System.Text.Json;

namespace SOS
{
    public interface IRelay
    {
        void Start(ILogger? logger, string relay_host = "localhost", int relay_port = 49322);
        void Stop();
        bool IsStarted();
        bool IsListening();
        void AddMutator(string sosEvent, Func<JsonElement, JsonElement> mutator);
    }
}