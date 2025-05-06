// filepath: c:\Users\Tyler.TYLERS-PC\source\repos\RL_Overlay\console-apps\displayTournaments.ts

import { PlayCEAClient, Tournament, Season, Match } from './PlayCEAClient.js';
import * as readline from 'readline';

/**
 * Interface for match items in the allMatches array
 */
interface MatchItem {
    index: number;
    matchId: string;
    roundIndex: number;
    matchIndex: number;
    match: Match;
}

/**
 * Creates a readline interface for user input/output
 * @returns A readline interface
 */
function createReadlineInterface() {
    return readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
}

/**
 * Asks a question and returns the user's response
 * @param rl - The readline interface
 * @param question - The question to ask
 * @returns A promise that resolves to the user's response
 */
function askQuestion(rl: readline.Interface, question: string): Promise<string> {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer);
        });
    });
}

/**
 * Examines tournaments matching criteria and allows user to select one to view its brackets
 * @param tournamentName - Optional regular expression pattern to match tournament names
 * @param seasonInfo - Optional Season object to match season properties
 * @param gameName - Optional string to match game name
 */
async function examineMatchingTournaments(
    tournamentName?: RegExp, 
    seasonInfo?: Partial<Season>, 
    gameName?: string
): Promise<void> {
    const client = new PlayCEAClient();
    try {
        const matchingTournaments = await client.searchTournaments(tournamentName, seasonInfo, gameName);
        
        console.log(`Found ${matchingTournaments.length} live tournaments matching criteria:`);
        if (tournamentName) console.log(`- Tournament name pattern: ${tournamentName}`);
        if (seasonInfo) console.log(`- Season: ${JSON.stringify(seasonInfo)}`);
        if (gameName) console.log(`- Game: ${gameName}`);
        
        // Display the matching tournaments with index numbers
        if (matchingTournaments.length > 0) {
            matchingTournaments.forEach((tournament, index) => {
                console.log(`${index + 1}. ${tournament.name} (${tournament.game.name}) - ${tournament.seasonInfo.league} ${tournament.seasonInfo.season} ${tournament.seasonInfo.year}`);
            });
            
            // Ask user which tournament they want to examine
            const rl = createReadlineInterface();
            
            const response = await askQuestion(
                rl, 
                `\nEnter the number of the tournament to view brackets (1-${matchingTournaments.length}) or 0 to exit: `
            );
            
            const selection = parseInt(response);
            
            if (selection > 0 && selection <= matchingTournaments.length) {
                const selectedTournament = matchingTournaments[selection - 1];
                console.log(`\nYou selected: ${selectedTournament.name} (${selectedTournament.game.name})`);
                
                // Display available bracket stages
                console.log("\nAvailable bracket stages:");
                if (selectedTournament.bracketStages.length > 0) {
                    selectedTournament.bracketStages.forEach((bracket, idx) => {
                        console.log(`${idx + 1}. ${bracket.name} (ID: ${bracket.bracketId})`);
                    });
                    
                    // Prompt user to select a bracket
                    const bracketResponse = await askQuestion(
                        rl, 
                        `\nEnter the number of the bracket to view details (1-${selectedTournament.bracketStages.length}) or 0 to exit: `
                    );
                    
                    const bracketSelection = parseInt(bracketResponse);
                    
                    if (bracketSelection > 0 && bracketSelection <= selectedTournament.bracketStages.length) {
                        const selectedBracket = selectedTournament.bracketStages[bracketSelection - 1];
                        console.log(`\nFetching details for bracket: ${selectedBracket.name}`);
                        
                        try {
                            // Get the bracket details using the getBracket method
                            const bracketData = await client.getBracket(selectedBracket.bracketId);
                            
                            console.log(`\n==== ${bracketData.name} Bracket Details ====`);
                            console.log(`Bracket ID: ${bracketData.bracketId}`);
                            console.log(`Tournament ID: ${bracketData.tournamentId}`);
                            console.log(`Created: ${new Date(bracketData.createdTimestamp).toLocaleString()}`);
                            if (bracketData.updatedTimestamp) {
                                console.log(`Last Updated: ${new Date(bracketData.updatedTimestamp).toLocaleString()}`);
                            }
                            
                            // Display teams in the bracket
                            console.log(`\nTeams (${bracketData.teams.length}):`);
                            bracketData.teams.forEach((team, idx) => {
                                console.log(`${idx + 1}. ${team.displayName} (${team.organization}) - Rank: ${team.rank || 'N/A'}`);
                            });
                            
                            // Create an array to store all match IDs for easy selection
                            const allMatches: MatchItem[] = [];
                            
                            // Display rounds
                            console.log(`\nRounds (${bracketData.rounds.length}):`);
                            bracketData.rounds.forEach((round, roundIdx) => {
                                console.log(`\nRound ${roundIdx + 1}: ${round.roundName} - Format: ${round.format} (${round.complete ? 'Complete' : 'In Progress'})`);
                                
                                // Display matches in each round
                                console.log(`Matches (${round.matches.length}):`);
                                round.matches.forEach((match, matchIdx) => {
                                    // Add match to allMatches array with additional reference info
                                    allMatches.push({
                                        index: allMatches.length + 1,
                                        matchId: match.matchId,
                                        roundIndex: roundIdx + 1,
                                        matchIndex: matchIdx + 1,
                                        match: match
                                    });
                                    
                                    if (match.teams.length >= 2) {
                                        const team1 = match.teams[0];
                                        const team2 = match.teams[1];
                                        console.log(
                                            `  ${allMatches.length}. ${team1.displayName} ${team1.score || 0} vs ${team2.score || 0} ${team2.displayName} (Match ID: ${match.matchId})`
                                        );
                                    } else {
                                        console.log(`  ${allMatches.length}. Match #${match.matchNumber} (Teams not set) (Match ID: ${match.matchId})`);
                                    }
                                });
                            });
                            
                            // Prompt user to select a match to view details
                            if (allMatches.length > 0) {
                                const matchResponse = await askQuestion(
                                    rl,
                                    `\nEnter the number of the match to view details (1-${allMatches.length}) or 0 to exit: `
                                );
                                
                                const matchSelection = parseInt(matchResponse);
                                
                                if (matchSelection > 0 && matchSelection <= allMatches.length) {
                                    const selectedMatch = allMatches[matchSelection - 1];
                                    console.log(`\nFetching details for match: ${selectedMatch.matchId} (Round ${selectedMatch.roundIndex}, Match ${selectedMatch.matchIndex})`);
                                    
                                    try {
                                        // Get the match details using the getMatch method
                                        const matchData = await client.getMatch(selectedMatch.matchId);
                                        
                                        // Display detailed match information
                                        console.log(`\n==== Match Details ====`);
                                        console.log(`Match ID: ${matchData.matchId}`);
                                        console.log(`Round ID: ${matchData.roundId}`);
                                        console.log(`Bracket ID: ${matchData.bracketId}`);
                                        console.log(`Match Number: ${matchData.matchNumber}`);
                                        console.log(`Created: ${new Date(matchData.createdTimestamp).toLocaleString()}`);
                                        console.log(`Last Updated: ${new Date(matchData.updatedTimestamp).toLocaleString()}`);
                                        
                                        console.log(`\nTeams:`);
                                        matchData.teams.forEach((team, idx) => {
                                            console.log(`  Team ${idx + 1}: ${team.teamId}`);
                                            console.log(`     Score: ${team.score || 0}`);
                                        });
                                        
                                        console.log(`\nGames (${matchData.games.length}):`);
                                        matchData.games.forEach((game, idx) => {
                                            console.log(`  Game ${idx + 1} - ID: ${game.gameId}`);
                                            console.log(`     Format: ${game.format}v${game.format}`);
                                        });
                                        
                                    } catch (error) {
                                        console.error(`Error fetching match data: ${error}`);
                                    }
                                } else {
                                    console.log('No match selected or invalid selection.');
                                }
                            } else {
                                console.log('\nNo matches available in this bracket.');
                            }
                            
                        } catch (error) {
                            console.error(`Error fetching bracket data: ${error}`);
                        }
                    } else {
                        console.log('No bracket selected or invalid selection.');
                    }
                } else {
                    console.log('No bracket stages available for this tournament.');
                }
            } else {
                console.log('No tournament selected or invalid selection.');
            }
            
            rl.close();
            
        } else {
            console.log('No matching tournaments found.');
        }
        
    } catch (error) {
        console.error('Failed to search tournaments or fetch brackets:', error);
    }
}

/**
 * Displays tournament data from the PlayCEA API
 */
async function displayTournamentData() {
    // Examples of searching for tournaments (uncomment to use)
    // Search by name pattern only
    examineMatchingTournaments(/Rocket/i, { year: "2025" });

    // Search by game name only
    // examineMatchingTournaments(undefined, undefined, "League of Legends");

    // Search by season only
    // examineMatchingTournaments(undefined, { year: "2025", season: "SPRING" });

    // Search by name pattern and game name
    // examineMatchingTournaments(/League/i, undefined, "League of Legends");

    // Search by name pattern and season
    // examineMatchingTournaments(/Championship/i, { year: "2025", season: "SPRING" });

    // Search by season and game
    // examineMatchingTournaments(undefined, { league: "COLLEGIATE" }, "Rocket League");

    // Search by all criteria
    // examineMatchingTournaments(/Finals/i, { league: "COLLEGIATE", year: "2025" }, "Rocket League");
}

// Run the function when this module is executed directly
displayTournamentData();