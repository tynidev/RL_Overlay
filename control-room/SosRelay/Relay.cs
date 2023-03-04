using Newtonsoft.Json.Linq;
using System.Collections.Concurrent;
using WebSocketSharp.Server;

namespace SOS
{
    public class Relay : IRelay, IDisposable
    {
        private bool _started = false;
        private ILogger? logger;
        private WebSocketServer? ws_relay;
        
        private ConcurrentDictionary<string, List<string>> RegisteredEvents = new ConcurrentDictionary<string, List<string>>();
        private ConcurrentDictionary<string, Func<JToken, JToken>> EventMutators = new ConcurrentDictionary<string, Func<JToken, JToken>>();

        public void Dispose()
        {
            ws_relay?.Stop();
        }

        public void Start(ILogger? logger, string relay_host = "localhost", int relay_port = 49322)
        {
            this.RegisteredEvents.Clear();

            this.logger = logger;
            this.logger?.Info($"WebSocketRelay: opening on ws://{relay_host}:{relay_port}");
            ws_relay = new WebSocketServer($"ws://{relay_host}:{relay_port}");
            ws_relay.AddWebSocketService<RelayWebSocketServer>("/", (service) =>
            {
                service.logger = this.logger;
                service.RegisteredEvents = this.RegisteredEvents;
                service.EventMutators = this.EventMutators;
            });

            _started = true;
            ws_relay.Start();
        }

        public void Stop()
        {
            _started = false;
            ws_relay?.Stop();
        }

        public bool IsStarted()
        {
            return _started;
        }

        public bool IsListening()
        {
            return ws_relay?.IsListening ?? false;
        }

        public void AddMutator(string sosEvent, Func<JToken,JToken> mutator)
        {
            this.EventMutators.TryAdd(sosEvent, mutator);
        }
    }
}
