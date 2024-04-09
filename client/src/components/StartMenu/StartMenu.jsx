import React, { useState } from "react";

import { Dialog, DialogContent, DialogTitle, Fab } from "@mui/material";

import { socket } from "../../socket";
import GameSettings from "./GameSettings";


export const StartMenu = () => {
  const game = sessionStorage.getItem('game');
  const name = sessionStorage.getItem('name');
  const [showStartGameModal, setShowStartGameModal] = useState(false);
  const [startable, setStartable] = useState(true);
  const [buttonText, setButtonText] = useState('Start')

  // const { socket } = useSocket("setup_started", msg => {
  //   if (msg.players.includes(name)) {
  //     setStartable(true);
  //   } else {
  //     setStartable(false);
  //     setButtonText(`Waiting for ${msg.players}`)
  //   }
  // });

  const handleStartGame = (e) => {
    setShowStartGameModal(true);
    socket.emit('setup', { game: game, player: name });
    document.activeElement.blur();
  };

  return (
    <>
      <Fab variant="extended"
        className="action-button"
        color="primary"
        onClick={handleStartGame}
        disabled={!startable}>
        {buttonText}
      </Fab>

      {showStartGameModal && 
        <Dialog
          maxWidth="md"
          fullWidth={true}
          open={showStartGameModal}
          onExited={() => setShowStartGameModal(false)}
          onClose={() => setShowStartGameModal(false)}
        >
          <DialogTitle>
            Game settings
          </DialogTitle>
          <DialogContent>
            <GameSettings setShowStartGameModal={setShowStartGameModal} />
          </DialogContent>
        </Dialog>
      }
    </>
  );
}