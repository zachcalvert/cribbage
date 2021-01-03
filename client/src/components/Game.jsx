import React, { useEffect, useState } from "react";
import { useSocket } from "use-socketio";
import {Dialog, DialogContent, DialogTitle, Fab, IconButton, TextField} from "@material-ui/core";
import CloseIcon from "@material-ui/icons/Close";

import { Chat } from "./Chat/Chat";
import { Deck } from "./Deck/Deck";
import { Opponent } from "./Opponent/Opponent";
import { Player } from "./Player/Player";
import { Scoreboard } from "./Scoreboard/Scoreboard";
import { StartMenu } from "./StartMenu/StartMenu";
import {useModal} from "react-modal-hook";
import Typography from "@material-ui/core/Typography";

const randomWords = require('random-words');


export const Game = ()  => {
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [room, setRoom] = useState(randomWords({ exactly: 3, join: '-' }));
  const [opponents, setOpponents] = useState([]);
  const [inProgress, setInProgress] = useState(false);


  const { socket } = useSocket("players", msg => {
    setOpponents(msg.players.filter(player => player !== name))
  });

  useSocket("game_begun", msg => {
    setInProgress(true);
  });

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const gameName = urlParams.get('game');
    if (gameName && !name) {
      setRoom(gameName);
      setId('a');
      showModal();
    }

  }, [room]);

  const InviteLink = () => {
    const encoded = encodeURI(`https://cribbage.live/?game=${room}`)
    return id ? (
      <div className="jumbotron">
        <p className="display-4">Welcome!</p>
        <p>Invite others to this game by sharing the below link:</p>
        <a href={encoded}>{encoded}</a>
        <hr></hr>
        <p>Or, click the Start button to play against the computer.</p>
      </div>
    ) : ( <span /> )
  };

  const handleJoin = e => {
    e.preventDefault();
    if ((!name) || (!room)) {
      return alert("Please provide both your nickname and a game name.");
    }
    sessionStorage.setItem('name', name);
    sessionStorage.setItem('game', room);
    socket.emit("player_join", {name: name, game: room});
    setId(name);
  };

  const handleLeave = e => {
    e.preventDefault();
    hideLeaveGameModal();
    sessionStorage.removeItem('name');
    sessionStorage.removeItem('game');
    socket.emit("player_leave", {name: name, game: room});
    setId('');
    setInProgress(false);
  };

  const renderOpponents = () => {
    return inProgress || opponents.length ? (
      <>
        {opponents.map(name => (
          <div key={name} className={`opponent opponent-${name}`}>
            <Opponent name={name} />
          </div>
        ))}
      </>
    ) : (
      <InviteLink />
    );
  };

  const handleNicknameSubmit = (e) => {
    sessionStorage.setItem('name', name);
    sessionStorage.setItem('game', room);
    socket.emit("player_join", {name: name, game: room});
    setId(name);
    hideModal();
  };

  const [showModal, hideModal] = useModal(({in: open, onExited}) => (
    <>
      <Dialog className="enter-nickname-modal" open={open} onExited={hideModal} onClose={false}>
        <DialogTitle>
          Welcome!
        </DialogTitle>
        <DialogContent>
          <span>You've been invited you to join a game. Enter your nickname below to play!</span>
          <br /><br />
          <TextField
            id="name"
            label="nickname"
            onChange={e => setName(e.target.value.trim())}  />
            <br /><br />
          <button id="enter-nickname" disabled={!name} style={{"margin-bottom": "10px"}}
                  className="btn btn-default btn-primary btn-block" onClick={handleNicknameSubmit}>
            Play
          </button>
        </DialogContent>
      </Dialog>
    </>
  ), [name]);

  const [showLeaveGameModal, hideLeaveGameModal] = useModal(({in: open, onExited}) => (
    <>
      <Dialog className="enter-nickname-modal" open={open} onExited={hideLeaveGameModal} onClose={hideLeaveGameModal}>
        <DialogTitle>
          Are you sure you want to leave?
        </DialogTitle>
        <DialogContent>
          <button id="stay" style={{"margin": "10px"}} className="btn btn-default btn-primary"
                  onClick={hideLeaveGameModal}>Stay
          </button>
          <button id="confirm-leave" style={{"background-color": "red", "color": "white", "margin": "10px"}}
                  className="btn btn-default" onClick={handleLeave}>Leave
          </button>
        </DialogContent>
      </Dialog>
    </>
  ), []);

  return id ? (
      <div className="container-xl">
        <div className="game row">
          <div className="chat col-xl-4">
            <Chat />
          </div>
          <div className="game-table col-xl-8 row">
            <IconButton className="leave-game" onClick={showLeaveGameModal} aria-label="leave">
              <CloseIcon fontSize="inherit" />
            </IconButton>

            <div className="top-row row">
              { renderOpponents() }
            </div>

            <div className="middle-row row">
              <div className="scoreboard col-8">
                { inProgress ? (<Scoreboard />) : (<StartMenu />) }
              </div>
              <div className="col-1 middle-row-spacer"></div>
              <div className="deck col-2">
                <Deck />
              </div>
            </div>

            <footer className="bottom-row">
              <Player name={ name }/>
            </footer>

          </div>
        </div>
      </div>
  ) : (
    <div style={{ textAlign: 'center', height: '100%', width: '100%', display: 'inline-block' }}>
      <img style={{ marginTop: '20px' }} src="logo.png" />
      <form style={{ marginTop: '20px' }} onSubmit={event => handleJoin(event)}>
        <TextField
            id="name"
            helperText="your name"
            autoFocus={true}
            style={{'width': '185px'}}
            onChange={e => setName(e.target.value.trim())}  /><br /><br />
        <TextField
            id="room"
            onChange={e => setRoom(e.target.value.trim())}
            helperText="game name, feel free to change"
            style={{'width': '185px'}}
            defaultValue={room}/><br/>
         <Fab variant="extended"
            style={{ padding: '20px', margin: '20px' }}
            color="primary"
            type="submit">
            Play
         </Fab>
      </form>
    </div>
  );
};