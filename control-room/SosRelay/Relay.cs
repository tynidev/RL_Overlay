using System.Collections.Concurrent;
using System.Text.Json;
using WebSocketSharp;
using WebSocketSharp.Server;
using System.Threading;
using System.Text;

namespace SOS
{
    public class Relay : IRelay, IDisposable
    {
        private ILogger? logger;
     
        private bool _started = false;
        private WebSocketServer? ws_relay;
        private int _connectedClients;

        private bool _rlConnected = false;
        private WebSocket? ws_rocketLeague;
        private Timer? _connectToRlTimer;

        private ConcurrentDictionary<string, List<string>> RegisteredEvents = new ConcurrentDictionary<string, List<string>>();
        private ConcurrentDictionary<string, Func<JsonElement, JsonElement>> EventMutators = new ConcurrentDictionary<string, Func<JsonElement, JsonElement>>();
        private List<RelayWebSocketServer> clients = new List<RelayWebSocketServer>();

        public void Dispose()
        {
            ws_relay?.Stop();
        }

        public void Start(ILogger? logger, string relay_host = "localhost", int relay_port = 49322, string rocketLeague_host= "localhost", int rocketLeague_port=49122)
        {
            this.RegisteredEvents.Clear();
            this.logger = logger;

            // Setup Relay Server WebSocket
            this.logger?.Info($"WebSocketRelay: opening on ws://{relay_host}:{relay_port}");
            ws_relay = new WebSocketServer($"ws://{relay_host}:{relay_port}");
            ws_relay.AddWebSocketService<RelayWebSocketServer>("/", (service) =>
            {
                service.logger = this.logger;
                service.RegisteredEvents = this.RegisteredEvents;
                service.EventMutators = this.EventMutators;
                service.OnClientConnected += this.ClientConnected;
                service.OnClientDisconnected += this.ClientDisconnected;
                this.clients.Add(service);
            });


            // Setup Rocket League Client WebSocket
            ws_rocketLeague = new WebSocket($"ws://{rocketLeague_host}:{rocketLeague_port}");
            ws_rocketLeague.OnOpen += this.onRocketLeagueSosOpen;
            ws_rocketLeague.OnClose += this.onRocketLeagueSosClosed;
            ws_rocketLeague.OnMessage += this.onRocketLeagueSosMessage;
            ws_rocketLeague?.Connect();

            _connectToRlTimer = new Timer(ConnectToRl, this, 0, 5 * 1000);

            _started = true;
            ws_relay.Start();
        }

        private void ConnectToRl(object? state)
        {
            if (!this.IsRlConnected())
                ws_rocketLeague?.Connect();
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

        public void AddMutator(string sosEvent, Func<JsonElement, JsonElement> mutator)
        {
            this.EventMutators.TryAdd(sosEvent, mutator);
        }

        public void ClientConnected()
        {
            Interlocked.Increment(ref this._connectedClients);
        }

        public void ClientDisconnected()
        {
            Interlocked.Decrement(ref this._connectedClients);
            clients.RemoveAll(x => x.ConnectionState == WebSocketState.Closed || x.ConnectionState == WebSocketState.Closing);
        }

        public int ConnectedClients()
        {
            return this._connectedClients;
        }

        public bool IsRlConnected()
        {
            return this._rlConnected;
        }

        private void onRocketLeagueSosClosed(object? sender, CloseEventArgs e)
        {
            this.logger?.Error($"Disconnected from Rocket League...");
            this._rlConnected = false;
        }

        private void onRocketLeagueSosOpen(object? sender, EventArgs e)
        {
            this.logger?.Info($"Connected to Rocket League!");
            this._rlConnected = true;
        }

        private void onRocketLeagueSosMessage(object? sender, MessageEventArgs e)
        {
            var data = e.Data;

            // According to the original relay occasionally things are sent as b64.
            //
            // But according to this commit on SOS Plugin:
            // https://gitlab.com/bakkesplugins/sos/sos-plugin/-/commit/9a637343bdb3b2487623340340d8cbd493917850
            //
            // That option was removed and so we should no longer need this.
            //if (!e.Data.StartsWith('{'))
            //{
            //    var bytes = Convert.FromBase64String(e.Data);
            //    data = Encoding.UTF8.GetString(bytes);
            //}

            clients.ForEach(i =>
            {
                i.SendMessage(data);
            });

        }
    }
}
