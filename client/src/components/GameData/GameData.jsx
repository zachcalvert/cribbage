import React, { useEffect, useState } from "react";

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Slide from '@mui/material/Slide';

import useKeypress from "../../hooks/useKeyPress";

import { socket } from "../../socket";
import './GameData.css'

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export const GameData = () => {
  const [open, setOpen] = useState(false);
  const [gameData, setGameData] = React.useState({});
  
  useKeypress('?', () => {
    socket.emit('get_game_data', {'game': sessionStorage.getItem('room')});
    setOpen(true);
  });

  useEffect(() => {
    function onShowGameData(msg) {
      setGameData(msg.game_data);
    }
  
    socket.on("show_game_data", onShowGameData);
  
    return () => {
      socket.off("show_game_data", onShowGameData);
    };
  }, [gameData]);
    
  const handleClose = () => {
    setOpen(false);
  };

  const handleResendCards = () => {
    socket.emit('send_cards', {'game': sessionStorage.getItem('room')});
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