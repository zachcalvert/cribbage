import React, { useCallback, useState } from 'react';

import { generate } from "random-words";

import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Fab from '@mui/material/Fab';
import IconButton from '@mui/material/IconButton';
import Link from '@mui/material/Link';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import RefreshIcon from '@mui/icons-material/Refresh';

function Game() {
  const [name, setName] = useState('');
  const [room, setRoom] = useState(generate({ exactly: 1, wordsPerString: 3, separator: "-" }));

  const handleGameNameRefresh = useCallback(
    (event) => setRoom(generate({ exactly: 1, wordsPerString: 3, separator: "-" })),
    []
  );

  const handleJoin = e => {
    e.preventDefault();
    if ((!name) || (!room)) {
      return alert("Please provide both your nickname and a game name.");
    }
    sessionStorage.setItem('name', name);
    sessionStorage.setItem('game', room);
    // socket.emit("player_join", {name: name, game: room});
  };

  const handleLeave = e => {
    e.preventDefault();
    // socket.emit(
    //   "player_leave", {
    //     name: sessionStorage.getItem('name'),
    //     game: sessionStorage.getItem('game')
    //   }
    // );
    sessionStorage.removeItem('name');
    sessionStorage.removeItem('game');
    setRoom(generate({ exactly: 1, wordsPerString: 3, separator: "-" }));
  };

  const handleNicknameSubmit = (e) => {
    sessionStorage.setItem('name', name);
    sessionStorage.setItem('game', room);
    // socket.emit("player_join", {name: name, game: room});
    setName(name);
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ my: 4 }}>
      <img style={{ marginTop: '20px' }} alt='logo' src="logo.png" />
      <form style={{ marginTop: '20px' }} onSubmit={event => handleJoin(event)}>
        <TextField
          id="name"
          helperText="your name"
          autoFocus={true}
          onChange={e => setName(e.target.value.trim())}
        />
        <TextField
          id="room"
          onChange={e => setRoom(e.target.value.trim())}
          helperText="game name"
          value={room}
        />
        <IconButton className="refresh-game-name" onClick={e => handleGameNameRefresh(e)}>
          <RefreshIcon fontSize="30px"/>
        </IconButton><br/>
        <Fab variant="extended"
          color="primary"
          type="submit">
          Play
        </Fab>
        <Typography className='webmaster-info' variant='caption'>
          <Link href="https://github.com/zachcalvert/cribbage">Github</Link>
        </Typography>
      </form>
      </Box>
    </Container>
  )
}

export default Game;