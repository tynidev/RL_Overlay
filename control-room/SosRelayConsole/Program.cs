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
