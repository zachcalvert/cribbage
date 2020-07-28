import React, { Fragment } from "react";
import CloseIcon from '@material-ui/icons/Close';
import IconButton from '@material-ui/core/IconButton';
import { Chat } from './Chat.jsx';
import { Player } from './Player.jsx';

import io from "socket.io-client";
const socket = io.connect('http://localhost:5000');

export const Game = () => {
  const game = sessionStorage.getItem('game');
  const name = sessionStorage.getItem('name');

  const leaveGame = () => {
    socket.emit('leave_game', { game, name });
    sessionStorage.removeItem('game');
    sessionStorage.removeItem('name');
  };

  return (
    <Fragment>
      <h4>{ game }</h4>
      <IconButton className="leave-game" onClick={leaveGame} aria-label="leave">
        <CloseIcon fontSize="inherit" />
      </IconButton>

      <Chat />
      <Player name={name}/>
    </Fragment>
  );
};