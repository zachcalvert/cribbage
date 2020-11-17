import React, { useState } from "react";
import { useModal } from "react-modal-hook";
import { useSocket } from "use-socketio";
import useSound from "use-sound";

import { Dialog, DialogContent, DialogTitle, Fab } from "@material-ui/core";

import MenuStepper from "./MenuStepper";


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

  const handleAction = (e) => {
    boop();
    socket.emit('setup', { game: game, player: name });
    showModal();
    document.activeElement.blur();
  };

  const [showModal, hideModal] = useModal(({in: open, onExited}) => (
      <Dialog className="cards-modal" open={open} onExited={hideModal} onClose={hideModal}>
        <DialogTitle>
          Game settings
        </DialogTitle>
        <DialogContent>
          <MenuStepper />
        </DialogContent>
      </Dialog>
  ));

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