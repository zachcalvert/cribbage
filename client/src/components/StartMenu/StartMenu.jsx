import React from "react";
import { useSocket } from "use-socketio";
import useSound from "use-sound";

import { Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, makeStyles, Typography } from "@material-ui/core";
import CloseIcon from '@material-ui/icons/Close';

import GameSettings from "./GameSettings";


const useStyles = makeStyles((theme) => ({
  actionButton: {
    margin: theme.spacing(5),
    background: '#ab003c'
  },
  closeModal: {
    position: 'absolute',
    top: 0,
    right: 0
  },
  hint: {
    fontSize: 12
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
      <Dialog style={{ textAlign: 'center'}} open={open}>
        <DialogTitle>
          Game setup
        </DialogTitle>
        <DialogContent dividers>
            <IconButton className={classes.closeModal} onClick={e => setOpen(false)} aria-label="close">
              <CloseIcon fontSize="inherit" />
            </IconButton>
          <GameSettings />
        </DialogContent>
        <DialogActions>
          <Typography className={classes.hint}>All human players should join before starting the game.</Typography>
        </DialogActions>
      </Dialog>
      <Button variant='contained' color="secondary"
        className={classes.actionButton}
        onClick={handleAction}
        disabled={!startable}>
        { buttonText }
      </Button>
    </>
  );
}