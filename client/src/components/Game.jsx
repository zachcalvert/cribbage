import React, { useState } from "react";
import { useSocket } from "use-socketio";
import { useSpring, animated } from 'react-spring'
import { Button, IconButton, TextField, Paper, Container, makeStyles, Grid, Box } from "@material-ui/core";
import CloseIcon from "@material-ui/icons/Close";

import { Chat } from "./Chat";
import { Player } from "./Player";
import { GameBoard } from "./GameBoard";
import {LobbyDeck} from "./LobbyDeck";

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
    height: '100%'
  },
  paper: {
    padding: theme.spacing(2),
    color: theme.palette.text.secondary,
  },
  lobbyDeck: {
    position: 'absolute',
    top: 0,
    left: 0
  }
}));

export const Game = ()  => {
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [room, setRoom] = useState('');
  const [players, setPlayers] = useState([])
  const fadeIn = useSpring({opacity: 1, from: {opacity: 0}});
  const classes = useStyles();

  const {socket} = useSocket("attendance_change", change =>
    (change.type === 'join') ? (
      setPlayers([...players, change.name])
    ) : (
      setPlayers(players.filter(player => player !== change.name))
    )
  );

  const handleJoin = e => {
    e.preventDefault();
    if (!name) {
      return alert("Name can't be empty");
    }
    setId(name);
    sessionStorage.setItem('name', name);
    sessionStorage.setItem('game', room);
    socket.emit("player_join", {name: name, game: room});
  };

  const handleLeave = e => {
    e.preventDefault();
    sessionStorage.removeItem('name');
    sessionStorage.removeItem('game');
    socket.emit("player_leave", {name: name, game: room});
    setId('');
  };

  return id ? (
    <Container maxWidth="lg">
      <animated.div style={fadeIn} className={classes.root}>
        <Grid container spacing={2}>

          <Grid item xs={4}>
            <Paper className={`game-log ${classes.paper}`}>
              <Chat />
            </Paper>
          </Grid>

          <Grid item xs={8}>
            <Box height="65%">
              <GameBoard game={room}/>
              <IconButton className="leave-game" onClick={handleLeave} aria-label="leave">
                <CloseIcon fontSize="inherit" />
              </IconButton>
            </Box>
            <Box height="35%">
              <Player name={name}/>
            </Box>
          </Grid>

        </Grid>
      </animated.div>
    </Container>
  ) : (
    <div style={{ textAlign: 'center', height: '100%', display: 'inline-block' }}>
      <div className={classes.lobbyDeck}>
      <LobbyDeck/>
      </div>
      <form style={{ marginTop: '150px', marginLeft: '75px' }} onSubmit={event => handleJoin(event)}>
        <TextField id="name" onChange={e => setName(e.target.value.trim())} label="name" /><br />
        <TextField id="room" onChange={e => setRoom(e.target.value.trim())} label="game" /><br />
        <Button color="primary" type="submit">Submit</Button>
      </form>
    </div>
  );
};