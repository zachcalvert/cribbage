import React from 'react';
import { useSocket } from "use-socketio";

import { makeStyles } from '@material-ui/core/styles';
import { Button, createMuiTheme, CssBaseline, Dialog, DialogActions, DialogContent, DialogTitle, Drawer, Hidden, ThemeProvider } from '@material-ui/core';
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
import ForumIcon from '@material-ui/icons/Forum';
import RefreshIcon from '@material-ui/icons/Refresh';
import NightsStayRoundedIcon from '@material-ui/icons/NightsStayRounded';
import WbSunnyRoundedIcon from '@material-ui/icons/WbSunnyRounded';
import Slide from '@material-ui/core/Slide';
import TextField from '@material-ui/core/TextField';

import { AntSwitch } from "../AntSwitch/AntSwitch";
import { HelpScreen } from "../HelpScreen/HelpScreen";
import { ChatLog } from '../Chat/ChatLog';
import { Deck } from "../Deck/Deck";
import { InviteMessage } from '../InviteMessage/InviteMessage';
import { Opponent } from "../Opponent/Opponent";
import { Player } from "../Player/Player";
import { Scoreboard } from "../Scoreboard/Scoreboard";
import { StartMenu } from "../StartMenu/StartMenu";

const randomWords = require('random-words');

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    height: '100%',
    width: '100%'
  },
  appBar: {
    position: 'relative',
    background: '#4E78A0',
    zIndex: theme.zIndex.drawer + 1,
  },
  closeModal: {
    position: 'absolute',
    top: 0,
    right: 0
  },
  darkModeToggle: {
    margin: theme.spacing(2)
  },
  drawer: {
    width: 400,
    flexShrink: 0,
    [theme.breakpoints.down('sm')]: {
      width: 'calc(100vw - 75px)',
    }
  },
  drawerContainer: {
    overflow: 'auto',
  },
  drawerButton: {
    outline: 'none'
  },
  form: {
    margin: 'auto',
    textAlign: 'center'
  },
  formField: {
    margin: theme.spacing(2),
    width: '35ch'
  },
  content: {
    flexGrow: 1,
    padding: theme.spacing(3),
    margin: 0,
    position: 'relative',
    left: '400px',
    width: 'calc(100vw - 400px)',
    [theme.breakpoints.down('sm')]: {
      left: 0,
      width: '100%',
      padding: theme.spacing(1)
    }
  },
  deck: {
    marginLeft: '-30px',
    marginTop: '5px'
  },
  opponents: {
    height: '25%',
    display: 'inline-flex',
    textAlign: 'center',
    width: '100%'
  },
  title: {
    marginLeft: theme.spacing(2),
    flex: 1,
    textAlign: 'left',
  },
  toolbar: theme.mixins.toolbar,
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
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const theme = createMuiTheme({
    palette: {
      type: prefersDarkMode ? 'dark' : 'light',
    }
  });

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawer = (
    <div>
      <div className={classes.toolbar} />
      <ChatLog />
    </div>
  );

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
    socket.emit("player_leave", {name: localStorage.getItem('cribbage-live-name'), game: localStorage.getItem('cribbage-live-game')});
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
    } else if (localStorage.getItem('cribbage-live-game') && localStorage.getItem('cribbage-live-name')) {
      setName(localStorage.getItem('cribbage-live-name'));
      setRoom(localStorage.getItem('cribbage-live-game'));
      setGameOpen(true);
      setInProgress(true);
      socket.emit("player_refresh", {name: name, game: room});
    }
  }, [room]);

  const renderOpponents = () => {
    return inProgress || opponents.length ? (
      <div className={classes.opponents}>
        {opponents.map(name => (
          <div key={name} className={`opponent opponent-${name}`}>
            <Opponent name={name} />
          </div>
        ))}
      </div>
    ) : (
      <InviteMessage room={room} />
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
          <AppBar position='fixed' className={classes.appBar}>
            <Toolbar>
              <Hidden mdUp>
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={handleDrawerToggle}
                className={classes.drawerButton}
              >
                <ForumIcon />
              </IconButton>
              </Hidden>
              <Typography variant="h6" className={classes.title}>
                {room}
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

              <Hidden smDown>
                <IconButton color='inherit' style={{"outline": "none"}} onClick={e => setHelpOpen(true)} aria-label="help">
                  <HelpOutlineRoundedIcon fontSize="inherit" />
                </IconButton>
              </Hidden>
              <IconButton edge="end" color="inherit" onClick={e => setLeaveGameOpen(true)} aria-label="close">
                <CloseIcon />
              </IconButton>
            </Toolbar>
          </AppBar>
          
          <nav className={classes.drawer}>
            <Hidden mdDown implementation="css">
              <Drawer
                variant="temporary"
                anchor='left'
                open={mobileOpen}
                onClose={handleDrawerToggle}
                ModalProps={{
                  keepMounted: true, // Better open performance on mobile.
                }}
              >
                {drawer}
              </Drawer>
            </Hidden>
            <Hidden smDown implementation="css">
              <Drawer
                classes={{
                  paper: classes.drawerPaper,
                }}
                variant="permanent"
                open
              >
                {drawer}
              </Drawer>
            </Hidden>
          </nav>
          <main className={classes.content}>
            {/* <div className={classes.toolbar} /> */}
            { renderOpponents() }
            <div className='row'>
              { inProgress ? (
                <div className='col-9'>
                  <Scoreboard />
                </div>) : (<StartMenu />) }
              <div className={`${classes.deck} col-3`}>
                <Deck />
              </div>
            </div>
            <Player name={ name }/>
          </main>

        </Dialog>
      </Grid>
    </ThemeProvider>
  );
}