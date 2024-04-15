import React, { useEffect, useState } from "react";

import { Dialog, DialogContent, DialogTitle, DialogActions, Fab } from "@mui/material";
import Button from "@mui/material/Button";

import GameSettings from "./GameSettings";

import { socket } from "../../socket";


export const StartMenu = () => {
  const game = sessionStorage.getItem('room');
  const name = sessionStorage.getItem('name');
  const [showStartGameModal, setShowStartGameModal] = useState(false);
  const [startable, setStartable] = useState(true);
  const [cribSize, setCribSize] = useState(4);
  const [winningScore, setWinningScore] = useState(121);
  const [jokers, setJokers] = useState(false);

  useEffect(() => {
    function onSetupStarted(value) {
      setStartable(false);
    }

    socket.on('setup_started', onSetupStarted);

    return () => {
      socket.off('setup_started', onSetupStarted);
    };
  }, [startable]);

  const handleGameSetup = (e) => {
    setShowStartGameModal(true);
    socket.emit('setup', { game: game, player: name });
    document.activeElement.blur();
  };

  const handleStartGame = e => {
    e.preventDefault();
    if (Number.isInteger(parseInt(winningScore))) {
      socket.emit('start_game', {
        id: game,
        winning_score: winningScore,
        crib_size: cribSize,
        jokers: jokers
      });
    }
    setShowStartGameModal(false);
  };

  return (
    <>
      <Fab variant="extended"
        className="action-button"
        color="primary"
        onClick={handleGameSetup}
        disabled={!startable}>
        Start
      </Fab>

      {showStartGameModal && 
        <Dialog
          maxWidth="sm"
          fullWidth={true}
          open={showStartGameModal}
          onExited={() => setShowStartGameModal(false)}
          onClose={() => setShowStartGameModal(false)}
        >
          <DialogTitle>
            Game settings
          </DialogTitle>
          <DialogContent>
            <GameSettings
              setWinningScore={setWinningScore}
              setCribSize={setCribSize}
              jokers={jokers}
              setJokers={setJokers}
            />
          </DialogContent>
          <DialogActions>
            <Button variant="contained" color="primary" onClick={event => handleStartGame(event)}>Play</Button>
          </DialogActions>
        </Dialog>
      }
    </>
  );
}