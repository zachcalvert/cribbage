import React from 'react';
import { useSocket } from "use-socketio";

import { makeStyles } from '@material-ui/core/styles';
import { Box, Button, createMuiTheme, CssBaseline, Dialog, DialogActions, DialogContent, DialogTitle, Hidden, ThemeProvider } from '@material-ui/core';
import Fab from '@material-ui/core/Fab';
import Grid from '@material-ui/core/Grid';
import InputAdornment from '@material-ui/core/InputAdornment';
import Link from '@material-ui/core/Link';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import HelpOutlineRoundedIcon from '@material-ui/icons/HelpOutlineRounded';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import CloseIcon from '@material-ui/icons/Close';
import RefreshIcon from '@material-ui/icons/Refresh';
import NightsStayRoundedIcon from '@material-ui/icons/NightsStayRounded';
import WbSunnyRoundedIcon from '@material-ui/icons/WbSunnyRounded';
import Slide from '@material-ui/core/Slide';
import TextField from '@material-ui/core/TextField';

import { AntSwitch } from "../AntSwitch/AntSwitch";
import { HelpScreen } from "../HelpScreen/HelpScreen";
import { ChatLog } from '../Chat/ChatLog';
import { Deck } from "../Deck/Deck";
import { InviteLink } from '../InviteMessage/InviteMessage';
import { Opponent } from "../Opponent/Opponent";
import { Player } from "../Player/Player";
import { Scoreboard } from "../Scoreboard/Scoreboard";
import { StartMenu } from "../StartMenu/StartMenu";

const randomWords = require('random-words');

const useStyles = makeStyles((theme) => ({
  root: {
    height: '100%',
    width: '100%'
  },
  appBar: {
    position: 'relative',
    background: '#4E78A0',
  },
  closeModal: {
    position: 'absolute',
    top: 0,
    right: 0
  },
  darkModeToggle: {
    margin: theme.spacing(2)
  },
  form: {
    margin: 'auto',
    textAlign: 'center'
  },
  formField: {
    margin: theme.spacing(2),
    width: '35ch'
  },
  game: {
    height: '100%'
  },
  title: {
    marginLeft: theme.spacing(2),
    flex: 1,
    textAlign: 'left',
  },
  toolbarButton: {
    outline: 'none'
  }
}));

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export const Game = ()  => {
  const classes = useStyles();
  const [gameOpen, setGameOpen] = React.useState(false);
  const [leaveGameOpen, setLeaveGameOpen] = React.useState(false);
  const [helpOpen, setHelpOpen] = React.useState(false);
  const [inviteOpen, setInviteOpen] = React.useState(false);
  const [name, setName] = React.useState('');
  const [room, setRoom] = React.useState(randomWords({ exactly: 3, join: '-' }));
  const [opponents, setOpponents] = React.useState([]);
  const [inProgress, setInProgress] = React.useState(false);
  const [prefersDarkMode, setPrefersDarkMode] = React.useState(localStorage.getItem('dark-mode') === 'true');
  const theme = createMuiTheme({
    palette: {
      type: prefersDarkMode ? 'dark' : 'light',
    }
  });

  const handleDarkModeChange = () => {
    setPrefersDarkMode(!prefersDarkMode);
    localStorage.setItem('dark-mode', !prefersDarkMode)
  }

  const { socket } = useSocket("players", msg => {
    setOpponents(msg.players.filter(player => player !== name))
  });

  useSocket("game_begun", msg => {
    setInProgress(true);
  });

  const handleGameNameRefresh = React.useCallback((event) => setRoom(randomWords({ exactly: 3, join: '-' })), []);

  const handleJoin = e => {
    e.preventDefault();
    if ((!name) || (!room)) { return alert("Please provide both your name and a game name.")}
    localStorage.setItem('cribbage-live-name', name);
    localStorage.setItem('cribbage-live-game', room);
    socket.emit("player_join", {name: name, game: room});
    setGameOpen(true);
  };

  const handleLeaveGame = () => {
    socket.emit("player_leave", {name: localStorage.getItem('name'), game: localStorage.getItem('game')});
    localStorage.removeItem('cribbage-live-name');
    localStorage.removeItem('cribbage-live-game');
    setInProgress(false);
    setRoom(randomWords({ exactly: 3, join: '-' }));
    setLeaveGameOpen(false);
    setGameOpen(false);
  };

  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const gameName = urlParams.get('game');
    if (gameName && !name) {
      setRoom(gameName);
      setInviteOpen(true);
    } else if (localStorage.getItem('game') && localStorage.getItem('name')) {
      setName(localStorage.getItem('name'));
      setRoom(localStorage.getItem('game'));
      setInProgress(true);
      socket.emit("player_refresh", {name: name, game: room});
    }
  }, [room]);

  const renderOpponents = () => {
    return inProgress || opponents.length ? (
      <>
        {opponents.map(name => (
          <div key={name} className={`opponent opponent-${name}`}>
            <Opponent name={name} />
          </div>
        ))}
      </>
    ) : (
      <InviteLink />
    );
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Grid container className={classes.root} spacing={2}>
        <form className={classes.form} onSubmit={event => handleJoin(event)}>
          <TextField
              id="name"
              className={classes.formField}
              label="your name"
              autoFocus={true}
              variant='outlined'
              onChange={e => setName(e.target.value.trim())}  /><br />
          <TextField
            id="room"
            className={classes.formField}
            onChange={e => setRoom(e.target.value.trim())}
            label="game name"
            value={room}
            variant='outlined'
            InputProps={{ endAdornment: 
              <InputAdornment position="end">
                <IconButton
                  aria-label="generate-random-game-name"
                  onClick={e => handleGameNameRefresh(e)}
                  style={{"outline": "none"}}
                >
                  <RefreshIcon />
                </IconButton>
              </InputAdornment>
            }}/><br/>
          <Fab className={classes.playButton} variant="extended" color="primary" type="submit">
            Play
          </Fab>
          <Typography className='webmaster-info' variant='caption'>
            <Link href="https://github.com/zachcalvert/cribbage">Github</Link>
          </Typography>
        </form>

        <Dialog open={leaveGameOpen} TransitionComponent={Transition}>
          <DialogTitle>
            Are you sure you want to leave?
          </DialogTitle>
          <DialogContent>
            <Button variant='contained' color='primary' onClick={e => setLeaveGameOpen(false)}>Stay</Button>
            <Button variant='contained' color='secondary' onClick={handleLeaveGame}>Leave</Button>
          </DialogContent>
        </Dialog>

        <Dialog className="help-modal" open={helpOpen}>
          <DialogTitle>
            Help
          </DialogTitle>
          <DialogContent>
            <IconButton className={classes.closeModal} onClick={e => setHelpOpen(false)} aria-label="close">
              <CloseIcon fontSize="inherit" />
            </IconButton>
            <HelpScreen />
          </DialogContent>
        </Dialog>

        <Dialog className="invite-modal" open={inviteOpen} onExited={false} onClose={false}>
          <DialogTitle>
            Welcome!
          </DialogTitle>
          <DialogContent>
            <span>You've been invited you to join a game. Enter your nickname below to play!</span>
            <br /><br />
            <TextField
              label="your name"
              onChange={e => setName(e.target.value.trim())}  /><br /><br />
            <TextField
              label="game name"
              value={room}
              disabled={true}  />
          </DialogContent>
          <DialogActions>
            <Button color='primary' onClick={handleJoin}>Play</Button>
          </DialogActions>
        </Dialog>

        <Dialog className={classes.game} fullScreen open={gameOpen} TransitionComponent={Transition}>
          <AppBar className={classes.appBar}>
            <Toolbar>
              <Typography variant="h6" className={classes.title}>
                { room }
              </Typography>
              <Typography className={classes.darkModeToggle} component="div">
                <Grid component="label" container alignItems="center" spacing={1}>
                  <Grid item><NightsStayRoundedIcon /></Grid>
                  <Grid item>
                    <AntSwitch checked={prefersDarkMode} onChange={handleDarkModeChange} name="darkModeSwitch" />
                  </Grid>
                  <Grid item><WbSunnyRoundedIcon /></Grid>
                </Grid>
              </Typography>

              <IconButton color='inherit' style={{"outline": "none"}} onClick={e => setHelpOpen(true)} aria-label="help">
                <HelpOutlineRoundedIcon fontSize="inherit" />
              </IconButton>
              <IconButton edge="end" color="inherit" onClick={e => setLeaveGameOpen(true)} aria-label="close">
                <CloseIcon />
              </IconButton>
            </Toolbar>
          </AppBar>
          
          {/* <Hidden smDown> */}
          <ChatLog prefersDarkMode={prefersDarkMode} />
          {/* </Hidden> */}
        </Dialog>
      </Grid>
    </ThemeProvider>
  );
}