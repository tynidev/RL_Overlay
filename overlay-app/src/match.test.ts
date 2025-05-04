import { Match } from './match';
import { WsSubscribers } from './types/wsSubscribers'; // Import the new interface
import { GameStateData, Game } from './types/game'; // Import Game
import { Series } from './types/series';
import { NewPlayer } from './types/player';

// Mock WsSubscribers
class MockWsSubscribers implements WsSubscribers {
    private subscribers: Map<string, Map<string, ((data: any) => void)[]>> = new Map();
    public sentMessages: { channel: string; event: string; data: any }[] = [];

    subscribe(channel: string, event: string, callback: (data: any) => void): void {
        if (!this.subscribers.has(channel)) {
            this.subscribers.set(channel, new Map());
        }
        if (!this.subscribers.get(channel)!.has(event)) {
            this.subscribers.get(channel)!.set(event, []);
        }
        this.subscribers.get(channel)!.get(event)!.push(callback);
    }

    unsubscribe(channel: string, event: string, callback: (data: any) => void): void {
        // Implementation not strictly needed for these tests but good practice
        if (this.subscribers.has(channel) && this.subscribers.get(channel)!.has(event)) {
            const callbacks = this.subscribers.get(channel)!.get(event)!;
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    send(channel: string, event: string, data: any): void {
        this.sentMessages.push({ channel, event, data });
        // In a real scenario, this would send data over WebSocket
        // For testing, we might simulate receiving this message back if needed
        this.triggerEvent(channel, event, data);
    }

    // Helper method for tests to simulate receiving an event
    triggerEvent(channel: string, event: string, data: any): void {
        if (this.subscribers.has(channel) && this.subscribers.get(channel)!.has(event)) {
            this.subscribers.get(channel)!.get(event)!.forEach(callback => callback(data));
        }
    }
}

describe('Match Class', () => {
    let mockWs: MockWsSubscribers;
    let match: Match;

    beforeEach(() => {
        mockWs = new MockWsSubscribers();
        match = new Match(mockWs); // Inject the mock
    });

    test('should set state to pre-game-lobby on match_created', () => {
        const callback = jest.fn();
        match.OnMatchCreated(callback);

        // Simulate the event: When game is created before everyone has picked sides or specator roles
        mockWs.triggerEvent('game', 'match_created', {});

        expect(match.gameState.state).toBe('pre-game-lobby');
        expect(match.gameState.clockRunning).toBe(false);
        expect(callback).toHaveBeenCalledTimes(1);
    });

    test('should reset series wins if a team reached the required wins on match_created', () => {
        match.series = {
            series_txt: 'Test Series',
            length: 3, // Best of 3, need 2 wins
            teams: [
                { team: 0, name: 'Blue', matches_won: 2, logo: '' },
                { team: 1, name: 'Orange', matches_won: 0, logo: '' },
            ],
        };

        // Simulate the event: When game is created before everyone has picked sides or specator roles
        mockWs.triggerEvent('game', 'match_created', {});

        expect(match.series.teams[0].matches_won).toBe(0);
        expect(match.series.teams[1].matches_won).toBe(0);
        // Check if ws.send was called to update series
        expect(mockWs.sentMessages).toContainEqual({
            channel: 'local',
            event: 'series_update',
            data: match.series,
        });
    });

    test('should handle game state updates via update_state', () => {
        const p1 = NewPlayer();
        p1.id = 'player1'; // Set player ID
        p1.name = 'Player One'; // Set player name
        const p2 = NewPlayer();
        p2.id = 'player2'; // Set player ID
        p2.name = 'Player Two'; // Set player name
        
        const mockGameStateData: Partial<GameStateData> = {
            game: {
                // ... provide necessary mock game data ...
                hasWinner: false,
                time_seconds: 299,
                isOT: false,
                target: '', // Assuming no target initially
                teams: [
                    { color_primary: 'blue', color_secondary: 'lightblue', name: 'Blue', score: 0, logo: '' }, // Added logo
                    { color_primary: 'orange', color_secondary: 'yellow', name: 'Orange', score: 0, logo: '' }, // Added logo
                ],
                ball: { location: { X: 0, Y: 0, Z: 0 }, speed: 0, team: 0 }, // Added speed and team
                localplayer: 'player1', // Add localplayer if needed
                // Add other required Game properties with mock values if necessary
                arena: 'MockArena',
                hasTarget: false,
                isReplay: false,
                isSeries: false,
                seriesLength: 0,
                time_milliseconds: 299000,
                winner: ''
            } as Game, // Assert type to satisfy Partial<GameStateData>
            players: {
                'player1': p1,
                'player2': p2,
            }
        };

        const playerUpdateCallback = jest.fn();
        const teamUpdateCallback = jest.fn();
        const timeUpdateCallback = jest.fn();
        match.OnPlayersUpdated(playerUpdateCallback);
        match.OnTeamsUpdated(teamUpdateCallback);
        match.OnTimeUpdated(timeUpdateCallback);

        // Simulate the event: Game state updates happens as soon as match_created is fired and until match_destroyed is called.
        mockWs.triggerEvent('game', 'update_state', mockGameStateData);

        expect(match.gameState.game).toBeDefined();
        expect(match.gameState.game?.time_seconds).toBe(299);
        expect(playerUpdateCallback).toHaveBeenCalled();
        expect(teamUpdateCallback).toHaveBeenCalled();
        expect(timeUpdateCallback).toHaveBeenCalled(); // Assuming initial time was undefined

        // Simulate time change
        const updatedGameStateData = {
            ...mockGameStateData,
            game: { ...mockGameStateData.game!, time_seconds: 298 }
        };
        // Simulate the event: Game state updates happens as soon as match_created is fired and until match_destroyed is called.
        mockWs.triggerEvent('game', 'update_state', updatedGameStateData);
        expect(timeUpdateCallback).toHaveBeenCalledWith('4:58', 298, false);
        expect(match.gameState.clockRunning).toBe(true); // Clock should be running after time changes
    });

     test('should set state to in-game on initialized', () => {
        const callback = jest.fn();
        match.OnFirstCountdown(callback);

        // Simulate the event: Game is initialized and players have chosen a side. NOTE: This is the same as the first kick off countdown
        mockWs.triggerEvent('game', 'initialized', {});

        expect(match.gameState.state).toBe('in-game');
        expect(match.gameState.clockRunning).toBe(false);
        expect(callback).toHaveBeenCalledTimes(1);
    });

    test('should set state to in-game on pre_countdown_begin', () => {
        const callback = jest.fn();
        match.OnCountdown(callback);

        // Simulate the event: Kick off countdown
        mockWs.triggerEvent('game', 'pre_countdown_begin', {});

        expect(match.gameState.state).toBe('in-game');
        expect(match.gameState.clockRunning).toBe(false);
        expect(callback).toHaveBeenCalledTimes(1);
    });

    test('should set clockRunning to true on ball_hit', () => {
        match.gameState.clockRunning = false; // Ensure it starts false
        // Simulate the event: Occurs when ball is hit
        mockWs.triggerEvent('game', 'ball_hit', {});
        expect(match.gameState.clockRunning).toBe(true);
    });

    test('should call goal scored callbacks on goal_scored', () => {
        match.gameState.clockRunning = true; // Ensure it starts true
        const callback = jest.fn();
        const goalData = { scorer: { name: 'Player One', team_num: 0 }, assist: { name: 'Player Two', team_num: 0 }, goalspeed: 100, goaltime: 250 };
        match.OnGoalScored(callback);

        // Simulate the event: When a goal is scored
        mockWs.triggerEvent('game', 'goal_scored', goalData);

        expect(match.gameState.clockRunning).toBe(false);
        expect(callback).toHaveBeenCalledWith(goalData);
    });

    test('should clear stats and call callbacks on replay_end', () => {
        const replayEndCallback = jest.fn();
        const statfeedCallback = jest.fn();
        match.OnInstantReplayEnd(replayEndCallback);
        match.OnStatfeedEvent(statfeedCallback);
        match.statfeeds.set('player1', [{ stat: {} as any, ttl: 5 }]); // Add some dummy data

        // Simulate the event: When an in game replay from a goal ends
        mockWs.triggerEvent('game', 'replay_end', {});

        expect(match.statfeeds.size).toBe(0);
        expect(replayEndCallback).toHaveBeenCalledTimes(1);
        expect(statfeedCallback).toHaveBeenCalledWith(new Map()); // Called with empty map
    });

    test('should update series score and set state on match_ended', () => {
        match.gameState.clockRunning = true; // Ensure it starts true
        const callback = jest.fn();
        match.OnGameEnded(callback);
        match.series = {
            series_txt: 'Test Series',
            length: 3,
            teams: [
                { team: 0, name: 'Blue', matches_won: 0, logo: '' },
                { team: 1, name: 'Orange', matches_won: 1, logo: '' },
            ],
        };
        const matchEndData = { winner_team_num: 1 };

        // Simulate the event: When name of team winner is displayed on screen after game is over
        mockWs.triggerEvent('game', 'match_ended', matchEndData);

        expect(match.gameState.state).toBe('game-ended');
        expect(match.gameState.clockRunning).toBe(false);
        expect(match.series.teams[1].matches_won).toBe(2);
        expect(callback).toHaveBeenCalledTimes(1);
        // Check if ws.send was called to update series
        expect(mockWs.sentMessages).toContainEqual({
            channel: 'local',
            event: 'series_update',
            data: match.series,
        });
        // Check if series update was sent to game channel from local call
        expect(mockWs.sentMessages).toContainEqual({
            channel: 'game',
            event: 'series_update',
            data: match.series,
        });
    });

     test('should set state to post-game on podium_start', () => {
        match.gameState.clockRunning = true; // Ensure it starts true
        const callback = jest.fn();
        match.OnPodiumStart(callback);

        // Simulate the event: Celebration screen for winners podium after game ends
        mockWs.triggerEvent('game', 'podium_start', {});

        expect(match.gameState.state).toBe('post-game');
        expect(match.gameState.clockRunning).toBe(false);
        expect(callback).toHaveBeenCalledTimes(1);
    });

    test('should reset game state on match_destroyed', () => {
        match.gameState.clockRunning = true; // Ensure it starts true
        const callback = jest.fn();
        match.OnMatchEnded(callback);
        // Modify state to simulate an active game
        match.gameState.setState('in-game');
        // Ensure players object exists, even if empty, to avoid TypeError in HandleStateChange
        // Simulate the event: Game state updates happens as soon as match_created is fired and until match_destroyed is called.
        mockWs.triggerEvent('game', 'update_state', { game: { time_seconds: 100 }, players: {} });

        // Simulate the event: When match OR replay is destroyed
        mockWs.triggerEvent('game', 'match_destroyed', {});

        expect(match.gameState.state).toBe('none');
        expect(match.gameState.game).toBeUndefined();
        expect(callback).toHaveBeenCalledTimes(1);
        expect(match.gameState.clockRunning).toBe(false);
    });

    test('should handle series updates from game channel', () => {
        const callback = jest.fn();
        match.OnSeriesUpdate(callback);
        const newSeries: Series = {
            series_txt: 'Updated Series',
            length: 5,
            teams: [
                { team: 0, name: 'Team A', matches_won: 1, logo: 'logoA' },
                { team: 1, name: 'Team B', matches_won: 2, logo: 'logoB' },
            ],
        };

        // Simulate the event: When we get a series update (from game channel)
        // Simulate receiving data wrapped in 'data' property (like from WebSocket)
        mockWs.triggerEvent('game', 'series_update', { data: newSeries });

        expect(match.series).toEqual(newSeries);
        expect(callback).toHaveBeenCalledWith(newSeries);
    });

    test('should handle series updates from local channel and send to game channel', () => {
        const callback = jest.fn();
        match.OnSeriesUpdate(callback);
        const newSeries: Series = {
            series_txt: 'Local Update',
            length: 1,
            teams: [
                { team: 0, name: 'Local Blue', matches_won: 0, logo: '' },
                { team: 1, name: 'Local Orange', matches_won: 0, logo: '' },
            ],
        };

        // Simulate the event: When we get a series update (from local channel)
        // Simulate receiving direct data (like from internal send)
        mockWs.triggerEvent('local', 'series_update', newSeries);

        expect(match.series).toEqual(newSeries);
        expect(callback).toHaveBeenCalledWith(newSeries);
        // Check if it was resent to the 'game' channel
        expect(mockWs.sentMessages).toContainEqual({
            channel: 'game',
            event: 'series_update',
            data: newSeries,
        });
    });

    // Add more tests for other events like statfeed_event, replay_start, etc.
    // Add tests for edge cases and different data scenarios.
});
