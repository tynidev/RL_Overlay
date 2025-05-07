/**
 * PlayCEAClient.ts
 * 
 * A TypeScript client for interacting with the PlayCEA tournament API.
 * This client provides methods for retrieving tournament data, searching for tournaments
 * by various criteria, and fetching bracket information.
 * 
 * Features:
 * - Fetches tournament data from the PlayCEA API
 * - Provides search functionality for tournaments
 * - Retrieves bracket information for specific tournaments
 * - Handles API response formatting with clear, descriptive types
 * - Implements resilient networking with configurable retry logic
 * 
 * Created: May 2025
 * Author: PlayCEA Stats Development Team
 */


// ================================================
// Client-facing Types (Public API)
// ================================================

/**
 * Represents a team participating in a tournament
 */
export interface TeamId {
    teamId: string;
}

/**
 * Represents a team member with their details
 */
export interface TeamMember {
    uid: string;
    displayName: string;
    displayDiscordName: string;
    iconUrl: string;
    isCaptain: boolean;
}

/**
 * Represents a detailed team with complete information
 */
export interface Team {
    teamId: string;
    displayName: string;
    organization: string;
    game: string;
    iconUrl: string;
    backgroundUrl: string;
    metadata: Record<string, unknown>;
    createdTimestamp: string;
    updatedTimestamp: string;
    members: TeamMember[];
    captains: TeamMember[];
    tournaments: {
        tournamentId: string;
    }[];
    joinCodes?: string[];
}

export interface TournamentTeam extends TeamId {
    isActive: boolean;
}

/**
 * Contains season information (league, year, season)
 */
export interface Season {
    league: string;
    year: string;
    season: string;
}

/**
 * Represents game information including metadata and resources
 */
export interface GameInfo {
    id: string;
    name: string;
    iconUrl: string;
    backgroundUrl: string;
    rulebookUrl: string;
}

/**
 * Comprehensive tournament information
 */
export interface Tournament {
    id: string;
    name: string;
    game: GameInfo;
    isCurrent: boolean;
    isLive: boolean;
    seasonInfo: Season;
    teams: TournamentTeam[];
    brackets: {
        bracketId: string;
        name: string;
    }[];
}

/**
 * Represents a game within a match with its details
 */
export interface GameMatch {
    gameId: string;
    teams: any[];
    format: number; // Typically represents team size (e.g., 3v3)
}

/**
 * Represents a match between teams in a bracket
 */
export interface Match {
    matchId: string;
    createdTimestamp: string;
    updatedTimestamp: string;
    teams: MatchTeam[];
    matchNumber: number;
    aceEnabled: number;
    roundId: string | number;
    metadata: Record<string, unknown>;
    bracketId: string;
    game: string;
    games: GameMatch[];
}

/**
 * Represents score details for a team in a match
 */
export interface TeamScore {
    win: number;
    loss: number;
    tie: number;
    game: number;
    tiebreak: number;
    base: number;
    oppDiff: Record<string, unknown>;
}

/**
 * Complete match information with all details
 */
export interface Match {
    matchId: string;
    createdTimestamp: string;
    updatedTimestamp: string;
    teams: MatchTeam[];
    matchNumber: number;
    aceEnabled: number;
    roundId: string | number;
    metadata: Record<string, unknown>;
    bracketId: string;
    game: string;
    games: MatchGame[];
    roundIndex?: number;
    complete?: boolean;
}

/**
 * Represents a team in a tournament bracket with extended information
 */
export interface MatchTeam extends TeamId {
    rank?: number;
    score?: number;
    position?: number;
}

/**
 * Represents a match game with details about teams and game format
 */
export interface MatchGame {
    gameId: string;
    teams: any[];
    format: number;  // Typically represents team size (e.g., 3v3)
}

/**
 * Represents score information for a match
 */
export interface MatchScore {
    matchId: string;
    scores: Record<string, TeamScore>;
    roundIndex: string;
    teams: {
        position: number;
        teamId: string;
    }[];
}

/**
 * Represents a round in a bracket
 */
export interface BracketRound {
    aceEnabled: number;
    gameCount: number;
    teams: RoundTeam[];
    scores: MatchScore[];
    format: string;
    roundName: string;
    roundId: string;
    bracketId: string;
    matches: Match[];
    teamFormats: number[];
    complete: boolean;
    xvxList?: number[];  // List of team sizes for each game (e.g., [3,3,3,3,3] for 3v3)
}

/**
 * Represents a team in a round with minimal information
 */
export interface RoundTeam extends TeamId {
    position?: number;
}

/**
 * Bracket information response containing all details about a specific bracket
 */
export interface Bracket {
    Id: string;
    name: string;
    game: string;
    tournamentId: string;
    teams: BracketTeam[];
    rounds: BracketRound[];
    createdTimestamp: string;
    updatedTimestamp?: string;
}

/**
 * Represents a team in a tournament bracket with extended information
 */
export interface BracketTeam extends TeamId {
    rank?: number;
    displayName: string;
    organization: string;
    iconUrl: string;
    score?: number;
    position?: number;
}

// ================================================
// Constants
// ================================================

/**
 * Base API URL for PlayCEA endpoints
 */
const API_URL = 'https://1ebv8yx4pa.execute-api.us-east-1.amazonaws.com/prod/';

// ================================================
// PlayCEA Client Implementation
// ================================================

/**
 * Client for interacting with the PlayCEA Tournament API.
 * 
 * This client provides methods to retrieve tournament data, search for tournaments
 * based on various criteria, and fetch bracket information for specific tournaments.
 * It handles API response transformation, error handling, and implements resilient
 * networking with retry capabilities for transient failures.
 * 
 * Example usage:
 * ```typescript
 * const client = new PlayCEAClient();
 * 
 * // Get all tournaments
 * const allTournaments = await client.getTournaments();
 * 
 * // Search for live Rocket League tournaments
 * const rlTournaments = await client.searchTournaments(/Rocket/i, { year: "2025" }, "Rocket League");
 * 
 * // Get bracket information for a specific tournament
 * const brackets = await client.getBrackets("tournamentId123");
 * ```
 */
class PlayCEAClient {
    private apiUrl: string;
    private maxRetries: number;
    private retryDelayMs: number;

    /**
     * Creates a new PlayCEA API client
     * @param apiUrl - Base URL for the PlayCEA API (defaults to production endpoint)
     * @param maxRetries - Maximum number of retry attempts for failed requests
     * @param retryDelayMs - Base delay between retry attempts in milliseconds
     * @throws Will throw an error if the URL is invalid
     */
    constructor(
        apiUrl: string = API_URL, 
        maxRetries: number = 3, 
        retryDelayMs: number = 500
    ) {
        // Ensure URL ends with trailing slash
        this.apiUrl = apiUrl.endsWith('/') ? apiUrl : `${apiUrl}/`;
        this.maxRetries = maxRetries;
        this.retryDelayMs = retryDelayMs;
    }

    // ------------------------------------------------
    // Public Methods
    // ------------------------------------------------

    /**
     * Fetches all tournaments from the API
     * @returns A promise that resolves to a TournamentsResponse containing transformed Tournament objects
     * @throws Will throw an error if the fetch fails or the response is not ok
     */
    async getTournaments(): Promise<Tournament[]> {
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

            return apiResponse.data.map(tournament => this.mapApiTournamentToTournament(tournament));

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
            const matchingTournaments = apiResponse.filter(tournament => {
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
     * Fetches bracket information for a specific bracket ID
     * @param bracketId - The ID of the bracket to retrieve
     * @returns A promise that resolves to a BracketResponse containing transformed bracket data
     * @throws Will throw an error if the fetch fails or the response is not ok
     */
    async getBracket(bracketId: string): Promise<Bracket> {
        try {
            // Use the retryFetch method to get bracket data using the bracketId
            const response = await this.retryFetch(`${this.apiUrl}brackets/${bracketId}`);

            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}: ${response.statusText}`);
            }

            // Parse the JSON response as the raw API response type
            const apiResponse: ApiResponse.BracketApiResponse = await response.json();

            // Validate the response format
            if (!apiResponse || typeof apiResponse !== 'object' || !Array.isArray(apiResponse.data)) {
                throw new Error('Invalid API response format: Expected an object with a "data" array.');
            }

            // The API returns an array but we're expecting a single bracket
            const bracketData = apiResponse.data[0];
            
            if (!bracketData) {
                throw new Error(`No bracket found with ID: ${bracketId}`);
            }

            // Transform API response to client-friendly format
            const transformedResponse: Bracket = {
                Id: bracketId,
                createdTimestamp: bracketData.cts,
                updatedTimestamp: bracketData.uts,
                tournamentId: bracketData.tmid,
                teams: bracketData.ts 
                    ? bracketData.ts
                        .map(team => this.mapApiBracketTeamToBracketTeam(team))
                        .sort((a, b) => {
                            // If both have ranks, sort by rank (ascending)
                            if (a.rank !== undefined && b.rank !== undefined) {
                                if (a.rank === b.rank) {
                                    // Sort alphabetically by display name when ranks are equal
                                    return a.displayName.localeCompare(b.displayName);
                                } else {
                                    return a.rank - b.rank;
                                }
                            }
                            // If only a has rank, put a first
                            if (a.rank !== undefined) return -1;
                            // If only b has rank, put b first
                            if (b.rank !== undefined) return 1;
                            // If neither has rank, maintain original order
                            return 0;
                        })
                    : [],
                rounds: bracketData.rounds ? bracketData.rounds.map(r => this.mapApiRoundToBracketRound(r)) : [],
                name: bracketData.name,
                game: bracketData.game
            };

            return transformedResponse;

        } catch (error) {
            console.error(`Error fetching bracket with ID ${bracketId}:`, error);
            // Re-throw the error so the caller can handle it
            throw error;
        }
    }

    /**
     * Fetches match information for a specific match ID
     * @param matchId - The ID of the match to retrieve
     * @returns A promise that resolves to a MatchResponse containing transformed match data
     * @throws Will throw an error if the fetch fails or the response is not ok
     */
    async getMatch(matchId: string): Promise<Match> {
        try {
            // Use the retryFetch method to get match data using the matchId
            const response = await this.retryFetch(`${this.apiUrl}matches/${matchId}`);

            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}: ${response.statusText}`);
            }

            // Parse the JSON response as the raw API response type
            const apiResponse: ApiResponse.MatchesApiResponse = await response.json();

            // Validate the response format
            if (!apiResponse || typeof apiResponse !== 'object' || apiResponse.data === undefined) {
                throw new Error('Invalid API response format: Expected an object with a "data" array.');
            }
            
            const matchData = apiResponse.data;

            if (!matchData) {
                throw new Error(`No match found with ID: ${matchId}`);
            }

            // Transform API response to client-friendly format
            const transformedResponse: Match = {
                matchId: matchId,
                createdTimestamp: matchData.cts,
                updatedTimestamp: matchData.uts,
                teams: matchData.ts.map(team => this.mapApiMatchTeamToMatchTeam(team)),
                matchNumber: matchData.mn,
                aceEnabled: matchData.ace,
                roundId: matchData.rnd,
                roundIndex: matchData.rnd,
                metadata: matchData.meta || {},
                bracketId: matchData.bid,
                game: matchData.game,
                games: matchData.gs.map(game => ({
                    gameId: game.gid,
                    teams: game.ts || [],
                    format: game.xvx
                })),
                complete: matchData.complete,
            };

            return transformedResponse;

        } catch (error) {
            console.error(`Error fetching match with ID ${matchId}:`, error);
            // Re-throw the error so the caller can handle it
            throw error;
        }
    }

    /**
     * Fetches team information for a specific team ID
     * @param teamId - The ID of the team to retrieve
     * @returns A promise that resolves to a DetailedTeam containing transformed team data
     * @throws Will throw an error if the fetch fails or the response is not ok
     */
    async getTeam(teamId: string): Promise<Team> {
        try {
            // Use the retryFetch method to get team data using the teamId
            const response = await this.retryFetch(`${this.apiUrl}teams/${teamId}`);

            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}: ${response.statusText}`);
            }

            // Parse the JSON response as the raw API response type
            const apiResponse: ApiResponse.TeamApiResponse = await response.json();

            // Validate the response format
            if (!apiResponse || typeof apiResponse !== 'object' || !Array.isArray(apiResponse.data)) {
                throw new Error('Invalid API response format: Expected an object with a "data" array.');
            }

            // The API returns an array but we're expecting a single team
            const teamData = apiResponse.data[0];
            
            if (!teamData) {
                throw new Error(`No team found with ID: ${teamId}`);
            }

            // Transform API response to client-friendly format
            const transformedResponse: Team = {
                teamId: teamData.tid,
                displayName: teamData.dn,
                organization: teamData.org,
                game: teamData.game,
                iconUrl: teamData.ico,
                backgroundUrl: teamData.bg,
                metadata: teamData.meta || {},
                createdTimestamp: teamData.cts,
                updatedTimestamp: teamData.uts,
                members: teamData.mbr.map(member => this.mapApiTeamMemberToTeamMember(member)),
                captains: teamData.capt.map(captain => this.mapApiTeamMemberToTeamMember(captain)),
                tournaments: teamData.tms.map(tournament => ({
                    tournamentId: tournament.tmid
                })),
                joinCodes: teamData.jc
            };

            return transformedResponse;

        } catch (error) {
            console.error(`Error fetching team with ID ${teamId}:`, error);
            // Re-throw the error so the caller can handle it
            throw error;
        }
    }

    // ------------------------------------------------
    // Private Helper Methods
    // ------------------------------------------------

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
                    // Handle specific status codes differently
                    if (response.status === 504) { // Gateway Timeout
                        console.log('Gateway Timeout detected, retrying with short delay...');
                        if (attempt < this.maxRetries - 1) {
                            await new Promise(resolve => setTimeout(resolve, 200)); // 200ms delay
                            continue;
                        }
                    } 
                    else if (response.status === 429) { // Too Many Requests
                        console.log('Rate limit reached, retrying after longer delay...');
                        if (attempt < this.maxRetries - 1) {
                            await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay
                            continue;
                        }
                    }
                    // For all other error status codes, return the response and let the caller handle it
                    // This includes 502, 503 and other errors
                    return response;
                }
                
                // If we get here, the response was successful
                return response;
                
            } catch (error: any) {
                lastError = error;
                
                // Only retry on network errors
                const isNetworkError = error.message.includes('network') || 
                                      error.message.includes('failed to fetch');
                
                if (isNetworkError) {
                    // If we have more retries left, wait and then continue to the next attempt
                    console.log(`Network error encountered, retrying in ${this.retryDelayMs}ms...`);
                    await new Promise(resolve => setTimeout(resolve, this.retryDelayMs));
                    continue;
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
            id: apiTournament.tmid,
            brackets: apiTournament.bs
                .filter(stage => stage.bid === apiTournament.sbkt.reg || stage.bid === apiTournament.sbkt.po)
                .map(stage => ({
                    bracketId: stage.bid,
                    name: stage.name
                })),
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
        };
    }

    /**
     * Maps API response bracket team data to client-friendly BracketTeam objects
     * @param apiBracketTeam - Team data from the bracket API response
     * @returns A transformed BracketTeam object with clear field names
     */
    private mapApiBracketTeamToBracketTeam(apiBracketTeam: ApiResponse.BracketTeam): BracketTeam {
        return {
            teamId: apiBracketTeam.tid,
            rank: apiBracketTeam.r,
            displayName: apiBracketTeam.dn,
            organization: apiBracketTeam.org,
            iconUrl: apiBracketTeam.ico,
            score: apiBracketTeam.s,
            position: apiBracketTeam.p
        };
    }

    /**
     * Maps API response bracket team data to client-friendly BracketTeam objects
     * @param apiMatchTeam - Team data from the match API response
     * @returns A transformed MatchTeam object with clear field names
     */
    private mapApiMatchTeamToMatchTeam(apiMatchTeam: ApiResponse.MatchTeam): MatchTeam {
        return {
            teamId: apiMatchTeam.tid,
            score: apiMatchTeam.s,
            position: apiMatchTeam.p
        };
    }

    /**
     * Maps API response round data to client-friendly BracketRound objects
     * @param apiRound - Round data from the API
     * @returns A transformed BracketRound object with clear field names
     */
    private mapApiRoundToBracketRound(apiRound: ApiResponse.Round): BracketRound {
        return {
            aceEnabled: apiRound.ace,
            gameCount: apiRound.gameCount,
            teams: Array.isArray(apiRound.teams) ? apiRound.teams.map(team => ({
                teamId: team.tid,
                position: undefined
            })) : [],
            scores: Array.isArray(apiRound.scores) ? apiRound.scores.map(score => ({
                matchId: score.mid,
                scores: score.scores || {},
                roundIndex: score.ridx,
                teams: Array.isArray(score.ts) ? score.ts.map(team => ({
                    position: team.p,
                    teamId: team.tid
                })) : []
            })) : [],
            format: apiRound.format,
            roundName: apiRound.roundName,
            roundId: apiRound.rid,
            bracketId: apiRound.bid,
            matches: Array.isArray(apiRound.matches) ? apiRound.matches.map(match => ({
                matchId: match.mid,
                createdTimestamp: match.cts,
                updatedTimestamp: match.uts,
                teams: Array.isArray(match.ts) ? match.ts.map(team => this.mapApiBracketTeamToBracketTeam(team)) : [],
                matchNumber: match.mn,
                aceEnabled: match.ace,
                roundId: match.rnd,
                metadata: match.meta || {},
                bracketId: match.bid,
                game: match.game,
                games: Array.isArray(match.gs) ? match.gs.map(game => ({
                    gameId: game.gid,
                    teams: Array.isArray(game.ts) ? game.ts : [],
                    format: game.xvx
                })) : []
            })) : [],
            teamFormats: Array.isArray(apiRound.tf) ? apiRound.tf : [],
            complete: apiRound.c,
            xvxList: apiRound.xvxList
        };
    }

    /**
     * Maps API response team member data to client-friendly TeamMember objects
     * @param apiTeamMember - Team member data from the API response
     * @returns A transformed TeamMember object with clear field names
     */
    private mapApiTeamMemberToTeamMember(apiTeamMember: ApiResponse.TeamMember): TeamMember {
        return {
            uid: apiTeamMember.uid,
            displayName: apiTeamMember.dn,
            displayDiscordName: apiTeamMember.ddn,
            iconUrl: apiTeamMember.ico,
            isCaptain: apiTeamMember.captain
        };
    }
}

// Export the client and types for use in other modules
export { PlayCEAClient };

// ================================================
// API Response Types
// ================================================

/**
 * Priavte Namespace containing raw API response types with abbreviated field names
 */
namespace ApiResponse {
    /**
     * Raw API response for general messages
     */
    export interface ApiResponse {
        message: string;
    }

    export interface TournamentsApiResponse extends ApiResponse {
        data: Tournament[];
    }

    /**
     * Raw API response for bracket information
     */
    export interface BracketApiResponse extends ApiResponse {
        data: Bracket[];
    }

    /**
     * Raw API response for match information
     */
    export interface MatchesApiResponse extends ApiResponse {
        data: Match; // match data
    }

    /**
     * Raw API response for team information
     */
    export interface TeamApiResponse extends ApiResponse {
        data: TeamData[];
    }

    /**
     * Raw team data response
     */
    export interface TeamData {
        cts: string;       // creation timestamp
        org: string;       // organization name
        goo: string;       // game organization ID
        bg: string;        // background image URL
        meta: Record<string, unknown>; // metadata
        ms: any[];         // possibly members or matches
        dn: string;        // display name
        tid: string;       // team ID
        game: string;      // game code (e.g., "rl" for Rocket League)
        uts: string;       // updated timestamp
        ico: string;       // icon/logo URL
        jc: string[];      // join codes
        tms: { tmid: string }[]; // tournaments
        mbr: TeamMember[]; // members
        capt: TeamMember[]; // captains
    }

    /**
     * Raw team member data
     */
    export interface TeamMember {
        ico: string;       // icon/avatar URL
        dn: string;        // display name
        ddn: string;       // discord display name
        uid: string;       // user ID
        captain: boolean;  // is captain flag
    }

    /**
     * Raw API response for tournament information
     */
    export interface Tournament {
        ts: LeagueTeam[];  // teams
        tmid: string;          // tournamentId
        bs: {
            bid: string;       // bracketId
            name: string;
        }[];    // bracketStages
        meta: Record<string, unknown>; // metadata
        sbkt: {
            reg: string;       // regular
            po: string;        // playoff
        };      // subBracket ???
        sn: SeasonName;        // seasonName
        game: GameInfo;
        live: boolean;
        name: string;
        current: boolean;
        msg?: string;          // message (optional)
    }
    export interface Team {
        tid: string;       // teamId
    }
    export interface LeagueTeam extends Team {
        a: boolean;        // active
    }
    export interface SeasonName {
        l: string;         // league (e.g., "CORPORATE", "COLLEGIATE")
        y: string;         // year (e.g., "2022")
        s: string;         // season (e.g., "FALL", "SPRING")
    }
    export interface GameInfo {
        name: string;      // e.g., "Rocket League", "League of Legends"
        id: string;        // e.g., "rl", "lol", "chess"
        ico: string;       // icon URL
        bg: string;        // background image URL
        rb: string;        // rulebook URL
    }

    /**
     * Raw response for bracket data
     */
    export interface Bracket {
        cts: string;   // creation timestamp
        ts: BracketTeam[]; // teams
        tmid: string;  // tournamentId
        uts?: string;  // updated timestamp (optional)
        meta: Record<string, unknown>; // metadata
        rounds: Round[];  // rounds
        name: string;
        game: string;
        bid: string;   // bracketId
    };

    /**
     * Raw response for bracket team data
     */
    export interface BracketTeam extends LeagueTeam {
        ico: string;       // icon URL
        dn: string;        // display name
        org: string;       // organization
        s?: number;        // score
        p?: number;        // position
        r?: number;        // rank
    }

    /**
     * Raw response for round data
     */
    export interface Round {
        ace: number;       // aceEnabled
        gameCount: number;        // gameCount
        teams: Team[];
        scores: {
            mid: string;   // matchId
            scores: Record<string, {
                win: number;
                loss: number;
                tie: number;
                game: number;
                tiebreak: number;
                base: number;
                oppDiff: Record<string, unknown>;
            }>; // scores
            ridx: string;    // roundIndex
            ts: {
                p: number; // position
                tid: string; // teamId
            }[];
        }[];
        format: string;       // format
        roundName: string;        // roundName
        rid: string;       // roundId
        bid: string;       // bracketId
        matches: Match[];
        tf: number[];      // teamFormats
        c: boolean;        // complete
        xvxList?: number[];  // List of team sizes for each game (e.g., [3,3,3,3,3] for 3v3)
    }

    /**
     * Raw response for bracket match data
     */
    export interface BracketMatch {
        cts: string;    // createdTimestamp
        ts: BracketTeam[]; // teams
        uts: string;    // updatedTimestamp
        mn: number;     // matchNumber
        ace: number;    // aceEnabled
        mid: string;    // matchId
        rnd: number;    // roundIndex
        meta: Record<string, unknown>; // metadata
        bid: string;    // bracketId
        game: string;   // game
        gs: MatchGame[];
    };

    /**
     * Raw response for match data
     */
    export interface Match extends BracketMatch {
        complete: boolean; // complete
        ll: boolean; // live
    };

    export interface MatchGame {
        gid: string; // gameId
        ts: GameTeam[];   // teams
        xvx: number; // format
    }

    export interface GameTeam extends Team {
        rs: number;        // roundScore
        uids: string[]; // userIds
    }

    export interface MatchTeam extends Team {
        s?: number;        // score
        p?: number;        // position
        rank?: number;    // rank
    }
}