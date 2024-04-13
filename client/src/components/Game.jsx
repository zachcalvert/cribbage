import React, { useEffect,useState } from 'react';

import { styled } from '@mui/material/styles';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Fab from '@mui/material/Fab';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Snackbar from '@mui/material/Snackbar';
import { useTheme } from '@mui/material';

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

  const InviteLink = () => {
    const [snackbarOpen, setSnackBarOpen] = useState(false);
    const encoded = encodeURI(`https://cribbage.live/?game=${room}`)
    return gameStatus === 'NEW' && (
      <Box>
        <Typography variant="h4">Welcome!</Typography>
        <Typography variant="h6" sx={{ marginBottom: '.5rem', marginTop: '.5rem' }}>Click the Start button now to play against the computer.</Typography>
        {/* <Link color={theme.palette.text.link} sx={{ fontSize: '20px' }} href={encoded}>Invite a friend to play</Link> */}

        <Fab
          color="primary"
          variant="extended"
          onClick={() => setSnackBarOpen(true)}
        >
          Invite a friend to play
        </Fab>
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          message=""
          action={
            <Button color="inherit" size="small">
              Link copied to clipboard
            </Button>
          }
          sx={{ top: { xs: 90, sm: 0 } }}
        />
      
      
      </Box>
    )
  };

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
                    <InviteLink />
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