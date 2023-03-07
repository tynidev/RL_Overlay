using System.Collections.Concurrent;
using WebSocketSharp;
using WebSocketSharp.Server;
using System.Text.Json;
using System.Text;

namespace SOS
{
    internal class RelayWebSocketServer : WebSocketBehavior
    {
        public ILogger? logger = null;
        public ConcurrentDictionary<string, List<string>> RegisteredEvents = new ConcurrentDictionary<string, List<string>>();
        public ConcurrentDictionary<string, Func<JsonElement, JsonElement>> EventMutators = new ConcurrentDictionary<string, Func<JsonElement, JsonElement>>();

        public event Action OnClientConnected;
        public event Action OnClientDisconnected;

        public RelayWebSocketServer()
        {
        }

        public void SendMessage(string data)
        {
            this.SendMessage(data, false);
        }

        protected override void OnMessage(MessageEventArgs e)
        {
            this.SendMessage(e.Data, true);
        }

        private void SendMessage(string data, bool fromSelf)
        {
            SosMessage msg = new SosMessage() { Channel = "wsrelay", Function = "none" };
            try
            {
                var jdoc = JsonDocument.Parse(data);

                if (!jdoc.RootElement.TryGetProperty("event", out JsonElement eventNode))
                    return;
                msg.Event = eventNode.GetString() ?? "wsrelay:none";

                if (!jdoc.RootElement.TryGetProperty("data", out msg.Data))
                    return;
            }
            catch { return; }

            if (msg.Channel != "wsrelay")
            {
                RelayMessage(msg, this.ID, fromSelf);
                return;
            }

            switch (msg.Function)
            {
                case "register":
                    {

                        string? channelEvent = msg.Data.ToString();
                        if (channelEvent == null)
                            break;

                        RegisteredEvents.TryAdd(channelEvent, new List<string>());

                        var registeredSessions = RegisteredEvents[channelEvent];
                        lock (registeredSessions)
                        {
                            if (!registeredSessions.Contains(ID))
                            {
                                registeredSessions.Add(ID);
                            }
                        }
                        this.logger?.Verbose($"{this.ID} -> registered event -> {channelEvent}");
                        break;
                    }


                case "unregister":
                    {
                        string? channelEvent = msg.Data.ToString();
                        if (channelEvent == null)
                            break;

                        if (RegisteredEvents.ContainsKey(channelEvent) && RegisteredEvents[channelEvent].Contains(this.ID))
                            break;
                        var registeredSessions = RegisteredEvents[channelEvent];
                        lock (registeredSessions)
                        {
                            registeredSessions.Remove(ID);
                        }
                        this.logger?.Verbose($"{this.ID} -> unregistered event -> {channelEvent}");
                        break;
                    }
            }
        }

        protected override void OnOpen()
        {
            base.OnOpen();
            Sessions.SendTo(Encoding.UTF8.GetBytes((new SosMessage()
            {
                Channel = "wsRelay",
                Function = "info",
                Data = JsonSerializer.SerializeToElement("Connected!")
            }).ToJson()), this.ID);

            this.logger?.Info($"{this.ID} -> connected");

            if (this.OnClientConnected != null)
                this.OnClientConnected();
        }

        protected override void OnClose(CloseEventArgs e)
        {
            base.OnClose(e);

            foreach (var kvp in RegisteredEvents)
            {
                if (kvp.Value.Contains(this.ID))
                {
                    lock (kvp.Value)
                    {
                        kvp.Value.Remove(this.ID);
                    }
                    this.logger?.Verbose($"{this.ID} -> unregistered event -> {kvp.Key}");
                }
            }

            this.logger?.Error($"{this.ID} -> disconnected");

            if (this.OnClientDisconnected != null)
                this.OnClientDisconnected();
        }

        private void RelayMessage(SosMessage msg, string sender, bool fromSelf)
        {
            if (RegisteredEvents.ContainsKey(msg.Event))
            {
                if (EventMutators.ContainsKey(msg.Event))
                {
                    msg.Data = EventMutators[msg.Event](msg.Data);
                }

                var json = msg.ToJson();
                var sessionIds = new List<string>();
                foreach (var sessionId in RegisteredEvents[msg.Event])
                {
                    // If this message is recieved by us then don't relay to us
                    if (fromSelf && (sender != null && sender == sessionId))
                        continue;
                    sessionIds.Add(sessionId);

                    // Note: Like this to be fire and forget but if SendToAsync is used we get an exception
                    //       Potentially could update library
                    Sessions.SendTo(json, sessionId);
                }

                this.logger?.Verbose($"{this.ID} -> relay({msg.Event}) -> {sessionIds.Count} clients");
            }
        }
    }
}
