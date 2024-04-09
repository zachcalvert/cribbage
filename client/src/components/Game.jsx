import React, { useCallback, useEffect, useState } from 'react';

import { generate } from "random-words";

import { styled } from '@mui/material/styles';
import Container from '@mui/material/Container';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import Box from '@mui/material/Box';
import Fab from '@mui/material/Fab';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import RefreshIcon from '@mui/icons-material/Refresh';

import { Chat } from "./Chat/Chat";
import { socket } from '../socket';
import Header from './Header/Header';

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
  const [gameInProgress, setGameInProgress] = useState(false);

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
    setGameInProgress(true);
  };

  return (
    <>
      <Header isConnected={socket.connected} room={room} setRoom={setRoom} gameInProgress={gameInProgress} setGameInProgress={setGameInProgress} name={name} />
      <Container maxWidth="xl">
        <Box sx={{ my: 4 }}>
        {!gameInProgress ? (
          <>
          <Grid
            container
            spacing={0}
            direction="column"
            alignItems="center"
            justifyContent="center"
            sx={{ height: '100%' }}
          >
            <Grid item xs={12}>
              <img style={{ marginTop: '20px', height: '150px' }} alt='logo' src="logo.png" />
            </Grid>
            <form style={{ marginTop: '20px' }} onSubmit={event => handleJoin(event)}>
              <Grid item xs={12} style={{marginBottom: '12px'}}>
              <TextField
                id="name"
                helperText="your name"
                autoFocus={true}
                onChange={e => setName(e.target.value.trim())}
                sx={{ width: '300px' }}
              />
            </Grid>
            <Grid item xs={12} style={{ marginBottom: '24px' }}>
              <TextField
                id="room"
                onChange={e => setRoom(e.target.value.trim())}
                helperText="game name"
                value={room}
                sx={{ width: '300px' }}
                InputProps={{
                  endAdornment: <InputAdornment position="end">
                  <IconButton
                    aria-label="refresh game name"
                    onClick={e => handleGameNameRefresh(e)}
                    edge="end"
                  >
                    <RefreshIcon />
                  </IconButton>
                </InputAdornment>,
                }}
              />
            </Grid>

            <Grid item xs={12} style={{ marginBottom: '40px', textAlign: 'center' }}>
              <Fab
                variant="extended"
                color="primary"
                type="submit"
                sx={{ padding: '20px' }}
              >
                Play
              </Fab>
            </Grid>
          </form>
          
        </Grid>
        <BottomNavigation
          showLabels
          value="source"
          onChange={(event, newValue) => {
            console.log(newValue);
          }}
        >
        <BottomNavigationAction label="View Source" href="https://github.com/zachcalvert/cribbage" />
      </BottomNavigation>
      </>
        ) : (
        <Grid container spacing={2}>
          <Grid item xs={9} sx={{ height: "85vh"}}>
            <Item sx={{ height: "100%"}}>
              
            </Item>
          </Grid>
          <Grid item xs={3}>
            <Item><Chat /></Item>
          </Grid>
        </Grid>
        )}
        </Box>
      </Container>
    </>
  )
}

export default Game;