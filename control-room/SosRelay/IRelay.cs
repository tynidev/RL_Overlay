using System.Text.Json;

namespace SOS
{
    public interface IRelay
    {
        void Start(ILogger? logger, string relay_host = "localhost", int relay_port = 49322, string rocketLeague_host = "localhost", int rocketLeague_port = 49122);
        void Stop();
        bool IsStarted();
        bool IsListening();
        bool IsRlConnected();
        int ConnectedClients();
        void ConnectToRl();
        void AddMutator(string sosEvent, Func<JsonElement, JsonElement> mutator);
    }
}