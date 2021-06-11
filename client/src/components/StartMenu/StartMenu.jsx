import React from "react";
import { useSocket } from "use-socketio";
import useSound from "use-sound";

import { Dialog, DialogContent, DialogTitle, Fab, makeStyles } from "@material-ui/core";

import GameSettings from "./GameSettings";


const useStyles = makeStyles((theme) => ({
  startButton: {
    position: 'absolute',
    top: '55%',
    left: '50%',
    transform: 'translate(-50%, -50%)'
  }
}))

export const StartMenu = () => {
  const classes = useStyles();
  const game = localStorage.getItem('cribbage-live-game');
  const name = localStorage.getItem('cribbage-live-name');
  const [open, setOpen] = React.useState(false);
  const [startable, setStartable] = React.useState(true);
  const [buttonText, setButtonText] = React.useState('Start')
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
    setOpen(true);
    document.activeElement.blur();
  };

  return (
    <>
      <Dialog open={open}>
        <DialogTitle>
          Game setup
        </DialogTitle>
        <DialogContent>
          <GameSettings />
        </DialogContent>
      </Dialog>
      <Fab variant="extended"
        className={classes.startButton}
        color="primary"
        onClick={handleAction}
        disabled={!startable}>
        {buttonText}
      </Fab>
    </>
  );
}