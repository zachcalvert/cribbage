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
      <Container maxWidth="xl">
        <Box
          sx={{ my: 4 }}
          justifyContent="center"
          alignItems="center"
          minHeight="100vh"
        >
          <Grid container spacing={2} style={{ height: "100%" }}>
          {roomCreated ? (
            <>
              <Grid item xs={12} sx={{ height: "33%"}}>
                <Item sx={{ height: "100%"}} elevation={3}>
                </Item>
              </Grid>
              <Grid item xs={12} sx={{ height: "33%"}}>
                <Item sx={{ height: "100%"}} elevation={3}>
                  <StartMenu />
                </Item>
              </Grid>
              <Grid item xs={12} sx={{ height: "33%"}}>
                <Item sx={{ height: "100%"}} elevation={3}><Chat /></Item>
              </Grid>
              </>
          
          ) : (
            <Grid item xs={12} sx={{ height: "100%"}}>
              <Lobby setRoomCreated={setRoomCreated} />
            </Grid>
          )}
          </Grid>
        </Box>
      </Container>
    </>
  )
}

export default Game;