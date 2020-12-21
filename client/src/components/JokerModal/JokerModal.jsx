import React, { useState } from "react";
import { useModal } from "react-modal-hook";
import { useSocket } from "use-socketio";
import useSound from "use-sound";

import { Dialog, DialogContent, DialogTitle, Fab } from "@material-ui/core";


export const JokerModal = () => {
  const game = sessionStorage.getItem('game');
  const name = sessionStorage.getItem('name');
  const [startable, setStartable] = useState(true);
  const [boop] = useSound('/sounds/boop.mp3', { volume: 0.25 });

  const { socket } = useSocket("setup_started");

  const handleJokerSelection = (e) => {
    boop();
    socket.emit('joker_chosen', { game: game, player: name });
    document.activeElement.blur();
  };

  const [showModal, hideModal] = useModal(({in: open, onExited}) => (
    <>
      <Dialog className="cards-modal" open={open} onExited={hideModal} onClose={hideModal}>
        <DialogTitle>
          Game settings
        </DialogTitle>
        <DialogContent>
          You got a joker!
        </DialogContent>
      </Dialog>
    </>
  ));

  return (
    <></>
  );
}