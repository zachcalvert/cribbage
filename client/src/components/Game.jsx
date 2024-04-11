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
  const [roomCreated, setRoomCreated] = useState(false);
  const [players, setPlayers] = useState([]);

  return (
    <>
      <Header roomCreated={roomCreated} setRoomCreated={setRoomCreated} />
      <Container maxWidth={false}>
      <Box sx={{ my: 4 }}>
        {roomCreated ? (
          <Grid container spacing={2}>
            <Grid item xs={12} sx={{ height: "calc(33vh - 40px)"}}>
              <Item sx={{ height: "100%"}} elevation={0}>
              </Item>
            </Grid>
            <Grid item xs={12} sx={{ height: "calc(33vh - 40px)"}}>
              <Item sx={{ height: "100%"}} elevation={0}>
                <StartMenu />
              </Item>
            </Grid>
            <Grid item xs={12} sx={{ height: "calc(33vh - 40px)"}}>
              <Item sx={{ height: "100%"}} elevation={1}>
                <Chat />
              </Item>
            </Grid>
          </Grid>
        ) : (
          <Lobby setRoomCreated={setRoomCreated} />
        )}
        </Box>
      </Container>
    </>
  )
}

export default Game;