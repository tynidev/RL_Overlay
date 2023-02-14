import React from 'react';
import ReactDOM from 'react-dom/client';
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import './css/root.css';
import reportWebVitals from './reportWebVitals';

import WsSubscribers from './ws_subscribers'
import Match from './match'

import Stream from './routes/Stream';
import GameStats from "./routes/GameStats";

WsSubscribers.init(49322, false);
const match = new Match(WsSubscribers, process.env.REACT_APP_RCONN_PASS);

const router = createBrowserRouter([
  {
    path: "/",
    element: <Stream match={match}/>,
  },
  {
    path: "/post-game",
    element: <GameStats match={match}/>,
  },
]);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
