using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System.Collections.Concurrent;
using WebSocketSharp;
using WebSocketSharp.Server;

namespace SOS
{
    internal class RelayWebSocketServer : WebSocketBehavior
    {
        public ILogger? logger = null;
        public ConcurrentDictionary<string, List<string>> RegisteredEvents = new ConcurrentDictionary<string, List<string>>();
        public ConcurrentDictionary<string, Func<JToken, JToken>> EventMutators = new ConcurrentDictionary<string, Func<JToken, JToken>>();

        public RelayWebSocketServer()
        {
        }

        protected override void OnMessage(MessageEventArgs e)
        {
            SosMessage msg;
            try
            {
                msg = JsonConvert.DeserializeObject<SosMessage>(e.Data) ?? new SosMessage() { Channel = "None", Function = "None" };
            }
            catch { return; }


            if(EventMutators.ContainsKey(msg.Event))
            {
                msg.Data = EventMutators[msg.Event](msg.Data);
            }

            if (msg.Channel != "wsrelay")
            {
                RelayMessage(msg, this.ID);
                return;
            }

            switch (msg.Function)
            {
                case "register":
                    {

                        string? channelEvent = msg.Data.ToObject<string>();
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
                        string? channelEvent = msg.Data.ToObject<string>();
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
            Sessions.SendTo(JsonConvert.SerializeObject(new SosMessage()
            {
                Channel = "wsRelay",
                Function = "info",
                Data = "Connected!"
            }, Formatting.Indented), this.ID);

            this.logger?.Info($"{this.ID} -> connected");
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
        }

        public void RelayMessage(SosMessage msg, string? sender = null)
        {
            if (RegisteredEvents.ContainsKey(msg.Event))
            {
                var sessionIds = new List<string>();
                foreach (var sessionId in RegisteredEvents[msg.Event])
                {
                    // Don't send to Rocket League OR self
                    if (sessionId == "RocketLeague" || (sender != null && sender == sessionId))
                        continue;
                    sessionIds.Add(sessionId);
                    Sessions.SendTo(JsonConvert.SerializeObject(msg), sessionId);
                }

                this.logger?.Verbose($"{this.ID} -> relay({msg.Event}) -> {string.Join(",", sessionIds)}");
            }
        }
    }
}
