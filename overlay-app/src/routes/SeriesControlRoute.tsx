import React from 'react';
import { Match } from '../match';
import { Series, SeriesTeam } from '../types/series';
import { WsSubscribers } from '../wsSubscribers';
import '../css/SeriesControl.css';
import { Callback } from '../util/utils';

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
}

export class SeriesControlRoute extends React.Component<SeriesControlRouteProps, SeriesControlRouteState> {
  // Track unsubscribe functions for event listeners
  private unsubscribers: Callback[] = [];
  // Track if component is mounted to prevent setState after unmount
  private _isMounted: boolean = false;
  
  constructor(props: SeriesControlRouteProps) {
    super(props);
    
    this.state = {
      series: props.match.series,
      dimensions: {
        width: props.width,
        height: props.height
      },
      hasUnsavedChanges: false // Initialize unsaved changes state
    };
  }

  componentDidMount() {
    console.log('SeriesControlRoute componentDidMount called');
    this._isMounted = true;
    this.subscribeToMatchEvents(this.props.match);
    
    // Handle window resize
    window.addEventListener('resize', this.handleResize);
    
    // Set initial dimensions
    this.handleResize();
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
    window.removeEventListener('resize', this.handleResize);
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
    // Base design size
    const baseWidth = 1200;
    const baseHeight = 800;

    const widthRatio = this.state.dimensions.width / baseWidth;
    const heightRatio = this.state.dimensions.height / baseHeight;

    // Use the smaller ratio to ensure content fits on screen
    return Math.min(widthRatio, heightRatio, 1.5); // Cap at 1.5x to prevent excessive scaling
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
    const teamColor = teamIndex === 0 ? "rgba(7, 121, 211, 0.8)" : "rgba(242, 96, 29, 0.8)";
    const otherTeamIndex = teamIndex === 0 ? 1 : 0;
    const otherTeamWins = this.state.series.teams[otherTeamIndex].matches_won;

    // Maximum wins is half the series length rounded up
    const maxWinsForSingleTeam = Math.ceil(this.state.series.length / 2);
    
    // Also ensure the total doesn't exceed series length
    const maxAllowedBasedOnOtherTeam = this.state.series.length - otherTeamWins;
    
    // Use the smaller of the two constraints
    const maxAllowedWins = Math.min(maxWinsForSingleTeam, maxAllowedBasedOnOtherTeam);

    return (
      <div className="team-card" style={{ backgroundColor: teamColor }} >
        <div className="team-header">
          <h2>{team.name}</h2>
        </div>
        <div className="team-form-group">
          <label>TEAM NAME:</label>
          <input
            type="text"
            value={team.name}
            onChange={(e) => this.updateTeam(teamIndex, 'name', e.target.value)}
            className="team-input"
          />
        </div>
        <div className="team-form-group">
          <label>MATCHES WON:</label>
          <div className="matches-control">
            <input
              type="number"
              min="0"
              max={maxAllowedWins}
              value={team.matches_won}
              onChange={(e) => this.updateTeam(teamIndex, 'matches_won', parseInt(e.target.value) || 0)}
              className="team-input"
            />
            <div className="match-buttons">
              <button 
                onClick={() => this.updateTeam(teamIndex, 'matches_won', team.matches_won + 1)}
                disabled={team.matches_won >= maxAllowedWins}
                className="match-btn"
              >
                +1
              </button>
              <button 
                onClick={() => this.updateTeam(teamIndex, 'matches_won', Math.max(0, team.matches_won - 1))}
                disabled={team.matches_won <= 0}
                className="match-btn"
              >
                -1
              </button>
            </div>
          </div>
        </div>
        <div className="team-logo-container">
          <label>LOGO URL:</label>
          <input
            type="text"
            placeholder="Logo URL"
            value={team.logo || ""}
            onChange={(e) => this.updateTeam(teamIndex, 'logo', e.target.value)}
            className="logo-input"
          />
          {team.logo ? (
            <img 
              src={team.logo} 
              alt={`${team.name} logo`} 
              className="team-logo" 
            />
          ) : (
            <div className="team-logo-placeholder">NO LOGO</div>
          )}
        </div>
      </div>
    );
  }

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
      </div>
    );
  }
}