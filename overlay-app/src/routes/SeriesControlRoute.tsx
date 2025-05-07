import React, { memo } from 'react';
import { Match } from '../match';
import { Series, SeriesTeam } from '../types/series';
import { WsSubscribers } from '../wsSubscribers';
import '../css/SeriesControl.css';
import { Callback } from '../util/utils';
import { PlayCEAClient, Tournament, Bracket, Team } from 'playcea-api';

// Cache interface for storing API responses
interface ApiCache {
  tournaments: { [key: string]: Tournament[] };
  brackets: { [key: string]: Bracket };
  teams: { [key: string]: Team };
  matches: { [key: string]: any }; // Using any here for simplicity
}

// Define interfaces for modal state management
interface ModalState {
  isOpen: boolean;
  step: 'tournament' | 'bracket' | 'round' | 'match'; // Added 'round' step
  tournaments: Tournament[];
  selectedTournament: Tournament | null;
  brackets: { bracketId: string, name: string }[];
  selectedBracket: { bracketId: string, name: string } | null;
  bracketData: Bracket | null;
  rounds: { roundName: string, matches: any[] }[]; // Add rounds array
  selectedRound: string | null; // Add selected round
  matches: { matchId: string, teamNames: string[], roundName: string }[];
  loading: boolean;
  error: string | null;
}

interface SeriesControlRouteProps {
  match: Match;
  width: number;
  height: number;
}

interface SeriesControlRouteState {
  series: Series;
  dimensions: {
    width: number;
    height: number;
  };
  hasUnsavedChanges: boolean; // Add state to track unsaved changes
  matchId: string; // Add matchId to state
  modal: ModalState; // Add modal state
  cachedScaleFactor: number | null; // Add cached scale factor
  lastDimensions: { width: number; height: number } | null; // Track last dimensions for cache invalidation
}

// Team card props interface
interface TeamCardProps {
  team: SeriesTeam;
  teamIndex: 0 | 1;
  teamColor: string;
  maxAllowedWins: number;
  onUpdateTeam: (teamIndex: 0 | 1, field: keyof SeriesTeam, value: any) => void;
  defaultRgbColor: string;
}

// Memoized TeamCard component
const TeamCard = memo(({ team, teamIndex, teamColor, maxAllowedWins, onUpdateTeam, defaultRgbColor }: TeamCardProps) => {
  return (
    <div className="team-card" style={{ backgroundColor: `rgb(${team.color_primary || defaultRgbColor})` }} >
      <div className="team-header">
        <h2>{team.name}</h2>
      </div>
      
      <div className="team-content">
        {/* Left side - Logo */}
        <div className="team-logo-section">
          {team.logo ? (
            <img 
              src={team.logo} 
              alt={`${team.name} logo`} 
              className="team-logo" 
              aria-label={`Logo for ${team.name}`}
            />
          ) : (
            <div className="team-logo-placeholder" aria-label="No logo available">NO LOGO</div>
          )}
          
          {/* Team color input moved below logo */}
          <div className="team-color-input" style={{ marginTop: '30px', width: '100%' }}>
          <label htmlFor={`team-color-${teamIndex}`}>TEAM COLOR:</label>
            <input
              id={`team-color-${teamIndex}`}
              type="text"
              value={team.color_primary || defaultRgbColor}
              onChange={(e) => onUpdateTeam(teamIndex, 'color_primary', e.target.value)}
              className="team-input"
              aria-label={`Team color for ${team.name}`}
              placeholder="R, G, B"
            />
          </div>
        </div>
        
        {/* Right side - Team details */}
        <div className="team-details-section">
          <div className="team-form-group">
            <label htmlFor={`team-name-${teamIndex}`}>TEAM NAME:</label>
            <input
              id={`team-name-${teamIndex}`}
              type="text"
              value={team.name}
              onChange={(e) => onUpdateTeam(teamIndex, 'name', e.target.value)}
              className="team-input"
              aria-label={`Team name for ${teamIndex === 0 ? 'blue' : 'orange'} team`}
            />
          </div>
          
          <div className="team-form-group">
            <label htmlFor={`team-wins-${teamIndex}`}>MATCHES WON:</label>
            <div className="matches-control">
              <input
                id={`team-wins-${teamIndex}`}
                type="number"
                min={0}
                max={maxAllowedWins}
                value={team.matches_won}
                onChange={(e) => onUpdateTeam(teamIndex, 'matches_won', parseInt(e.target.value) || 0)}
                className="team-input"
                aria-label={`Match wins for ${team.name}`}
              />
              <div className="match-buttons">
                <button 
                  onClick={() => onUpdateTeam(teamIndex, 'matches_won', team.matches_won + 1)}
                  disabled={team.matches_won >= maxAllowedWins}
                  className="match-btn"
                  aria-label={`Increase ${team.name} wins by 1`}
                >
                  +1
                </button>
                <button 
                  onClick={() => onUpdateTeam(teamIndex, 'matches_won', Math.max(0, team.matches_won - 1))}
                  disabled={team.matches_won <= 0}
                  className="match-btn"
                  aria-label={`Decrease ${team.name} wins by 1`}
                >
                  -1
                </button>
              </div>
            </div>
          </div>
          
          <div className="team-form-group">
            <label htmlFor={`team-logo-${teamIndex}`}>LOGO URL:</label>
            <input
              id={`team-logo-${teamIndex}`}
              type="text"
              placeholder="Logo URL"
              value={team.logo || ""}
              onChange={(e) => onUpdateTeam(teamIndex, 'logo', e.target.value)}
              className="logo-input"
              aria-label={`Logo URL for ${team.name}`}
            />
          </div>
        </div>
      </div>
    </div>
  );
});

// Changed class name for default export
class SeriesControlRouteComponent extends React.Component<SeriesControlRouteProps, SeriesControlRouteState> {
  // Track unsubscribe functions for event listeners
  private unsubscribers: Callback[] = [];
  // Track if component is mounted to prevent setState after unmount
  private _isMounted: boolean = false;
  // Create an instance of the PlayCEA client
  private ceaClient = new PlayCEAClient();
  // Create API cache
  private apiCache: ApiCache = {
    tournaments: {},
    brackets: {},
    teams: {},
    matches: {}
  };
  
  // Add a debounce timer for resize events
  private resizeDebounceTimer: number | null = null;
  
  constructor(props: SeriesControlRouteProps) {
    super(props);
    
    this.state = {
      series: props.match.series,
      dimensions: {
        width: props.width,
        height: props.height
      },
      hasUnsavedChanges: false, // Initialize unsaved changes state
      matchId: '', // Initialize matchId
      // Initialize modal state
      modal: {
        isOpen: false,
        step: 'tournament',
        tournaments: [],
        selectedTournament: null,
        brackets: [],
        selectedBracket: null,
        bracketData: null,
        rounds: [], // Initialize rounds
        selectedRound: null, // Initialize selected round
        matches: [],
        loading: false,
        error: null
      },
      cachedScaleFactor: null, // Initialize cached scale factor
      lastDimensions: null // Initialize last dimensions
    };
  }

  componentDidMount() {
    console.log('SeriesControlRoute componentDidMount called');
    this._isMounted = true;
    this.subscribeToMatchEvents(this.props.match);
    
    // Handle window resize with debounce
    window.addEventListener('resize', this.debouncedHandleResize);
    
    // Set initial dimensions
    this.handleResize();

    // Pre-load tournaments in the background
    this.preloadTournaments();
  }
  
  // Pre-load tournaments to cache them for later use
  preloadTournaments = async () => {
    try {
      console.log('Preloading tournaments at startup...');
      // Get the current year
      const currentYear = new Date().getFullYear().toString();
      
      // Search for current Rocket League tournaments using cached method
      const tournaments = await this.cachedSearchTournaments(
        /Rocket/i, 
        { year: currentYear },
        "Rocket League"
      );

      // Filter to only include current and live tournaments
      const liveCurrentTournaments = tournaments.filter(t => t.isLive && t.isCurrent);
      
      this.safeSetState({
        modal: {
          ...this.state.modal,
          tournaments: liveCurrentTournaments
        }
      });
      console.log(`Cached ${liveCurrentTournaments.length} tournaments for later use`);
    } catch (error) {
      console.error('Error preloading tournaments:', error);
      // Don't update state if preloading fails, we'll try again when modal opens
    }
  };

  // Implement debounced resize handler to prevent excessive calculations
  debouncedHandleResize = () => {
    if (this.resizeDebounceTimer !== null) {
      window.clearTimeout(this.resizeDebounceTimer);
    }
    
    // Set a 150ms debounce to avoid multiple rapid calculations
    this.resizeDebounceTimer = window.setTimeout(() => {
      this.handleResize();
      this.resizeDebounceTimer = null;
    }, 150);
  }

  componentDidUpdate(prevProps: SeriesControlRouteProps) {
    console.log('SeriesControlRoute componentDidUpdate called');
    
    // Check if match reference has changed
    const matchChanged = prevProps.match !== this.props.match;
    
    // Compare series data field by field to detect changes
    const prevSeries = prevProps.match.series;
    const currentSeries = this.props.match.series;
    
    // Check if series data has changed
    const seriesTextChanged = prevSeries.series_txt !== currentSeries.series_txt;
    const seriesLengthChanged = prevSeries.length !== currentSeries.length;
    
    // Check if team data has changed
    const team0NameChanged = prevSeries.teams[0].name !== currentSeries.teams[0].name;
    const team0WinsChanged = prevSeries.teams[0].matches_won !== currentSeries.teams[0].matches_won;
    const team0LogoChanged = prevSeries.teams[0].logo !== currentSeries.teams[0].logo;
    
    const team1NameChanged = prevSeries.teams[1].name !== currentSeries.teams[1].name;
    const team1WinsChanged = prevSeries.teams[1].matches_won !== currentSeries.teams[1].matches_won;
    const team1LogoChanged = prevSeries.teams[1].logo !== currentSeries.teams[1].logo;
    
    const seriesDataChanged = seriesTextChanged || seriesLengthChanged || 
                            team0NameChanged || team0WinsChanged || team0LogoChanged ||
                            team1NameChanged || team1WinsChanged || team1LogoChanged;
    
    // If match reference changed or series data changed
    if (matchChanged || seriesDataChanged) {
      console.log('Match or series data changed, updating state');
      
      if (matchChanged) {
        // Unsubscribe from old match events and subscribe to new ones
        this.unsubscribeFromMatchEvents();
        this.subscribeToMatchEvents(this.props.match);
      }
      
      // Update series data and reset unsaved changes flag
      this.safeSetState({
        series: {...this.props.match.series},
        hasUnsavedChanges: false // Reset flag when props update series
      });
    } else {
      console.log('No changes detected, not updating state');
    }
  }
  
  componentWillUnmount() {
    this._isMounted = false;
    // Clean up event listeners
    this.unsubscribeFromMatchEvents();
    window.removeEventListener('resize', this.debouncedHandleResize);
  }
  
  // Helper method to subscribe to match events
  subscribeToMatchEvents = (match: Match) => {
    this.unsubscribers = [
        match.OnMatchCreated(() => {
            console.log('Match created, updating series state');
            console.log('Incoming series state:', match.series);
            this.safeSetState({ 
                series: {...match.series},
                hasUnsavedChanges: false // Reset flag on match creation
            });
      }),
      match.OnGameEnded(() => {
        console.log('Game ended, updating series state');
        console.log('Incoming series state:', match.series);
        
        this.safeSetState({ 
            series: {...match.series},
            hasUnsavedChanges: false // Reset flag on game end
        });
      }),
    ];
  }
  
  // Helper method to unsubscribe from match events
  unsubscribeFromMatchEvents = () => {
    this.unsubscribers.forEach((unsubscribe) => unsubscribe(this.props.match));
    this.unsubscribers = [];
  }
  
  // Safe setState that checks if component is still mounted
  safeSetState = (state: Partial<SeriesControlRouteState>, callback?: () => void) => {
    if (this._isMounted) {
      this.setState(state as any, callback);
    }
  }
  
  handleResize = () => {
    this.safeSetState({
      dimensions: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    });
  }
  
  // Calculate scale factor based on screen size
  getScaleFactor = () => {
    const { dimensions, cachedScaleFactor, lastDimensions } = this.state;

    // Check if we have a cached scale factor and if dimensions haven't changed
    if (cachedScaleFactor !== null && lastDimensions && 
        lastDimensions.width === dimensions.width && 
        lastDimensions.height === dimensions.height) {
      return cachedScaleFactor;
    }

    // Base design size
    const baseWidth = 1200;
    const baseHeight = 800;

    const widthRatio = dimensions.width / baseWidth;
    const heightRatio = dimensions.height / baseHeight;

    // Use the smaller ratio to ensure content fits on screen
    let scaleFactor = Math.min(widthRatio, heightRatio, 1.5); // Cap at 1.5x to prevent excessive scaling
    scaleFactor = scaleFactor * 0.95; // Reduce scale factor by 10% for better fit

    // Cache the calculated scale factor and dimensions
    this.setState({
      cachedScaleFactor: scaleFactor,
      lastDimensions: { ...dimensions }
    });

    return scaleFactor;
  }

  // Ensure series length is always odd (1, 3, 5, 7, 9)
  ensureOddNumber = (value: number): number => {
    if (value % 2 === 0) {
      return value + 1; // Make it odd
    }
    return value;
  }

  // Update the series length
  handleSeriesLengthChange = (value: number) => {
    const oddValue = this.ensureOddNumber(value);
    if (oddValue >= 1 && oddValue <= 9 && oddValue !== this.state.series.length) { // Check if value actually changed
      // Create a new series object with updated length
      const updatedSeries = {
        ...this.state.series,
        length: oddValue
      };
      
      // Update state with the new object and mark changes as unsaved
      this.safeSetState({ series: updatedSeries, hasUnsavedChanges: true });
    }
  }

  // Update series text
  handleSeriesTextChange = (value: string) => {
    if (value !== this.state.series.series_txt) { // Check if value actually changed
        console.log('Updating series text:', value);
        // Create a new series object with updated text
        const updatedSeries = {
          ...this.state.series,
          series_txt: value
        };
        
        // Update state with the new object and mark changes as unsaved
        this.safeSetState({ series: updatedSeries, hasUnsavedChanges: true });
    }
  }

    // Swap team positions
    swapTeamNamesAndLogo = () => {
        console.log('Swapping teams...');
        
        // Get current teams
        const team0 = this.state.series.teams[0];
        const team1 = this.state.series.teams[1];
        
        // Create new team objects with swapped positions
        const newTeam0: SeriesTeam = {
            team: team0.team,
            name: team1.name,
            matches_won: team0.matches_won,
            logo: team1.logo
        };
        
        const newTeam1: SeriesTeam = {
            team: team1.team,
            name: team0.name,
            matches_won: team1.matches_won,
            logo: team0.logo
        };
        
        // Create new teams array with swapped teams
        const updatedTeams: [SeriesTeam, SeriesTeam] = [newTeam0, newTeam1];
        
        // Create a new series object with swapped teams
        const updatedSeries = {
            ...this.state.series,
            teams: updatedTeams
        };
        
        // Update state with the new object and mark changes as unsaved
        this.safeSetState({ series: updatedSeries, hasUnsavedChanges: true });
    }

  // Update team information
  updateTeam = (teamIndex: 0 | 1, field: keyof SeriesTeam, value: any) => {
    const currentTeam = this.state.series.teams[teamIndex];
    
    // Check if the value actually changed
    if (currentTeam[field] === value) {
        return; // No change, do nothing
    }

    console.log(`Updating team ${teamIndex} field ${field} with value:`, value);
    const updatedTeams = [...this.state.series.teams];
    
    // Special handling for matches_won to ensure total doesn't exceed series length
    if (field === 'matches_won') {
      const otherTeamIndex = teamIndex === 0 ? 1 : 0;
      const otherTeamWins = updatedTeams[otherTeamIndex].matches_won;
      
      // Ensure the value is a number and not negative
      let newValue = typeof value === 'number' ? value : parseInt(value) || 0;
      newValue = Math.max(0, newValue);
      
      // Maximum wins is half the series length rounded up
      const maxWinsForSingleTeam = Math.ceil(this.state.series.length / 2);
      
      // Also ensure the total doesn't exceed series length
      const maxAllowedBasedOnOtherTeam = this.state.series.length - otherTeamWins;
      
      // Use the smaller of the two constraints
      const maxAllowedWins = Math.min(maxWinsForSingleTeam, maxAllowedBasedOnOtherTeam);
      
      // Limit the value to not exceed maximum allowed wins
      value = Math.min(newValue, maxAllowedWins);
    }
    
    // Create new team object with updated field
    updatedTeams[teamIndex] = {
      ...updatedTeams[teamIndex],
      [field]: value
    };

    // Create new series object with updated teams
    const updatedSeries = {
      ...this.state.series,
      teams: updatedTeams as [SeriesTeam, SeriesTeam]
    };
    
    // Update state with the new object and mark changes as unsaved
    this.safeSetState({ series: updatedSeries, hasUnsavedChanges: true });
  }

  renderTeamCard = (teamIndex: 0 | 1) => {
    console.log(`Rendering team card for team ${teamIndex}`);
    const team = this.state.series.teams[teamIndex];
    const teamColor = teamIndex === 0 ? "rgba(12,125,255, 1)" : "rgba(255, 125, 20,1)";
    const otherTeamIndex = teamIndex === 0 ? 1 : 0;
    const otherTeamWins = this.state.series.teams[otherTeamIndex].matches_won;

    // Default RGB values from CSS
    const defaultRgbColor = teamIndex === 0 ? "12,125,255" : "255, 125, 20";

    // Maximum wins is half the series length rounded up
    const maxWinsForSingleTeam = Math.ceil(this.state.series.length / 2);
    
    // Also ensure the total doesn't exceed series length
    const maxAllowedBasedOnOtherTeam = this.state.series.length - otherTeamWins;
    
    // Use the smaller of the two constraints
    const maxAllowedWins = Math.min(maxWinsForSingleTeam, maxAllowedBasedOnOtherTeam);

    return (
      <TeamCard
        team={team}
        teamIndex={teamIndex}
        teamColor={teamColor}
        maxAllowedWins={maxAllowedWins}
        onUpdateTeam={this.updateTeam}
        defaultRgbColor={defaultRgbColor}
      />
    );
  }

  // New methods for CEA match modal functionality
  openCEAModal = async () => {
    // Set the modal to open state
    this.safeSetState({
      modal: {
        ...this.state.modal,
        isOpen: true,
        // Don't set loading to true if we already have cached tournaments
        loading: this.state.modal.tournaments.length === 0,
        error: null
      }
    });

    // If we already have tournaments cached, we don't need to fetch them again
    if (this.state.modal.tournaments.length > 0) {
      console.log(`Using ${this.state.modal.tournaments.length} cached tournaments`);
      return;
    }

    try {
      console.log('No cached tournaments found. Fetching tournaments...');
      // Get the current year
      const currentYear = new Date().getFullYear().toString();
      
      // Search for current Rocket League tournaments using cached method
      const tournaments = await this.cachedSearchTournaments(
        /Rocket/i, 
        { year: currentYear },
        "Rocket League"
      );

      // Filter to only include current and live tournaments
      const liveCurrentTournaments = tournaments.filter(t => t.isLive && t.isCurrent);
      
      this.safeSetState({
        modal: {
          ...this.state.modal,
          tournaments: liveCurrentTournaments,
          loading: false
        }
      });
    } catch (error) {
      console.error('Error loading tournaments:', error);
      this.safeSetState({
        modal: {
          ...this.state.modal,
          loading: false,
          error: 'Failed to load tournaments. Please try again.'
        }
      });
    }
  };

  // Handle tournament selection
  selectTournament = (tournament: Tournament) => {
    this.safeSetState({
      modal: {
        ...this.state.modal,
        selectedTournament: tournament,
        brackets: tournament.brackets,
        step: 'bracket',
        error: null
      }
    });
  };

  // Handle bracket selection and load bracket data
  selectBracket = async (bracket: { bracketId: string, name: string }) => {
    this.safeSetState({
      modal: {
        ...this.state.modal,
        selectedBracket: bracket,
        loading: true,
        error: null
      }
    });

    try {
      // Load the bracket data to get rounds and matches
      const bracketData = await this.cachedGetBracket(bracket.bracketId);
      
      // Extract unique rounds and organize them
      const roundsMap: { [key: string]: any[] } = {};
      
      // Process each round in the bracket
      for (const round of bracketData.rounds) {
        if (round.matches && round.matches.length > 0) {
          // Initialize round in map if it doesn't exist
          if (!roundsMap[round.roundName]) {
            roundsMap[round.roundName] = [];
          }
          
          // Add matches to this round
          roundsMap[round.roundName].push(...round.matches);
        }
      }
      
      // Convert map to array for state
      const roundsArray = Object.keys(roundsMap).map(roundName => ({
        roundName,
        matches: roundsMap[roundName]
      }));

      this.safeSetState({
        modal: {
          ...this.state.modal,
          bracketData: bracketData,
          rounds: roundsArray,
          step: 'round', // Move to round selection step instead of directly to match
          loading: false
        }
      });
    } catch (error) {
      console.error('Error loading bracket data:', error);
      this.safeSetState({
        modal: {
          ...this.state.modal,
          loading: false,
          error: 'Failed to load bracket data. Please try again.'
        }
      });
    }
  };

  // Handle round selection and load matches
  selectRound = async (roundName: string) => {
    this.safeSetState({
      modal: {
        ...this.state.modal,
        selectedRound: roundName,
        loading: true,
        error: null
      }
    });

    try {
      const matchesForRound: { matchId: string, teamNames: string[], roundName: string }[] = [];
      
      // Find the selected round in our rounds array
      const selectedRound = this.state.modal.rounds.find(r => r.roundName === roundName);
      
      if (!selectedRound) {
        throw new Error('Selected round not found');
      }
      
      // Process matches for this round
      for (const match of selectedRound.matches) {
        // Only include matches with 2 teams (standard match)
        if (match.teams && match.teams.length === 2) {
          // Fetch team names synchronously
          const teamNames = [];
          for (const team of match.teams) {
            try {
              const teamData = await this.cachedGetTeam(team.teamId);
              teamNames.push(teamData.displayName || 'Unknown Team');
            } catch (e) {
              console.error(`Failed to fetch team ${team.teamId}:`, e);
              teamNames.push('Team Data Error');
            }
          }
          
          matchesForRound.push({
            matchId: match.matchId,
            teamNames: teamNames,
            roundName: roundName
          });
        }
      }

      this.safeSetState({
        modal: {
          ...this.state.modal,
          matches: matchesForRound,
          step: 'match',
          loading: false
        }
      });
    } catch (error) {
      console.error('Error processing round data:', error);
      this.safeSetState({
        modal: {
          ...this.state.modal,
          loading: false,
          error: 'Failed to load matches for this round. Please try again.'
        }
      });
    }
  };

  // Handle match selection
  selectMatch = async (matchId: string, roundName: string) => {
    this.safeSetState({
      modal: {
        ...this.state.modal,
        loading: true,
        error: null
      }
    });

    try {
      // Get the match data to find team IDs using cached method
      const matchData = await this.cachedGetMatch(matchId);
      
      if (matchData.teams.length !== 2) {
        throw new Error('Expected 2 teams in the match');
      }

      // Get detailed team info for both teams using cached methods
      const team1Data = await this.cachedGetTeam(matchData.teams[0].teamId);
      const team2Data = await this.cachedGetTeam(matchData.teams[1].teamId);

      // Determine series length from number of games in the match
      // CEA matches have a 'games' array that indicates the total number of games in the match
      let seriesLength = this.state.series.length; // Default to current length
      
      if (matchData.games && Array.isArray(matchData.games)) {
        // Set the series length to the number of games in the match
        // Ensure it's an odd number for Best-of-X format (e.g., Bo3, Bo5, Bo7)
        seriesLength = matchData.games.length;
        if (seriesLength % 2 === 0) {
          // If even, make it odd by adding 1
          seriesLength += 1;
        }
        // Limit to reasonable range (1-9)
        seriesLength = Math.max(1, Math.min(9, seriesLength));
        
        console.log(`Setting series length to ${seriesLength} based on ${matchData.games.length} games in the match`);
      }

      // Update the series with team names, logos, round name, and series length
      const updatedSeries = {
        ...this.state.series,
        series_txt: roundName, // Set series text to round name
        length: seriesLength, // Set series length based on match games
        teams: [
          {
            ...this.state.series.teams[0],
            name: team1Data.displayName,
            logo: team1Data.iconUrl || ''
          },
          {
            ...this.state.series.teams[1],
            name: team2Data.displayName, 
            logo: team2Data.iconUrl || ''
          }
        ] as [SeriesTeam, SeriesTeam]
      };

      // Close modal and update series with new team data
      this.safeSetState({
        series: updatedSeries,
        hasUnsavedChanges: true,
        matchId: matchId,
        modal: {
          ...this.state.modal,
          isOpen: false,
          loading: false
        }
      });

    } catch (error) {
      console.error('Error loading team data:', error);
      this.safeSetState({
        modal: {
          ...this.state.modal,
          loading: false,
          error: 'Failed to load team data. Please try again.'
        }
      });
    }
  };

  // Close the modal
  closeModal = () => {
    this.safeSetState({
      modal: {
        ...this.state.modal,
        isOpen: false,
        step: 'tournament',
        selectedTournament: null,
        selectedBracket: null,
        bracketData: null,
        selectedRound: null, // Reset selected round
        error: null
      }
    });
  };

  // Render the modal based on current step
  renderModal = () => {
    if (!this.state.modal.isOpen) return null;

    const { step, tournaments, brackets, rounds, matches, loading, error } = this.state.modal;

    const modalStyle = {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    } as React.CSSProperties;

    const modalContentStyle = {
      width: '80%',
      maxWidth: '800px',
      maxHeight: '80vh',
      backgroundColor: '#2c2c2c',
      borderRadius: '8px',
      padding: '20px',
      overflowY: 'auto' as 'auto'
    };

    const headerStyle = {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: '20px',
      borderBottom: '1px solid #555'
    };

    const buttonStyle = {
      padding: '8px 16px',
      margin: '5px',
      borderRadius: '4px',
      border: 'none',
      backgroundColor: '#4a90e2',
      color: 'white',
      cursor: 'pointer'
    };

    const listItemStyle = {
      padding: '12px 15px',
      margin: '5px 0',
      backgroundColor: '#3a3a3a',
      borderRadius: '4px',
      cursor: 'pointer',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    };

    const getStepTitle = () => {
      switch (step) {
        case 'tournament': return 'Select Tournament';
        case 'bracket': return 'Select Bracket';
        case 'round': return 'Select Round';
        case 'match': return 'Select Match';
        default: return 'CEA Match Selector';
      }
    };

    return (
      <div style={modalStyle}>
        <div style={modalContentStyle}>
          <div style={headerStyle}>
            <h2>{getStepTitle()}</h2>
            <button onClick={this.closeModal} style={{ ...buttonStyle, backgroundColor: '#e74c3c' }}>Close</button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <p>Loading...</p>
            </div>
          ) : error ? (
            <div style={{ color: '#e74c3c', padding: '10px', textAlign: 'center' }}>
              <p>{error}</p>
              <button onClick={this.closeModal} style={buttonStyle}>OK</button>
            </div>
          ) : (
            <div>
              {step === 'tournament' && (
                <div>
                  <p>Select a tournament from the list below:</p>
                  {tournaments.length === 0 ? (
                    <p>No current Rocket League tournaments found.</p>
                  ) : (
                    <div>
                      {tournaments.map((tournament, index) => (
                        <div 
                          key={tournament.id}
                          style={listItemStyle}
                          onClick={() => this.selectTournament(tournament)}
                        >
                          <span>{tournament.name}</span>
                          <span>{tournament.seasonInfo.league} {tournament.seasonInfo.season} {tournament.seasonInfo.year}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {step === 'bracket' && (
                <div>
                  <p>Select a bracket stage:</p>
                  {brackets.length === 0 ? (
                    <p>No brackets found for this tournament.</p>
                  ) : (
                    <div>
                      {brackets.map((bracket, index) => (
                        <div 
                          key={bracket.bracketId}
                          style={listItemStyle}
                          onClick={() => this.selectBracket(bracket)}
                        >
                          {bracket.name}
                        </div>
                      ))}
                    </div>
                  )}
                  <button 
                    onClick={() => this.safeSetState({ 
                      modal: { ...this.state.modal, step: 'tournament', selectedTournament: null } 
                    })}
                    style={{ ...buttonStyle, backgroundColor: '#95a5a6' }}
                  >
                    Back
                  </button>
                </div>
              )}

              {step === 'round' && (
                <div>
                  <p>Select a round:</p>
                  {rounds.length === 0 ? (
                    <p>No rounds found in this bracket.</p>
                  ) : (
                    <div>
                      {rounds.map((round, index) => (
                        <div 
                          key={round.roundName}
                          style={listItemStyle}
                          onClick={() => this.selectRound(round.roundName)}
                        >
                          {round.roundName}
                        </div>
                      ))}
                    </div>
                  )}
                  <button 
                    onClick={() => this.safeSetState({ 
                      modal: { 
                        ...this.state.modal, 
                        step: 'bracket',
                        selectedBracket: null,
                        bracketData: null,
                        rounds: []
                      } 
                    })}
                    style={{ ...buttonStyle, backgroundColor: '#95a5a6' }}
                  >
                    Back
                  </button>
                </div>
              )}

              {step === 'match' && (
                <div>
                  <p>Select a match:</p>
                  {matches.length === 0 ? (
                    <p>No matches found in this round.</p>
                  ) : (
                    <div>
                      {matches.map((match) => (
                        <div 
                          key={match.matchId}
                          style={listItemStyle}
                          onClick={() => this.selectMatch(match.matchId, match.roundName)}
                        >
                          <span>{match.teamNames[0]} vs {match.teamNames[1]}</span>
                          <span>{match.roundName}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <button 
                    onClick={() => this.safeSetState({ 
                      modal: { 
                        ...this.state.modal, 
                        step: 'round',
                        selectedRound: null,
                        matches: [] 
                      } 
                    })}
                    style={{ ...buttonStyle, backgroundColor: '#95a5a6' }}
                  >
                    Back
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Cache-enabled API methods
  cachedSearchTournaments = async (
    tournamentName?: RegExp, 
    seasonInfo?: Partial<any>, 
    gameName?: string
  ): Promise<Tournament[]> => {
    // Create a cache key based on the parameters
    const yearStr = seasonInfo?.year || '';
    const leagueStr = seasonInfo?.league || '';
    const seasonStr = seasonInfo?.season || '';
    const gameStr = gameName || '';
    const regexStr = tournamentName ? tournamentName.toString() : '';
    const cacheKey = `search:${regexStr}:${yearStr}:${leagueStr}:${seasonStr}:${gameStr}`;
    
    // Check if we have cached results for this query
    if (this.apiCache.tournaments[cacheKey]) {
      console.log(`Using cached tournaments for key: ${cacheKey}`);
      return this.apiCache.tournaments[cacheKey];
    }
    
    // If not in cache, make the API call
    console.log(`Fetching tournaments for key: ${cacheKey}`);
    const tournaments = await this.ceaClient.searchTournaments(tournamentName, seasonInfo, gameName);
    
    // Cache the results
    this.apiCache.tournaments[cacheKey] = tournaments;
    
    return tournaments;
  };
  
  cachedGetBracket = async (bracketId: string): Promise<Bracket> => {
    // Check if we have cached results
    if (this.apiCache.brackets[bracketId]) {
      console.log(`Using cached bracket data for ID: ${bracketId}`);
      return this.apiCache.brackets[bracketId];
    }
    
    // If not in cache, make the API call
    console.log(`Fetching bracket data for ID: ${bracketId}`);
    const bracketData = await this.ceaClient.getBracket(bracketId);
    
    // Cache the results
    this.apiCache.brackets[bracketId] = bracketData;
    
    return bracketData;
  };
  
  cachedGetMatch = async (matchId: string): Promise<any> => {
    // Check if we have cached results
    if (this.apiCache.matches[matchId]) {
      console.log(`Using cached match data for ID: ${matchId}`);
      return this.apiCache.matches[matchId];
    }
    
    // If not in cache, make the API call
    console.log(`Fetching match data for ID: ${matchId}`);
    const matchData = await this.ceaClient.getMatch(matchId);
    
    // Cache the results
    this.apiCache.matches[matchId] = matchData;
    
    return matchData;
  };
  
  cachedGetTeam = async (teamId: string): Promise<Team> => {
    // Check if we have cached results
    if (this.apiCache.teams[teamId]) {
      console.log(`Using cached team data for ID: ${teamId}`);
      return this.apiCache.teams[teamId];
    }
    
    // If not in cache, make the API call
    console.log(`Fetching team data for ID: ${teamId}`);
    const teamData = await this.ceaClient.getTeam(teamId);
    
    // Cache the results
    this.apiCache.teams[teamId] = teamData;
    
    return teamData;
  };

  render() {
    console.log('Rendering SeriesControlRoute with series:', this.state.series);
    const containerStyle = {
      transform: `scale(${this.getScaleFactor()})`,
      transformOrigin: 'top center',
      height: `${this.state.dimensions.height / this.getScaleFactor()}px`
    };
    
    // Determine button class based on unsaved changes
    const updateButtonClass = `update-btn ${this.state.hasUnsavedChanges ? 'update-btn-pending' : ''}`;

    return (
      <div className="series-control-wrapper">
        <div className="series-control-container" style={containerStyle}>
          <div className="series-header">
            <h1>SERIES CONTROL ROOM</h1>
            <div className="series-header-buttons">
              <button
                onClick={this.openCEAModal}
                className="swap-btn"
              >
                CEA Match
              </button>
              <button 
                onClick={this.swapTeamNamesAndLogo}
                className="swap-btn"
              >
                Swap Teams
              </button>
              <button 
                onClick={() => {
                  // Create a fresh copy to ensure we're sending the latest state
                  const currentSeries = {...this.state.series};
                  console.log('Updating series:', currentSeries);
                  try {
                    WsSubscribers.send('local', 'series_update', currentSeries);
                    // Reset unsaved changes flag after successful send
                    this.safeSetState({ hasUnsavedChanges: false }); 
                  } catch (error) {
                    console.error('Error sending series update:', error);
                  }
                }}
                className={updateButtonClass} // Use dynamic class
                disabled={!this.state.hasUnsavedChanges} // Disable if no unsaved changes
              >
                Update Series
              </button>
            </div>
          </div>

          <div className="series-settings">
            <div className="setting-group">
              <label htmlFor="series-text">SERIES TEXT:</label>
              <input
                id="series-text"
                type="text"
                value={this.state.series.series_txt}
                onChange={(e) => this.handleSeriesTextChange(e.target.value)}
                className="series-input"
              />
            </div>

            <div className="setting-group">
              <label htmlFor="series-length">SERIES LENGTH:</label>
              <div className="length-control">
                <button 
                  onClick={() => this.handleSeriesLengthChange(this.state.series.length - 2)}
                  disabled={this.state.series.length <= 1}
                  className="length-btn"
                >
                  -2
                </button>
                <input
                  id="series-length"
                  type="text"
                  min="1"
                  max="9"
                  step="2"
                  value={this.state.series.length}
                  onChange={(e) => this.handleSeriesLengthChange(parseInt(e.target.value) || 1)}
                  className="length-input"
                />
                <button 
                  onClick={() => this.handleSeriesLengthChange(this.state.series.length + 2)}
                  disabled={this.state.series.length >= 9}
                  className="length-btn"
                >
                  +2
                </button>
              </div>
            </div>
          </div>

          <div className="teams-container">
            {this.renderTeamCard(0)}
            <div className="vs-divider">VS</div>
            {this.renderTeamCard(1)}
          </div>
        </div>
        {/* Render the modal outside the main container to avoid scaling issues */}
        {this.renderModal()}
      </div>
    );
  }
}

// Add default export for lazy loading
export default SeriesControlRouteComponent;
// Keep named export for backward compatibility
export { SeriesControlRouteComponent as SeriesControlRoute };