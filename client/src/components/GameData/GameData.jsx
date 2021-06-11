import React, { useState } from "react";
import { useSocket } from "use-socketio";
import { Button, Dialog, Slide } from '@material-ui/core';

import useKeypress from "../../hooks/useKeyPress";

import './GameData.css'

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export const GameData = () => {
  const [open, setOpen] = useState(false);
  const [gameData, setGameData] = React.useState({});
  
  useKeypress('?', () => {
    socket.emit('get_game_data', {'game': localStorage.getItem('cribbage-live-game')});
    setOpen(true);
  });

  const { socket } = useSocket("show_game_data", msg => {
    setGameData(msg.game_data)
  });
    
  const handleClose = () => {
    setOpen(false);
  };

  const handleResendCards = () => {
    socket.emit('send_cards', {'game': localStorage.getItem('cribbage-live-game')});
  };

  const PrettyPrintJson = ({data}) => {
    return (<div className='game-data-modal'><pre>{ JSON.stringify(data, null, 2) }</pre></div>);
  }

  return (
    <div>
      <Dialog open={open} onClose={handleClose} TransitionComponent={Transition}>
          <Button onClick={handleResendCards}>Resend cards</Button>
        <PrettyPrintJson data={ gameData } />
      </Dialog>
    </div>
  );
};