using System.Collections.Concurrent;
using WebSocketSharp.Server;

namespace SOS
{
    public class Relay : WebSocketBehavior, IDisposable
    {
        private ILogger logger;
        private WebSocketServer ws_relay;
        private ConcurrentDictionary<string, List<string>> RegisteredEvents = new ConcurrentDictionary<string, List<string>>();

        public Relay(ILogger logger, string relay_host = "localhost", int relay_port = 49322)
        {
            if (logger == null)
                throw new ArgumentNullException(nameof(logger));

            this.logger = logger;
            this.logger.Info($"WebSocketRelay: opening on ws://{relay_host}:{relay_port}");
            ws_relay = new WebSocketServer($"ws://{relay_host}:{relay_port}");
            ws_relay.AddWebSocketService<RelayWebSocketServer>("/", (service) =>
            {
                service.logger = this.logger;
                service.RegisteredEvents = this.RegisteredEvents;
            });
            ws_relay.Start();
        }

        public void Dispose()
        {
            ws_relay.Stop();
        }
    }
}
