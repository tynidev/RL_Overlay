using BakkesMod;
using SOS;
using SOS.EventTypes;
using System.Text.Json;

IRelay relay = new Relay();

relay.AddMutator("game:update_state", (origJson) =>
{
    var gameState = origJson.Deserialize<GameUpdateState>(JsonSerializationContext.Default.GameUpdateState);

    // change game state somehow.... add series data

    return JsonSerializer.SerializeToElement(gameState, typeof(GameUpdateState), JsonSerializationContext.Default);
});

relay.Start(new Logger(), args[0], int.Parse(args[1]));

var rconn = new RemoteConnection();
//if(rconn == null)
//    throw new ArgumentNullException(nameof(rconn));

//await rconn.ConnectAsync();

//while (true)
//{
//    await rconn.SendCommand("rcon_refresh_allowed");
//    await rconn.SendCommand("replay_gui hud 0");
//    await rconn.SendCommand("replay_gui matchinfo 0");
//    Thread.Sleep(3000);
//}




while (true)
{
    Thread.Sleep(1000);
}

class Logger : ILogger
{
    public void Error(string message)
    {
        Console.ForegroundColor = ConsoleColor.Red;
        Console.WriteLine(message);
    }

    public void Info(string message)
    {
        Console.ForegroundColor = ConsoleColor.White;
        Console.WriteLine(message);
    }

    public void Verbose(string message)
    {
        Console.ForegroundColor = ConsoleColor.DarkGray;
        Console.WriteLine(message);
    }
}
