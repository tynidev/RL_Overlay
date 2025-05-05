import '../css/MiniMap.css';
import React, { FC } from 'react';
import { Match } from '../match';
import { Player, PlayerLocation } from '../types/player';
import { Point } from '../types/point';
import { MiniMapBackground } from './MiniMapBackground';

const getLocation = (point: Point): Point => ({
  X: point.X + 4096,
  Y: point.Y + 6000,
});

const areLocationsEqual = (loc1: Point, loc2: Point): boolean =>
  loc1.X === loc2.X && loc1.Y === loc2.Y;

const areTeamsEqual = (
  oldLeft: Player[],
  oldRight: Player[],
  newLeft: Player[],
  newRight: Player[]
) => {
  if (
    oldLeft.length !== newLeft.length ||
    oldRight.length !== newRight.length
  ) {
    return false;
  }

  for (let i = 0; i < oldLeft.length; i++) {
    if (!areLocationsEqual(oldLeft[i].location, newLeft[i].location)) {
      return false;
    }
  }

  for (let i = 0; i < oldRight.length; i++) {
    if (!areLocationsEqual(oldRight[i].location, newRight[i].location)) {
      return false;
    }
  }

  return true;
};

// Safe accessor for location data to prevent undefined errors
const getSafeLocation = (location: Point | undefined): Point => {
  // If location is undefined or missing X/Y properties, return default values
  if (!location || typeof location.X !== 'number' || typeof location.Y !== 'number') {
    return { X: 0, Y: 0 };
  }
  return location;
};

// Safe accessor for location data to prevent undefined errors
const getSafePlayerLocation = (location: PlayerLocation | undefined): PlayerLocation => {
  // If location is undefined or missing X/Y properties, return default values
  if (!location || typeof location.X !== 'number' || typeof location.Y !== 'number' || typeof location.Z !== 'number' || typeof location.pitch !== 'number' || typeof location.roll !== 'number' || typeof location.yaw !== 'number') {
    return { X: 0, Y: 0 , Z: 0, pitch: 0, roll: 0, yaw: 0 };
  }
  return location;
};

export const getState = (match: Match) => {
  // Safely get ball location with fallback to default values
  const ballLocation = match?.gameState?.game?.ball?.location 
    ? getLocation(getSafeLocation(match.gameState.game.ball.location))
    : { X: 4096, Y: 6000 }; // Center of field as default

  // Ensure left and right teams have valid location data
  const safeLeft = (match?.gameState?.left || []).map(player => ({
    ...player,
    location: getSafePlayerLocation(player.location)
  }));
  
  const safeRight = (match?.gameState?.right || []).map(player => ({
    ...player,
    location: getSafePlayerLocation(player.location)
  }));

  return {
    ballLocation,
    left: safeLeft,
    right: safeRight,
  };
};

interface MiniMapProps {
  ballLocation: Point;
  left: Player[];
  right: Player[];
  height: number;
}

// Specific comparison function for MiniMap props
const shouldUpdateMiniMap = (prevProps: MiniMapProps, nextProps: MiniMapProps): boolean => {
  if (prevProps.height !== nextProps.height) {
    return false; // Update if height changes
  }
  if (!areLocationsEqual(prevProps.ballLocation, nextProps.ballLocation)) {
    return false; // Update if ball location changes
  }
  // Use the existing areTeamsEqual but pass only relevant props
  if (!areTeamsEqual(prevProps.left, prevProps.right, nextProps.left, nextProps.right)) {
    return false; // Update if team locations change
  }
  return true; // Don't update if nothing relevant changed
};

const MiniMapCore: FC<MiniMapProps> = (props) => {
  return (
    <svg
      width="100%"
      height={props.height}
      viewBox="0 0 8192 12000"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      xmlSpace="preserve"
      style={{
        fillRule: 'evenodd',
        clipRule: 'evenodd',
        strokeLinecap: 'square',
        strokeMiterlimit: 10,
      }}
    >
      <MiniMapBackground />
      
      {props.left.map((player, index) => {
        let location = getLocation(player.location);
        return (
          <circle
            key={index}
            className="blue-car"
            cx={location.X}
            cy={location.Y}
            r="192"
          />
        );
      })}
      {props.right.map((player, index) => {
        let location = getLocation(player.location);
        return (
          <circle
            key={index}
            className="orng-car"
            cx={location.X}
            cy={location.Y}
            r="192"
          />
        );
      })}
      <circle
        id="ball"
        cx={props.ballLocation.X}
        cy={props.ballLocation.Y}
        r={128}
        style={{
          fill: 'rgb(230,230,230)',
          stroke: 'rgb(128,128,128)',
          strokeWidth: 5,
          strokeLinejoin: 'round',
          strokeMiterlimit: '1.5',
        }}
      />
    </svg>
  );
};

// Wrap MiniMapCore with React.memo using the specific comparison function
export const MiniMap = React.memo(MiniMapCore, shouldUpdateMiniMap);
