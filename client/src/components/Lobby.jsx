import React, {Fragment, useEffect, useState} from "react";
import TextField from "@material-ui/core/TextField";
import { Button } from '@material-ui/core';


import io from "socket.io-client";
import CardSVG from "../svg/cards/3C.svg";
const socket = io.connect('http://localhost:5000');


export const Lobby = () => {
  const [state, setState] = useState({ name: '', game: '' });

  const onTextChange = e => {
    setState({ ...state, [e.target.name]: e.target.value });
  };

  const onMessageSubmit = (e) => {
    e.preventDefault();
    const { game, name } = state;
    socket.emit('join_game', { game, name });
    sessionStorage.setItem('game', game);
    sessionStorage.setItem('name', name);
  };

  return (
    <div className="lobby">
      <img src={CardSVG} alt="Three of Clubs" />
      <form onSubmit={onMessageSubmit}>
        <div className="name-field">
          <TextField name="name" onChange={e => onTextChange(e)} value={state.name} label='name' />
        </div>
        <div className="game-field">
          <TextField name="game" onChange={e => onTextChange(e)} value={state.game} label='game' />
        </div>
        <Button color='primary' type='submit'>play</Button>
      </form>
    </div>
  );
}
