import React, { useEffect,useState } from 'react';

import { styled } from '@mui/material/styles';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';

import { Chat } from './Chat/Chat';
import { Deck } from './Deck/Deck';
import { Header } from './Header/Header';
import { Lobby } from './Lobby';
import { Opponent } from './Opponent/Opponent';
import { Scoreboard } from './Scoreboard/Scoreboard'
import { StartMenu } from './StartMenu/StartMenu';

import { socket } from '../socket';

const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: 'center',
  color: theme.palette.text.secondary,
}));

function Game() {
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
    const encoded = encodeURI(`https://cribbage.live/?game=${room}`)
    return gameStatus === 'NEW' ? (
      <div className="jumbotron">
        <p className="display-4">Welcome!</p>
        <p>Invite others to this game by sharing the below link:</p>
        <a href={encoded}>{encoded}</a>
        <hr></hr>
        <p>Or, click the Start button to play against the computer.</p>
      </div>
    ) : ( <span /> )
  };

  return (
    <>
      <Header roomCreated={roomCreated} setRoomCreated={setRoomCreated} />
      <Container maxWidth={false}>
      <Box sx={{ my: 4 }}>
        {roomCreated ? (
          <Grid container spacing={2}>
            <Grid item xs={12} sx={{ height: "calc(33vh - 40px)"}}>
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
            <Grid item xs={12} sx={{ height: "calc(33vh - 40px)"}}>
              <Item sx={{ height: "100%"}} elevation={1}>
                <div className="scoreboard col-8">
                  { gameStatus === 'NEW' ? <StartMenu /> : <Scoreboard /> }
                </div>
                <div className="col-1 middle-row-spacer"></div>
                <div className="deck col-2">
                  <Deck />
                </div>
              </Item>
            </Grid>
            <Grid item xs={12} sx={{ height: "calc(33vh - 40px)"}}>
              <Item sx={{ height: "100%"}} elevation={0}>
              </Item>
            </Grid>
          </Grid>
        ) : (
          <Lobby setRoomCreated={setRoomCreated} />
        )}
        </Box>
        {roomCreated && <Chat />}
      </Container>
    </>
  )
}

export default Game;