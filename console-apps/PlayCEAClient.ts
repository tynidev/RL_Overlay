// filepath: c:\Users\Tyler.TYLERS-PC\source\repos\RL_Overlay\console-apps\PlayCEAClient.ts

// Define the API response types with abbreviated field names
namespace ApiResponse {
    export interface TeamIdentifier {
        a: boolean; // active
        tid: string; // teamId
    }

    export interface BracketStage {
        bid: string; // bracketId
        name: string;
    }

    export interface SeasonName {
        l: string; // league (e.g., "CORPORATE", "COLLEGIATE")
        y: string; // year (e.g., "2022")
        s: string; // season (e.g., "FALL", "SPRING")
    }

    export interface GameInfo {
        id: string; // e.g., "rl", "lol", "chess"
        name: string; // e.g., "Rocket League", "League of Legends"
        ico: string; // icon URL
        bg: string; // background image URL
        rb: string; // rulebook URL
    }

    export interface SubBracket {
        reg: string; // regular
        po: string; // playoff
    }

    export interface Tournament {
        ts: TeamIdentifier[]; // teams
        tmid: string; // tournamentId
        bs: BracketStage[]; // bracketStages
        meta: Record<string, unknown>; // metadata
        sbkt: SubBracket; // subBracket
        sn: SeasonName; // seasonName
        game: GameInfo;
        live: boolean;
        name: string;
        current: boolean;
        msg?: string; // message (optional)
    }

    export interface TournamentsApiResponse {
        message: string;
        data: Tournament[];
    }

    export interface BracketMatch {
        mId: string;       // matchId
        rnd: number;       // round
        pos: number;       // position
        p1s: number;       // player1Score
        p2s: number;       // player2Score
        schT: string;      // scheduledTime (ISO date string)
        p1?: string;       // player1Id (optional)
        p2?: string;       // player2Id (optional)
        win?: string;      // winnerId (optional)
        los?: string;      // loserId (optional)
        p1n?: string;      // player1Name (optional)
        p2n?: string;      // player2Name (optional)
        cmplt?: boolean;   // completed (optional)
    }

    export interface BracketData {
        name: string;
        matches: BracketMatch[];
        bid: string;       // bracketId
    }

    export interface BracketsApiResponse {
        message: string;
        data: BracketData[];
    }
}

// Define the client-facing types with clear, descriptive field names
export interface Team {
    isActive: boolean;
    teamId: string;
}

export interface Bracket {
    bracketId: string;
    name: string;
}

export interface Season {
    league: string;
    year: string;
    season: string;
}

export interface Game {
    id: string;
    name: string;
    iconUrl: string;
    backgroundUrl: string;
    rulebookUrl: string;
}

export interface SubBracketInfo {
    regular: string;
    playoff: string;
}

export interface Tournament {
    teams: Team[];
    tournamentId: string;
    bracketStages: Bracket[];
    metadata: Record<string, unknown>;
    subBracket: SubBracketInfo;
    seasonInfo: Season;
    game: Game;
    isLive: boolean;
    name: string;
    isCurrent: boolean;
    message?: string;
}

export interface TournamentsResponse {
    message: string;
    tournaments: Tournament[];
}

export interface Match {
    matchId: string;
    round: number;
    position: number;
    player1Score: number;
    player2Score: number;
    scheduledTime: string;
    player1Id?: string;
    player2Id?: string;
    winnerId?: string;
    loserId?: string;
    player1Name?: string;
    player2Name?: string;
    completed?: boolean;
}

export interface BracketData {
    name: string;
    matches: Match[];
    bracketId: string;
}

export interface BracketsResponse {
    message: string;
    brackets: BracketData[];
}

const API_URL = 'https://1ebv8yx4pa.execute-api.us-east-1.amazonaws.com/prod/';

/**
 * Client for fetching tournament data from the PlayCEA API.
 */
class PlayCEAClient {
    private apiUrl: string;
    private maxRetries: number;
    private retryDelayMs: number;

    constructor(
        apiUrl: string = API_URL, 
        maxRetries: number = 3, 
        retryDelayMs: number = 500
    ) {
        this.apiUrl = apiUrl.endsWith('/') ? apiUrl : `${apiUrl}/`;
        this.maxRetries = maxRetries;
        this.retryDelayMs = retryDelayMs;
    }

    /**
     * Generic function for retrying API requests
     * @param url - The URL to fetch
     * @param options - Fetch options
     * @returns A promise that resolves to the fetch Response
     * @throws Will throw an error if the fetch fails after all retry attempts
     */
    private async retryFetch(url: string, options?: RequestInit): Promise<Response> {
        let lastError: Error | null = null;
        
        // Add User-Agent header to options
        const fetchOptions: RequestInit = {
            ...options,
            headers: {
                ...options?.headers,
                'User-Agent': 'Play CEA Stats Collector'
            }
        };
        
        // Try the request up to maxRetries times
        for (let attempt = 0; attempt < this.maxRetries; attempt++) {
            try {
                // If this isn't the first attempt, log that we're retrying
                if (attempt > 0) {
                    console.log(`Retry attempt ${attempt} of ${this.maxRetries} for URL ${url}...`);
                }
                
                const response = await fetch(url, fetchOptions);

                // Check if response was successful
                if (!response.ok) {
                    // If we get a 502, 503, or 504 (common gateway/server errors), throw error to trigger retry
                    if ([502, 503, 504].includes(response.status)) {
                        throw new Error(`API request failed with status ${response.status}: ${response.statusText} (Server Error)`);
                    }
                    
                    // For other error status codes, return the response and let the caller handle it
                    // This prevents retrying for client errors like 400, 401, 404, etc.
                    return response;
                }
                
                // If we get here, the response was successful
                return response;
                
            } catch (error: any) {
                lastError = error;
                
                // Only retry on network errors or specific server errors
                const isNetworkError = error.message.includes('network') || 
                                      error.message.includes('failed to fetch');
                const isServerError = error.message.includes('Server Error');
                
                if (isNetworkError || isServerError) {
                    // If we have more retries left, wait and then continue to the next attempt
                    if (attempt < this.maxRetries - 1) {
                        console.log(`API error encountered, retrying in ${this.retryDelayMs}ms...`);
                        await new Promise(resolve => setTimeout(resolve, this.retryDelayMs));
                        continue;
                    }
                } else {
                    // For other types of errors, don't retry
                    break;
                }
            }
        }
        
        // If we get here, all retry attempts failed
        console.error(`Request failed after ${this.maxRetries} attempts:`);
        throw lastError || new Error('Request failed with unknown error');
    }

    /**
     * Maps API response tournament data to client-friendly Tournament objects
     * @param apiTournament - Tournament data from the API
     * @returns A transformed Tournament object with clear field names
     */
    private mapApiTournamentToTournament(apiTournament: ApiResponse.Tournament): Tournament {
        return {
            teams: apiTournament.ts.map(team => ({
                isActive: team.a,
                teamId: team.tid
            })),
            tournamentId: apiTournament.tmid,
            bracketStages: apiTournament.bs.map(stage => ({
                bracketId: stage.bid,
                name: stage.name
            })),
            metadata: apiTournament.meta,
            subBracket: {
                regular: apiTournament.sbkt.reg,
                playoff: apiTournament.sbkt.po
            },
            seasonInfo: {
                league: apiTournament.sn.l,
                year: apiTournament.sn.y,
                season: apiTournament.sn.s
            },
            game: {
                id: apiTournament.game.id,
                name: apiTournament.game.name,
                iconUrl: apiTournament.game.ico,
                backgroundUrl: apiTournament.game.bg,
                rulebookUrl: apiTournament.game.rb
            },
            isLive: apiTournament.live,
            name: apiTournament.name,
            isCurrent: apiTournament.current,
            message: apiTournament.msg
        };
    }

    /**
     * Fetches all tournaments from the API.
     * @returns A promise that resolves to a TournamentsResponse containing transformed Tournament objects
     * @throws Will throw an error if the fetch fails or the response is not ok.
     */
    async getTournaments(): Promise<TournamentsResponse> {
        try {
            // Use the retryFetch method instead of direct fetch
            const response = await this.retryFetch(`${this.apiUrl}tournaments`);

            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}: ${response.statusText}`);
            }

            // Parse the JSON response as the raw API response type
            const apiResponse: ApiResponse.TournamentsApiResponse = await response.json();

            // Optional: Add validation here to ensure the data matches the expected type
            if (!apiResponse || typeof apiResponse !== 'object' || !Array.isArray(apiResponse.data)) {
                throw new Error('Invalid API response format: Expected an object with a "data" array.');
            }

            // Transform API response to client-friendly format
            const transformedResponse: TournamentsResponse = {
                message: apiResponse.message,
                tournaments: apiResponse.data.map(tournament => this.mapApiTournamentToTournament(tournament))
            };

            return transformedResponse;

        } catch (error) {
            console.error('Error fetching tournaments:', error);
            // Re-throw the error so the caller can handle it
            throw error;
        }
    }

    /**
     * Searches for live tournaments that match the provided criteria
     * @param tournamentName - Optional regular expression pattern to match tournament names
     * @param seasonInfo - Optional Season object to match season properties
     * @param gameName - Optional string to match game name
     * @returns Promise that resolves to an array of matching Tournament objects
     */
    async searchTournaments(
        tournamentName?: RegExp, 
        seasonInfo?: Partial<Season>, 
        gameName?: string
    ): Promise<Tournament[]> {
        try {
            const apiResponse = await this.getTournaments();
            
            // Filter tournaments that are live and match all provided criteria
            const matchingTournaments = apiResponse.tournaments.filter(tournament => {
                // Only include live tournaments
                if (!tournament.isLive) return false;
                
                // Check tournament name against the regex pattern if provided
                if (tournamentName && !tournamentName.test(tournament.name)) return false;
                
                // If seasonInfo is provided, check all specified properties
                if (seasonInfo) {
                    if (seasonInfo.league && tournament.seasonInfo.league !== seasonInfo.league) return false;
                    if (seasonInfo.year && tournament.seasonInfo.year !== seasonInfo.year) return false;
                    if (seasonInfo.season && tournament.seasonInfo.season !== seasonInfo.season) return false;
                }
                
                // If gameName is provided, check game name
                if (gameName && tournament.game.name !== gameName) return false;
                
                // All criteria matched
                return true;
            });
            
            return matchingTournaments;
            
        } catch (error) {
            console.error('Failed to search tournaments:', error);
            throw error;
        }
    }

    /**
     * Maps API response bracket data to client-friendly BracketData objects
     * @param apiBracket - Bracket data from the API
     * @returns A transformed BracketData object with clear field names
     */
    private mapApiBracketToBracketData(apiBracket: ApiResponse.BracketData): BracketData {
        return {
            name: apiBracket.name,
            bracketId: apiBracket.bid,
            matches: apiBracket.matches.map(match => ({
                matchId: match.mId,
                round: match.rnd,
                position: match.pos,
                player1Score: match.p1s,
                player2Score: match.p2s,
                scheduledTime: match.schT,
                player1Id: match.p1,
                player2Id: match.p2,
                winnerId: match.win,
                loserId: match.los,
                player1Name: match.p1n,
                player2Name: match.p2n,
                completed: match.cmplt
            }))
        };
    }

    /**
     * Fetches bracket data for a specific tournament
     * @param tournamentId - The ID of the tournament to fetch brackets for
     * @returns A promise that resolves to a BracketsResponse containing transformed BracketData objects
     * @throws Will throw an error if the fetch fails after all retry attempts
     */
    async getBrackets(tournamentId: string): Promise<BracketsResponse> {
        try {
            // Use the retryFetch method instead of direct fetch
            const response = await this.retryFetch(`${this.apiUrl}brackets/${tournamentId}`);

            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}: ${response.statusText}`);
            }

            // Parse the JSON response as the raw API response type
            const apiResponse: ApiResponse.BracketsApiResponse = await response.json();

            // Optional: Add validation here to ensure the data matches the expected type
            if (!apiResponse || typeof apiResponse !== 'object' || !Array.isArray(apiResponse.data)) {
                throw new Error('Invalid API response format: Expected an object with a "data" array.');
            }

            // Transform API response to client-friendly format
            const transformedResponse: BracketsResponse = {
                message: apiResponse.message,
                brackets: apiResponse.data.map(bracket => this.mapApiBracketToBracketData(bracket))
            };

            return transformedResponse;

        } catch (error) {
            console.error(`Error fetching brackets for tournament ${tournamentId}:`, error);
            // Re-throw the error so the caller can handle it
            throw error;
        }
    }
}

// Export the client and types for use in other modules
export { PlayCEAClient };

