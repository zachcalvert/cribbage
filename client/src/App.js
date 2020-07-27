import React, { Fragment, useEffect } from 'react';
import './App.css';
import { Game } from './components/Game.jsx';
import { Lobby } from './components/Lobby.jsx';

import io from "socket.io-client";
const socket = io.connect('http://localhost:5000');

function App() {
  let gameActive = sessionStorage.getItem('game') !== null;

  useEffect(() => {
    socket.on('join', ({ game, name }) => {
      gameActive = true;
    });
    socket.on('leave', ({ game, name }) => {
      gameActive = false;
    });
  });

  return (
    <Fragment>
      { gameActive ? <Game /> : <Lobby /> }
    </Fragment>
  );
}

export default App;
