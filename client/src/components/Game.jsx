import React, { useState } from "react";
import { useSocket } from "use-socketio";
import { Button, IconButton, TextField } from "@material-ui/core";
import CloseIcon from "@material-ui/icons/Close";

import { Chat } from "./Chat/Chat";
import { Deck } from "./Deck/Deck";
import { Opponents } from "./Opponent/Opponents";
import { Player } from "./Player/Player";
import { Scoreboard } from "./Scoreboard/Scoreboard";
import { StartMenuProvider } from "./StartMenu/StartMenuContext";



export const Game = ()  => {
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [room, setRoom] = useState('');
  const [opponents, setOpponents] = useState([]);

  const {socket} = useSocket("attendance_change", msg => {
    (msg.type === 'join') ? (
        (msg.name === name) ? (
            setOpponents(JSON.stringify(msg.opponents))
        ) : (
            setOpponents([...opponents, msg.name])
        )
    ) : (
        setOpponents(opponents.filter(player => player !== msg.name))
    )
  });

  const handleJoin = e => {
    e.preventDefault();
    if ((!name) || (!room)) {
      return alert("Please provide both your nickname and a game name.");
    }
    setId(name);
    sessionStorage.setItem('name', name);
    sessionStorage.setItem('game', room);
    socket.emit("player_join", {name: name, game: room});
  };

  const handleLeave = e => {
    e.preventDefault();
    sessionStorage.removeItem('name');
    sessionStorage.removeItem('game');
    socket.emit("player_leave", {name: name, game: room});
    setId('');
  };

  return id ? (
      <div className="container-fluid">
        <div className="game row">
          <div className="chat col-lg-4">
            <Chat />
          </div>
          <div className="game-table col-lg-8 row">
            <IconButton className="leave-game" onClick={handleLeave} aria-label="leave">
              <CloseIcon fontSize="inherit" />
            </IconButton>

            <div className="top-row row">
              <span>{opponents}</span>
              {opponents.map((opponent, index) => (
                <div key={index} className={`opponent opponent-${index}`}>{opponent}</div>
              ))}
            </div>

            <div className="middle-row row">
              <div className="scoreboard col-8">
                <Scoreboard />
              </div>
              <div className="col-1"></div>
              <div className="deck col-2">
                <Deck />
              </div>
            </div>

            <footer className="bottom-row">
              <StartMenuProvider>
                <Player name={name}/>
              </StartMenuProvider>
            </footer>

          </div>
        </div>
      </div>
  ) : (
    <div style={{ textAlign: 'center', height: '100%', width: '100%', display: 'inline-block' }}>
      <form style={{ marginTop: '150px' }} onSubmit={event => handleJoin(event)}>
        <TextField id="name" onChange={e => setName(e.target.value.trim())} label="name" /><br />
        <TextField id="room" onChange={e => setRoom(e.target.value.trim())} label="game" /><br />
        <Button color="primary" type="submit">Submit</Button>
      </form>
    </div>
  );
};