// filepath: c:\Users\Tyler.TYLERS-PC\source\repos\RL_Overlay\console-apps\displayTournaments.ts

import { PlayCEAClient, Tournament, Season } from './PlayCEAClient.js';
import * as readline from 'readline';

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
                            // Get the bracket details using the new getBracket method
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
                            
                            // Display rounds
                            console.log(`\nRounds (${bracketData.rounds.length}):`);
                            bracketData.rounds.forEach((round, roundIdx) => {
                                console.log(`\nRound ${roundIdx + 1}: ${round.roundName} - Format: ${round.format} (${round.complete ? 'Complete' : 'In Progress'})`);
                                
                                // Display matches in each round
                                console.log(`Matches (${round.matches.length}):`);
                                round.matches.forEach((match, matchIdx) => {
                                    if (match.teams.length >= 2) {
                                        const team1 = match.teams[0];
                                        const team2 = match.teams[1];
                                        console.log(
                                            `  ${matchIdx + 1}. ${team1.displayName} ${team1.score || 0} vs ${team2.score || 0} ${team2.displayName}`
                                        );
                                    } else {
                                        console.log(`  ${matchIdx + 1}. Match #${match.matchNumber} (Teams not set)`);
                                    }
                                });
                            });
                            
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