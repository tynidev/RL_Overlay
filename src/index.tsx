import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './css/root.css';
import { reportWebVitals } from './reportWebVitals';

import { WsSubscribers } from './wsSubscribers';
import { Match } from './match';

import { Stream } from './routes/Stream';
import { GameStats } from './routes/GameStats';
import { MiniMapRoute } from './routes/MiniMapRoute';

function getWindowDimensions() {
  const { innerWidth: width, innerHeight: height } = window;
  return { width, height };
}

const { height, width } = getWindowDimensions();

console.log(`Width: ${width} Height: ${height}`);
console.log(`WS_RELAY_HOST:${process.env.REACT_APP_WS_RELAY_HOST}`);
console.log(`WS_RELAY_PORT:${process.env.REACT_APP_WS_RELAY_PORT}`);
console.log(`WS_RELAY_DEBUG:${process.env.REACT_APP_WS_RELAY_DEBUG}`);

WsSubscribers.init(
  process.env.REACT_APP_WS_RELAY_HOST
);

const match = new Match(
  WsSubscribers, 
  process.env.REACT_APP_RCONN_PASS, 
  process.env.REACT_APP_RCONN_HOST, 
  process.env.REACT_APP_RCONN_PORT
  );

const router = createBrowserRouter([
  {
    path: '/',
    element: <Stream match={match} />,
  },
  {
    path: '/stats',
    element: <GameStats match={match} width={width} />,
  },
  {
    path: '/minimap',
    element: <MiniMapRoute match={match} height={height} width={width} />,
  },
]);

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
