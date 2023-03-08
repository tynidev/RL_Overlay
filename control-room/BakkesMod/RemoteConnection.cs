using System.Net.WebSockets;
using System.Text;

namespace BakkesMod
{
    public class RemoteConnection : IDisposable
    {
        private Uri _uri;
        private ClientWebSocket _socket = new ClientWebSocket();

        public RemoteConnection(string host = "localhost", int port = 9002)
        {
            _uri = new Uri($"ws://{host}:{port}");
        }

        public async Task ConnectAsync()
        {
            await _socket.ConnectAsync(_uri, CancellationToken.None);
            await SendCommandAsync($"rcon_password {Config.Settings.Get("rcon_password")}");
        }

        public bool IsOpen
        {
            get
            {
                return (_socket?.State ?? WebSocketState.Closed) == WebSocketState.Open;
            }
        }

        public Task SendCommandAsync(string command)
        {
            return SendAsync(command);
        }

        private Task SendAsync(string data)
        {
            return SendAsTextAsync(Encoding.UTF8.GetBytes(data));
        }

        private Task SendAsTextAsync(byte[] bytes)
        {
            return _socket.SendAsync(bytes, WebSocketMessageType.Text, true, CancellationToken.None);
        }

        public void Dispose()
        {
            _socket.Dispose();
        }
    }
}