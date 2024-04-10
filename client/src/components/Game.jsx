import React, { useState } from 'react';


import { styled } from '@mui/material/styles';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';

import { Chat } from "./Chat/Chat";
import { Header } from './Header/Header';
import { Lobby } from './Lobby';
import { StartMenu } from './StartMenu/StartMenu';

const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: 'center',
  color: theme.palette.text.secondary,
}));

function Game() {
  const [gameInProgress, setGameInProgress] = useState(false);
  const [players, setPlayers] = useState([]);

  return (
    <>
      <Header gameInProgress={gameInProgress} setGameInProgress={setGameInProgress} />
      <Container maxWidth="xl">
        <Box sx={{ my: 4 }}>
        {gameInProgress ? (
          <Grid container spacing={2}>
          <Grid item xs={9} sx={{ height: "calc('85vh-100px')"}}>
            <Item sx={{ height: "100%"}} elevation={3}>
              <StartMenu />
            </Item>
          </Grid>
          <Grid item xs={3} sx={{ height: "100%"}}>
            <Item elevation={3}><Chat /></Item>
          </Grid>
        </Grid>
        ) : (
          <Lobby setGameInProgress={setGameInProgress} />
        )}
        </Box>
      </Container>
    </>
  )
}

export default Game;