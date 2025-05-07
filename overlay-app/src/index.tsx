import React, { lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './css/root.css';
import { reportWebVitals } from './reportWebVitals';

import { WsSubscribers } from './wsSubscribers';
import { Match } from './match';
import { RCONN } from './RCONN';
import TeamColorManager from './components/TeamColorManager';

// Lazy load route components
const Stream = lazy(() => import('./routes/Stream'));
const GameStats = lazy(() => import('./routes/GameStats'));
const MiniMapRoute = lazy(() => import('./routes/MiniMapRoute'));
const SeriesControlRoute = lazy(() => import('./routes/SeriesControlRoute'));

// Loading component for Suspense
const LoadingFallback = () => (
  <div style={{ 
    position: 'fixed', 
    top: 0, 
    left: 0, 
    width: '100%', 
    height: '100%', 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: 'rgba(var(--base-color), 0.9)',
    color: 'white',
    fontSize: '2rem'
  }}>
    Loading...
  </div>
);

function getWindowDimensions() {
  const { innerWidth: width, innerHeight: height } = window;
  return { width, height };
}

function tryStartRconn():RCONN | undefined{
  if(process.env.REACT_APP_RCONN_PASS){
    try{
      let r = new RCONN(
        process.env.REACT_APP_RCONN_PASS, 
        process.env.REACT_APP_RCONN_HOST, 
        process.env.REACT_APP_RCONN_PORT
        );
    
      r.send('replay_gui hud 0');
      r.send('replay_gui matchinfo 0');
      return r;
    }
    catch(err){
      console.log(err);
    }
    return undefined;
  }
}

const { height, width } = getWindowDimensions();

console.log(`Width: ${width} Height: ${height}`);
console.log(`WS_RELAY_HOST:${process.env.REACT_APP_WS_RELAY_HOST}`);
console.log(`WS_RELAY_PORT:${process.env.REACT_APP_WS_RELAY_PORT}`);
console.log(`WS_RELAY_DEBUG:${process.env.REACT_APP_WS_RELAY_DEBUG}`);

WsSubscribers.init(
  process.env.REACT_APP_WS_RELAY_HOST,
  process.env.REACT_APP_WS_RELAY_PORT,
  process.env.REACT_APP_WS_RELAY_DEBUG
);

const rconn = tryStartRconn(); // try to open remote connection to Rocket league to hide UI on match startup

const match = new Match(
  WsSubscribers,   
  rconn
);

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <Stream match={match} />
      </Suspense>
    ),
  },
  {
    path: '/stats',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <GameStats match={match} width={width} />
      </Suspense>
    ),
  },
  {
    path: '/minimap',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <MiniMapRoute match={match} height={height} width={width} />
      </Suspense>
    ),
  },
  {
    path: '/ctrl',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <SeriesControlRoute height={height} width={width} match={match} />
      </Suspense>
    ),
  },
]);

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <TeamColorManager match={match} />
    <RouterProvider router={router} />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
