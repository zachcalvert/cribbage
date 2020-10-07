import React, { useState } from "react";
import { useModal } from "react-modal-hook";

import { Dialog, DialogActions, DialogContent, DialogTitle, Fab, TextField } from "@material-ui/core";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";

import useSound from "use-sound";
import { useSocket } from "use-socketio";


export const StartMenu = () => {
  const game = sessionStorage.getItem('game');
  const name = sessionStorage.getItem('name');
  const [startable, setStartable] = useState(true);
  const [buttonText, setButtonText] = useState('Start')
  const [boop] = useSound('/sounds/boop.mp3', { volume: 0.25 });

  const { socket } = useSocket("setup_started", msg => {
    if (msg.players.includes(name)) {
      setStartable(true);
    } else {
      setStartable(false);
      setButtonText(`Waiting for ${msg.players}`)
    }
  });

  // cribbage
  const [cribSize, setCribSize] = useState(4);
  const [winningScore, setWinningScore] = useState(121);

  const handleAction = (e) => {
    boop();
    socket.emit('setup', { game: game, player: name });
    showModal();
    document.activeElement.blur();
  };

  const handleStartGame = e => {
    e.preventDefault();
    if (Number.isInteger(parseInt(winningScore))) {
      socket.emit('start_game', {
        game: game,
        winning_score: winningScore,
        crib_size: cribSize
      });
      hideModal();
    }
  };

  const handleCribSizeChange = (event) => {
    setCribSize(event.target.value);
  };

  const [showModal, hideModal] = useModal(({in: open, onExited}) => (
      <Dialog className="cards-modal" open={open} onExited={hideModal} onClose={hideModal}>
        <DialogTitle>Game setup</DialogTitle>
        <DialogContent>
          <TextField
              defaultValue="121"
              id="name"
              onChange={e => setWinningScore(e.target.value)}
              label="Winning score"
          />
          <br/><br/>
          <FormControl>
            <InputLabel>
              Cribs
            </InputLabel>
            <Select
                defaultValue="4"
                onChange={handleCribSizeChange}
            >
              <MenuItem value={4}>Standard (4 cards)</MenuItem>
              <MenuItem value={5}>Spicy (5 cards)</MenuItem>
              <MenuItem value={6}>Chaotic (6 cards)</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <form style={{"width": "100%"}} onSubmit={event => handleStartGame(event)}>
            <Fab variant="extended" type="submit">Start game</Fab>
          </form>
        </DialogActions>
      </Dialog>
  ), [winningScore, cribSize]);

  return (
    <>
      <Fab variant="extended"
        className="action-button"
        color="primary"
        onClick={handleAction}
        disabled={!startable}>
        {buttonText}
      </Fab>
    </>
  );
}