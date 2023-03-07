using System.Net.Mail;
using System.Net.WebSockets;
using static System.Runtime.InteropServices.JavaScript.JSType;
using System.Text;
using System.Diagnostics.Metrics;

namespace RConn
{
    public class RemoteConnection
    {
        public ClientWebSocket socket = new ClientWebSocket();

        public async Task ConnectAsync(string host="localhost", int port=9002)
        {
            var uri = new Uri($"ws://{host}:{port}");
            socket = new ClientWebSocket();

            await socket.ConnectAsync(uri, CancellationToken.None);
            var password = GetPassword();
            await this.SendCommand($"rcon_password {password}");
        }

        private string GetPassword()
        {
            var fileName = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "bakkesmod/bakkesmod/cfg/config.cfg");
            foreach (string line in System.IO.File.ReadLines(fileName))
            {
                if(line.StartsWith("rcon_password"))
                {
                    var pieces = line.Split(" ");
                    return pieces[1].Trim(new char[] { ' ', '"' });
                }
            }
            throw new ArgumentException($"Could not find rconn_password in file {fileName}");
        }

        public Task SendCommand(string command)
        {
            return this.SendAsync(command);
        }

        private Task SendAsync(string data)
        {
            return SendAsTextAsync(Encoding.UTF8.GetBytes(data));
        }

        private Task SendAsTextAsync(byte[] bytes)
        {
            return socket.SendAsync(bytes, WebSocketMessageType.Text, true, CancellationToken.None);
        }
    }
}