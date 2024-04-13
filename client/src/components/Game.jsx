import React, { useEffect,useState } from 'react';

import { styled } from '@mui/material/styles';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Slide from '@mui/material/Slide';
import Snackbar from '@mui/material/Snackbar';

import { useTheme } from '@mui/material';
import { useClipboard } from 'use-clipboard-copy';

import { Chat } from './Chat/Chat';
import { Deck } from './Deck/Deck';
import { Header } from './Header/Header';
import { Lobby } from './Lobby';
import { Opponent } from './Opponent/Opponent';
import { Player } from './Player/Player';
import { Scoreboard } from './Scoreboard/Scoreboard'
import { StartMenu } from './StartMenu/StartMenu';

import { socket } from '../socket';
import { GameData } from './GameData/GameData';
import { Divider, Link, Typography } from '@mui/material';

const Item = styled(Paper)(({ theme }) => ({
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: 'center',
  color: theme.palette.text.secondary,
}));

function InviteLink(room) {
  const [snackbarOpen, setSnackBarOpen] = useState(false);
  const clipboard = useClipboard();

  const encoded = encodeURI(`https://cribbage.live/?game=${room}`)

  return (
    <Box>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackBarOpen(false)}
        TransitionComponent={Slide}
      >
        <Alert
          onClose={() => setSnackBarOpen(false)}
          severity="success"
          variant="filled"
          sx={{ width: '100%' }}
        >
          Invite link copied to clipboard
        </Alert>
      </Snackbar>
      <Typography variant="h4" gutterBottom>
        Welcome!
      </Typography>
      <Typography variant="h6" sx={{ marginBottom: '1rem' }}>
        Click the Start button now to play against the computer.
        </Typography>
      <Button
        color="secondary"
        variant="contained"
        size="large"
        onClick={() => {
          setSnackBarOpen(true)
          clipboard.copy()
        }}
        >
        Invite a friend to play
      </Button>
      <input style={{ display: 'none' }} ref={clipboard.target} value={encoded} readOnly />
    </Box>
  )
};

function Game({ darkMode, handleDarkMode }) {
  const theme = useTheme();
  const [roomCreated, setRoomCreated] = useState(false);
  const [gameStatus, setGameStatus] = useState('NEW')
  const [opponents, setOpponents] = useState([]);

  const name = sessionStorage.getItem('name');
  const room = sessionStorage.getItem('room');

  useEffect(() => {
    function onGameBugun(value) {
      setGameStatus('IN_PROGRESS');
    }

    function onPlayers(msg) {
      setOpponents(msg.players.filter(player => player !== name))
    }

    socket.on("players", onPlayers);
    socket.on('game_begun', onGameBugun);

    return () => {
      socket.off("players", onPlayers);
      socket.off('game_begun', onGameBugun);
    };
  }, [gameStatus, opponents, name]);

  return (
    <>
      <Header
        darkMode={darkMode}
        handleDarkMode={handleDarkMode}
        roomCreated={roomCreated}
        setRoomCreated={setRoomCreated} />
      <Container maxWidth="md">
      <Paper sx={{ my: 4 }} elevation={0}>
        {roomCreated ? (
          <Grid container spacing={2}>
            <Grid item xs={12} sx={{ height: "calc(30vh - 40px)"}}>
              <Item sx={{ height: "100%"}} elevation={0}>
                {
                  opponents.length ? (
                    opponents.map(opponentName => (
                      <div key={opponentName} className={`opponent opponent-${opponentName}`}>
                        <Opponent opponentName={opponentName} />
                      </div>
                    ))
                  ) : (
                    gameStatus === 'NEW' && <InviteLink room={room} />
                  )
                }
              </Item>
            </Grid>

            <Grid item xs={12} sx={{ height: "calc(30vh - 40px)"}}>
              <Item sx={{ height: "100%" }} elevation={0}>
                <Grid container spacing={1} sx={{ alignItems: 'center', height: '100%' }}>
                  <Grid item xs={2}>
                    <Deck />
                  </Grid>
                  { gameStatus === 'NEW' ? 
                    <>
                    <Grid item xs={8}>
                      <StartMenu />
                    </Grid>
                    <Grid item xs={2} />
                    </>
                  :
                    <>
                    <Grid item xs={2} />
                    <Grid item xs={8}>
                      <Scoreboard />
                    </Grid>
                    </>
                  }
                  
                </Grid>
              </Item>
            </Grid>

            <Grid item xs={12} sx={{ height: "calc(40vh - 40px)"}}>
              <Item sx={{ height: "100%"}} elevation={0}>
                <Player name={name}/>
              </Item>
            </Grid>
          </Grid>
        ) : (
          <Lobby setRoomCreated={setRoomCreated} />
        )}
        </Paper>
        {roomCreated && <Chat />}
      </Container>
      <GameData />
    </>
  )
}

export default Game;