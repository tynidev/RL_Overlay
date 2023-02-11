class GameState {
    static None = new GameState("none");
    static PreGameLobby = new GameState("pre-game-lobby");
    static InGame = new GameState("in-game");
    static PostGame = new GameState("post-game");

    constructor(name){
        this.name = name;
    }
}

export default GameState;