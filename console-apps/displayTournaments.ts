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
                console.log(`\nFetching brackets for: ${selectedTournament.name}...`);
                
                // Get brackets for the selected tournament
                const bracketsResponse = await client.getBrackets(selectedTournament.tournamentId);
                
                console.log(`\nFound ${bracketsResponse.brackets.length} brackets for ${selectedTournament.name}:`);
                
                // Display each bracket
                bracketsResponse.brackets.forEach((bracket, i) => {
                    console.log(`\nBracket ${i + 1}: ${bracket.name}`);
                    console.log('=' + '='.repeat(bracket.name.length + 11));
                    
                    if (bracket.matches.length === 0) {
                        console.log('No matches found in this bracket.');
                    } else {
                        // Group matches by round
                        const matchesByRound: { [round: number]: typeof bracket.matches } = {};
                        
                        bracket.matches.forEach(match => {
                            if (!matchesByRound[match.round]) {
                                matchesByRound[match.round] = [];
                            }
                            matchesByRound[match.round].push(match);
                        });
                        
                        // Display matches by round
                        Object.keys(matchesByRound)
                            .map(Number)
                            .sort((a, b) => a - b)
                            .forEach(round => {
                                console.log(`\nRound ${round}:`);
                                matchesByRound[round].forEach(match => {
                                    const player1 = match.player1Name || 'TBD';
                                    const player2 = match.player2Name || 'TBD';
                                    const score = match.completed ? 
                                        `${match.player1Score} - ${match.player2Score}` : 
                                        'Not played';
                                    
                                    console.log(`  ${player1} vs ${player2} (${score})`);
                                });
                            });
                    }
                });
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