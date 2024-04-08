import React, { useCallback, useEffect, useState } from 'react';

import { generate } from "random-words";

import { styled } from '@mui/material/styles';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Fab from '@mui/material/Fab';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import RefreshIcon from '@mui/icons-material/Refresh';

import { Chat } from "./Chat/Chat";
import { socket } from '../socket';

const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: 'center',
  color: theme.palette.text.secondary,
}));

function Game() {
  const [name, setName] = useState('');
  const [room, setRoom] = useState(generate({ exactly: 1, wordsPerString: 3, separator: "-" })[0]);
  const [gameStatus, setGameStatus] = useState('NEW');

  const [players, setPlayers] = useState([]);

  const handleGameNameRefresh = useCallback(
    (event) => setRoom(generate({ exactly: 1, wordsPerString: 3, separator: "-" })[0]),
    []
  );

  const handleJoin = e => {
    e.preventDefault();
    if ((!name) || (!room)) {
      return alert("Please provide both your nickname and a game name.");
    }
    sessionStorage.setItem('name', name);
    sessionStorage.setItem('game', room);
    socket.emit("player_join", {name: name, room: room});
    setGameStatus('IN_PROGRESS');
  };

  const handleLeave = e => {
    e.preventDefault();
    socket.emit(
      "player_leave", {
        name: sessionStorage.getItem('name'),
        game: sessionStorage.getItem('game')
      }
    );
    sessionStorage.removeItem('name');
    sessionStorage.removeItem('game');
    setRoom(generate({ exactly: 1, wordsPerString: 3, separator: "-" })[0]);
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ my: 4 }}>
      {gameStatus === 'NEW' ? (
        <>
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
      </>
      ) : (
      <Grid container spacing={2}>
        <Grid item xs={3}>
          <Item><Chat /></Item>
        </Grid>
        <Grid item xs={9}>
          <Item>xs=4</Item>
        </Grid>
      </Grid>
      )}
      </Box>
    </Container>
  )
}

export default Game;