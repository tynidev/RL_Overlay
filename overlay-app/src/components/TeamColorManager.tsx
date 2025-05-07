import { useEffect } from 'react';
import { Match } from '../match';

interface TeamColorManagerProps {
  match: Match;
}

/**
 * Component responsible for syncing team colors with CSS variables
 * This component doesn't render anything, it just manages the CSS variables
 */
const TeamColorManager = ({ match }: TeamColorManagerProps) => {
  useEffect(() => {
    // Set initial colors
    const blueColor = match.series.teams[0].color_primary;
    const orangeColor = match.series.teams[1].color_primary;

    if (blueColor) {
      document.documentElement.style.setProperty('--blue', blueColor);
    }
    
    if (orangeColor) {
      document.documentElement.style.setProperty('--orange', orangeColor);
    }

    // Subscribe to series updates
    const unsubscribe = match.OnSeriesUpdate((series) => {
      // Update colors when series changes
      if (series.teams[0].color_primary) {
        document.documentElement.style.setProperty('--blue', series.teams[0].color_primary);
      }
      
      if (series.teams[1].color_primary) {
        document.documentElement.style.setProperty('--orange', series.teams[1].color_primary);
      }
    });

    // Clean up subscription
    return () => {
      unsubscribe(match);
    };
  }, [match]);

  // This component doesn't render anything
  return null;
};

export default TeamColorManager;