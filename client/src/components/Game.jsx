import React, { useState } from "react";
import { useModal } from "react-modal-hook";
import { useSocket } from "use-socketio";
import { Dialog, DialogActions, DialogContent, DialogTitle, Fab, IconButton, TextField } from "@material-ui/core";
import CloseIcon from "@material-ui/icons/Close";

import { Chat } from "./Chat/Chat";
import { Deck } from "./Deck/Deck";
import { Opponent } from "./Opponent/Opponent";
import { Player } from "./Player/Player";
import { Scoreboard } from "./Scoreboard/Scoreboard";

export const Game = ()  => {
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [room, setRoom] = useState('');
  const [opponents, setOpponents] = useState([]);
  const [inProgress, setInProgress] = useState(false);
  const [winningScore, setWinningScore] = useState(90);

  const { socket } = useSocket("players", msg => {
    setOpponents(msg.players.filter(player => player !== name))
  });

  useSocket("draw_board", msg => {
    setInProgress(true)
  });

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
    sessionStorage.removeItem('name');
    sessionStorage.removeItem('game');
    socket.emit("player_leave", {name: name, game: room});
    setId('');
  };

  const handleStartGame = e => {
    e.preventDefault();
    socket.emit('start_game', { game: sessionStorage.getItem('game'), winning_score: winningScore, jokers: false });
    hideModal();
  };

  const handleStartClick = (e) => {
    socket.emit('setup', { game: room, player: name });
    showModal();
    document.activeElement.blur();
  };

  const [showModal, hideModal] = useModal(({ in: open, onExited }) => (
    <Dialog className="cards-modal" open={open} onExited={onExited} onClose={hideModal}>
      <DialogTitle>Start a game</DialogTitle>
        <IconButton className="close-modal" onClick={hideModal} aria-label="leave">
          <CloseIcon fontSize="inherit" />
        </IconButton>
        <DialogContent>
          <TextField id="winning-score" onChange={e => setWinningScore(e.target.value.trim())} label="winning score" />
        </DialogContent>
      <DialogActions>
        <form onSubmit={event => handleStartGame(event)}>
          <Fab variant="extended" type="submit">Start</Fab>
        </form>
      </DialogActions>
    </Dialog>
  ));

  const renderOpponents = () => {
    return opponents.length ? (
      <>
        {opponents.map(name => (
          <div key={name} className={`opponent opponent-${name}`}>
            <Opponent name={name} />
          </div>
        ))}
      </>
    ) : (
      <span />
    );
  };

  return id ? (
      <div className="container-xl">
        <div className="game row">
          <div className="chat col-xl-4">
            <Chat />
          </div>
          <div className="game-table col-xl-8 row">
            <IconButton className="leave-game" onClick={handleLeave} aria-label="leave">
              <CloseIcon fontSize="inherit" />
            </IconButton>

            <div className="top-row row">
              { renderOpponents() }
            </div>

            <div className="middle-row row">
              <div className="scoreboard col-8">
                {
                  inProgress ? <Scoreboard /> : <Fab variant="extended" onClick={handleStartClick}>Start</Fab>
                }
              </div>
              <div className="col-1 middle-row-spacer"></div>
              <div className="deck col-2">
                <Deck />
              </div>
            </div>

            <footer className="bottom-row">
              <Player name={name}/>
            </footer>

          </div>
        </div>
      </div>
  ) : (
    <div style={{ textAlign: 'center', height: '100%', width: '100%', display: 'inline-block' }}>
      <form style={{ marginTop: '150px' }} onSubmit={event => handleJoin(event)}>
        <TextField id="name" onChange={e => setName(e.target.value.trim())} label="name" /><br />
        <TextField id="room" onChange={e => setRoom(e.target.value.trim())} label="game" /><br />
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