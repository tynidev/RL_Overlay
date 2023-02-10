import React from 'react';
import ReactDOM from 'react-dom/client';
import './css/root.css';
import reportWebVitals from './reportWebVitals';

import WsSubscribers from './ws_subscribers'
import Match from './match'
import Overlay from './components/Overlay';

WsSubscribers.init(49322, false);

const match = new Match(WsSubscribers);
match.localplayer_support = true;

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Overlay match={match}/>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
