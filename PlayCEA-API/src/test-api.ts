/**
 * Test utility for the PlayCEA API
 * 
 * This script demonstrates the usage of the PlayCEA API client
 * by allowing interactive exploration of tournaments, brackets, and matches.
 * Uses early termination pattern to avoid deeply nested if statements.
 */

import { PlayCEAClient, Tournament, Season, Match, Bracket } from './PlayCEAClient';
import * as readline from 'readline';

/**
 * Creates a readline interface for user input/output
 * @returns A readline interface
 */
function createReadlineInterface(): readline.Interface {
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
async function askQuestion(rl: readline.Interface, question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

/**
 * Prompts user to select an item from a list or exit
 * @param rl - The readline interface
 * @param items - Array of items to choose from
 * @param prompt - Question to ask the user
 * @param formatter - Function to format each item for display
 * @returns Selected item index (0-based) or null if user chose to exit
 */
async function promptForSelection<T>(
  rl: readline.Interface,
  items: T[],
  prompt: string,
  formatter: (item: T, index: number) => string
): Promise<number | null> {
  if (items.length === 0) {
    console.log('No items available to select from.');
    return null;
  }

  // Display the items with index numbers
  items.forEach((item, index) => {
    console.log(`${index + 1}. ${formatter(item, index)}`);
  });

  // Ask user to select an item
  const response = await askQuestion(rl, `\n${prompt} (1-${items.length}) or 0 to exit: `);
  const selection = parseInt(response);

  if (isNaN(selection) || selection < 0 || selection > items.length) {
    console.log('Invalid selection.');
    return null;
  }

  if (selection === 0) {
    console.log('Exiting selection.');
    return null;
  }

  // Convert from 1-based (user input) to 0-based (array index)
  return selection - 1;
}

/**
 * Step 1: Get and display tournaments matching search criteria
 * @returns Selected tournament or null if no selection made
 */
async function selectTournament(): Promise<Tournament | null> {
  const client = new PlayCEAClient();
  const currentYear = new Date().getFullYear().toString();
  
  try {
    console.log(`Searching for Rocket League tournaments in ${currentYear}...`);
    
    // Step 1: Get tournaments matching regex /Rocket/i in the current year
    const tournaments = await client.searchTournaments(/Rocket/i, { year: currentYear });
    
    console.log(`Found ${tournaments.length} live tournaments matching criteria:`);
    console.log(`- Tournament name pattern: /Rocket/i`);
    console.log(`- Year: ${currentYear}`);
    
    if (tournaments.length === 0) {
      console.log('No matching tournaments found.');
      return null;
    }
    
    // Prompt user to select a tournament
    const rl = createReadlineInterface();
    const tournamentIndex = await promptForSelection(
      rl,
      tournaments,
      'Enter the number of the tournament to view brackets',
      (tournament) => `${tournament.name} (${tournament.game.name}) - ${tournament.seasonInfo.league} ${tournament.seasonInfo.season} ${tournament.seasonInfo.year}`
    );
    
    rl.close();
    
    if (tournamentIndex === null) {
      return null;
    }
    
    const selectedTournament = tournaments[tournamentIndex];
    console.log(`\nYou selected: ${selectedTournament.name} (${selectedTournament.game.name})`);
    
    return selectedTournament;
    
  } catch (error) {
    console.error('Failed to search tournaments:', error);
    return null;
  }
}

/**
 * Step 2: Display brackets for selected tournament and prompt for selection
 * @param tournament - The tournament to get brackets from
 * @returns Selected bracketId or null if no selection made
 */
async function selectBracket(tournament: Tournament): Promise<string | null> {
  console.log("\nAvailable bracket stages:");
  
  if (tournament.brackets.length === 0) {
    console.log('No bracket stages available for this tournament.');
    return null;
  }
  
  // Prompt user to select a bracket
  const rl = createReadlineInterface();
  const bracketIndex = await promptForSelection(
    rl,
    tournament.brackets,
    'Enter the number of the bracket to view details',
    (bracket) => `${bracket.name} (ID: ${bracket.bracketId})`
  );
  
  rl.close();
  
  if (bracketIndex === null) {
    return null;
  }
  
  const selectedBracket = tournament.brackets[bracketIndex];
  console.log(`\nSelected bracket: ${selectedBracket.name}`);
  
  return selectedBracket.bracketId;
}

/**
 * Step 3: Get bracket details and display matches for selection
 * @param bracketId - ID of the bracket to get details for
 * @returns Selected matchId or null if no selection made
 */
async function selectMatch(bracketId: string): Promise<string | null> {
  const client = new PlayCEAClient();
  
  try {
    console.log(`\nFetching details for bracket ID: ${bracketId}`);
    
    // Get the bracket details
    const bracketData = await client.getBracket(bracketId);
    
    // Display bracket information
    console.log(`\n==== ${bracketData.name} Bracket Details ====`);
    console.log(`Bracket ID: ${bracketData.Id}`);
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
    
    // Create an array to store all matches for easy selection
    type MatchInfo = {
      matchId: string;
      roundIndex: number;
      matchIndex: number;
      displayName: string;
    };
    
    const allMatches: MatchInfo[] = [];
    
    // Collect all matches from all rounds
    bracketData.rounds.forEach((round, roundIdx) => {
      round.matches.forEach((match, matchIdx) => {
        let displayName = '';
        
        if (match.teams.length >= 2) {
          const team1 = match.teams[0];
          const team2 = match.teams[1];
          // Instead of using displayName property, use teamId and scores only
          displayName = `Team ${team1.teamId} ${team1.score || 0} vs ${team2.score || 0} Team ${team2.teamId}`;
        } else {
          displayName = `Match #${match.matchNumber} (Teams not set)`;
        }
        
        allMatches.push({
          matchId: match.matchId,
          roundIndex: roundIdx + 1,
          matchIndex: matchIdx + 1,
          displayName: displayName
        });
      });
    });
    
    console.log(`\nAll Matches (${allMatches.length}):`);
    
    // Prompt user to select a match
    const rl = createReadlineInterface();
    const matchIndex = await promptForSelection(
      rl,
      allMatches,
      'Enter the number of the match to view details',
      (match) => `${match.displayName} (Round ${match.roundIndex}, Match ${match.matchIndex})`
    );
    
    rl.close();
    
    if (matchIndex === null) {
      return null;
    }
    
    const selectedMatch = allMatches[matchIndex];
    console.log(`\nSelected match: ${selectedMatch.displayName}`);
    
    return selectedMatch.matchId;
    
  } catch (error) {
    console.error(`Error fetching bracket data: ${error}`);
    return null;
  }
}

/**
 * Step 4: Get and display match details
 * @param matchId - ID of the match to display
 */
async function displayMatchDetails(matchId: string): Promise<void> {
  const client = new PlayCEAClient();
  
  try {
    console.log(`\nFetching details for match ID: ${matchId}`);
    
    // Get the match details
    const matchData = await client.getMatch(matchId);
    
    // Display detailed match information
    console.log(`\n==== Match Details ====`);
    console.log(`Match ID: ${matchData.matchId}`);
    console.log(`Round ID: ${matchData.roundId}`);
    console.log(`Bracket ID: ${matchData.bracketId}`);
    console.log(`Match Number: ${matchData.matchNumber}`);
    console.log(`Created: ${new Date(matchData.createdTimestamp).toLocaleString()}`);
    console.log(`Last Updated: ${new Date(matchData.updatedTimestamp).toLocaleString()}`);
    console.log(`Status: ${matchData.complete ? 'Complete' : 'In Progress'}`);
    
    console.log(`\nTeams:`);
    matchData.teams.forEach((team, idx) => {
      // Instead of using displayName and organization properties, use teamId
      console.log(`  Team ${idx + 1} ID: ${team.teamId}`);
      console.log(`     Score: ${team.score || 0}`);
      if (team.rank) console.log(`     Rank: ${team.rank}`);
      if (team.position) console.log(`     Position: ${team.position}`);
    });
    
    console.log(`\nGames (${matchData.games.length}):`);
    matchData.games.forEach((game, idx) => {
      console.log(`  Game ${idx + 1} - ID: ${game.gameId}`);
      console.log(`     Format: ${game.format}v${game.format}`);
    });
    
  } catch (error) {
    console.error(`Error fetching match data: ${error}`);
  }
}

/**
 * Step 5: Get and display detailed team information for all teams in the match
 * @param matchId - ID of the match containing the teams to display
 */
async function displayTeamDetails(matchId: string): Promise<void> {
  const client = new PlayCEAClient();
  
  try {
    console.log(`\nFetching team information for match ID: ${matchId}`);
    
    // First get the match to obtain team IDs
    const matchData = await client.getMatch(matchId);
    
    if (matchData.teams.length === 0) {
      console.log('No teams found in this match.');
      return;
    }
    
    // For each team in the match, get and display detailed information
    for (let i = 0; i < matchData.teams.length; i++) {
      const teamId = matchData.teams[i].teamId;
      
      try {
        console.log(`\nFetching details for team ID: ${teamId}`);
        const teamData = await client.getTeam(teamId);
        
        // Display detailed team information
        console.log(`\n==== Team ${i + 1} Details ====`);
        console.log(`Team ID: ${teamData.teamId}`);
        console.log(`Name: ${teamData.displayName}`);
        console.log(`Organization: ${teamData.organization}`);
        console.log(`Game: ${teamData.game}`);
        console.log(`Created: ${new Date(teamData.createdTimestamp).toLocaleString()}`);
        console.log(`Last Updated: ${new Date(teamData.updatedTimestamp).toLocaleString()}`);
        
        // Display team members
        console.log(`\nMembers (${teamData.members.length}):`);
        teamData.members.forEach((member, idx) => {
          console.log(`  ${idx + 1}. ${member.displayName} (${member.displayDiscordName})`);
          console.log(`     User ID: ${member.uid}`);
          console.log(`     Captain: ${member.isCaptain ? 'Yes' : 'No'}`);
        });
        
        // Display associated tournaments
        console.log(`\nTournaments (${teamData.tournaments.length}):`);
        teamData.tournaments.forEach((tournament, idx) => {
          console.log(`  ${idx + 1}. Tournament ID: ${tournament.tournamentId}`);
        });
        
        if (teamData.joinCodes && teamData.joinCodes.length > 0) {
          console.log(`\nJoin Codes: ${teamData.joinCodes.join(', ')}`);
        }
        
      } catch (error) {
        console.error(`Error fetching team data for team ${teamId}: ${error}`);
        // Continue with the next team even if one team fails
        continue;
      }
    }
    
  } catch (error) {
    console.error(`Error fetching match data: ${error}`);
  }
}

/**
 * Main function to run the interactive tournament explorer
 * Uses sequential steps with early termination pattern
 */
async function exploreTournaments(): Promise<void> {
  console.log("PlayCEA Tournament Explorer\n");

  // Step 1: Select a tournament
  const tournament = await selectTournament();
  if (!tournament) return;
  
  // Step 2: Select a bracket from the tournament
  const bracketId = await selectBracket(tournament);
  if (!bracketId) return;
  
  // Step 3: Select a match from the bracket
  const matchId = await selectMatch(bracketId);
  if (!matchId) return;
  
  // Step 4: Display match details
  await displayMatchDetails(matchId);
  
  // Step 5: Display detailed team information for all teams in the match
  await displayTeamDetails(matchId);
}

// Run the explorer when this module is executed directly
exploreTournaments();