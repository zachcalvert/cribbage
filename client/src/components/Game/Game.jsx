import React from 'react';
import { ReactSVG } from 'react-svg'
import { useSocket } from "use-socketio";

import { makeStyles } from '@material-ui/core/styles';
import { Button, createMuiTheme, CssBaseline, Dialog, DialogActions, DialogContent, DialogTitle, Divider, Drawer, Hidden, Paper, Slide, Snackbar, ThemeProvider } from '@material-ui/core';
import Grid from '@material-ui/core/Grid';
import InputAdornment from '@material-ui/core/InputAdornment';
import Link from '@material-ui/core/Link';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import MoreVertIcon from '@material-ui/icons/MoreVert';import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';

import CloseIcon from '@material-ui/icons/Close';
import ForumIcon from '@material-ui/icons/Forum';
import RefreshIcon from '@material-ui/icons/Refresh';
import Brightness4Icon from '@material-ui/icons/Brightness4';
import TextField from '@material-ui/core/TextField';
import ToggleButton from '@material-ui/lab/ToggleButton';
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';

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
    width: '100%',
  },
  appBar: {
    position: 'relative',
    background: '#00695f',
    zIndex: theme.zIndex.drawer + 1,
  },
  appBarButton: {
    outline: 'none',
    margin: theme.spacing(1),
    marginRight: 0,
    padding: theme.spacing(1),
    paddingRight: 0
  },
  chatHeader: {
    margin: 'auto',
    marginLeft: theme.spacing(2),
    padding: theme.spacing(2)
  },
  closeModal: {
    position: 'absolute',
    top: 0,
    right: '10px'
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
    textAlign: 'center',
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
  gameTable: {
    height: '30%',
    borderRadius: '10px',
    margin: theme.spacing(3),
    [theme.breakpoints.down('sm')]: {
      margin: theme.spacing(1),
    }
  },
  opponents: {
    height: '25%',
    display: 'inline-flex',
    textAlign: 'center',
    width: '100%'
  },
  pageTitle: {
    marginBottom: theme.spacing(2),
    opacity: '50%'
  },
  playButton: {
    margin: theme.spacing(2),
    background: '#009688',
    color: 'white'
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
  const [pattern, setPattern] = React.useState(localStorage.getItem('card-pattern') || 'wide_red_stripes');
  const [snackBarOpen, setSnackBarOpen] = React.useState(false);
  const [latestMessage, setLatestMessage] = React.useState(null);

  const theme = createMuiTheme({
    palette: {
      type: prefersDarkMode ? 'dark' : 'light',
      primary: {
        light: '#33877f',
        main: '#00695f',
        dark: '#004942',
        contrastText: '#fff',
      },
      secondary: {
        light: '#bb3363',
        main: '#ab003c',
        dark: '#77002a',
        contrastText: '#fff',
      },
    },
  });

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawer = (
    <div>
      <div className={classes.toolbar}>
        <Typography variant='h6' className={classes.chatHeader}>{room} chat</Typography></div>
        <Divider variant='middle' />
      <ChatLog />
    </div>
  );

  const handleDarkModeChange = () => {
    setPrefersDarkMode(!prefersDarkMode);
    localStorage.setItem('dark-mode', !prefersDarkMode)
  }

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackBarOpen(false);
  };

  const { socket } = useSocket("players", msg => {
    setOpponents(msg.players.filter(player => player !== name))
  });

  useSocket("game_begun", msg => {
    setInProgress(true);
  });

  useSocket("draw_board", msg => {
    setInProgress(true);
  });

  useSocket("chat", newMessage => {
    setLatestMessage(null);
    setLatestMessage(newMessage);
    setSnackBarOpen(true);
  });

  function TransitionDown(props) {
    return <Slide {...props} direction="up" />;
  }

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

  const handlePattern = (event, newPattern) => {
    setPattern(newPattern)
    socket.emit('pattern_selected', {game: room, pattern: newPattern})
    localStorage.setItem('card-pattern', newPattern);
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
          <Typography className={classes.pageTitle}>cribbage. live.</Typography>

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
          <Button className={classes.playButton} variant="contained" type="submit">
            Play
          </Button>
          <Typography className='webmaster-info' variant='caption'>
            <Link href="https://github.com/zachcalvert/cribbage">Github</Link>
          </Typography>
        </form>

        <Dialog open={leaveGameOpen} TransitionComponent={Transition}>
          <DialogTitle>
            Are you sure you want to leave?
          </DialogTitle>
          <DialogContent style={{ display: 'inline-flex', padding: '24px' }}>
            <Button style={{ margin: 'auto' }} variant='contained' color='secondary' onClick={handleLeaveGame}>Leave</Button>
            <Button style={{ margin: 'auto' }} variant='contained' color='primary' onClick={e => setLeaveGameOpen(false)}>Stay</Button>
          </DialogContent>
        </Dialog>

        <Dialog className="help-modal" open={helpOpen}>
          <DialogTitle style={{textAlign: "center"}}>
            Settings
          </DialogTitle>
          <DialogContent>
            <IconButton className={`${classes.closeModal} ${classes.appBarButton}`} onClick={e => setHelpOpen(false)} aria-label="close">
              <CloseIcon fontSize="inherit" />
            </IconButton>
            <Typography variant='subtitle2'>Card Pattern</Typography>
            <ToggleButtonGroup
              value={pattern}
              exclusive
              onChange={handlePattern}
              aria-label="pattern-selector">
              <ToggleButton value="wide_red_stripes" aria-label="centered">
                <ReactSVG
                  wrapper='span'
                  src='/cards/wide_red_stripes.svg'
                  className='card-pattern'
                />
              </ToggleButton>
              <ToggleButton value="wide_blue_stripes" aria-label="centered">
                <ReactSVG
                  wrapper='span'
                  src='/cards/wide_blue_stripes.svg'
                  className='card-pattern'
                />
              </ToggleButton>
              <ToggleButton value="thin_red_stripes" aria-label="centered">
                <ReactSVG
                  wrapper='span'
                  src='/cards/thin_red_stripes.svg'
                  className='card-pattern'
                />
              </ToggleButton>
              <ToggleButton value="thin_blue_stripes" aria-label="centered">
                <ReactSVG
                  wrapper='span'
                  src='/cards/thin_blue_stripes.svg'
                  className='card-pattern'
                />
              </ToggleButton>
              <ToggleButton value="dark_blue" aria-label="right aligned">
                <ReactSVG
                  wrapper='span'
                  src='/cards/dark_blue.svg'
                  className='card-pattern'
                />
              </ToggleButton>
              <ToggleButton value="dark_red" aria-label="right aligned">
                <ReactSVG
                  wrapper='span'
                  src='/cards/dark_red.svg'
                  className='card-pattern'
                />
              </ToggleButton>
            </ToggleButtonGroup>
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
            <Button className={classes.playButton} onClick={handleJoin}>Play</Button>
          </DialogActions>
        </Dialog>

        <Dialog className={classes.game} fullScreen open={gameOpen} TransitionComponent={Transition}>
          <AppBar position='fixed' className={classes.appBar}>
            <Toolbar>
              <IconButton edge="end" color="inherit" onClick={e => setLeaveGameOpen(true)} aria-label="close">
                <CloseIcon />
              </IconButton>
              <Typography variant="h6" className={classes.title}>
                {room}
              </Typography>
              
              <IconButton style={{"outline": "none"}} edge="end" color="inherit" onClick={handleDarkModeChange} aria-label="dark-mode-toggle">
                <Brightness4Icon style={{"fill": prefersDarkMode ? "#ffeb3b" : ""}} />
              </IconButton>

              <Hidden mdUp>
                <IconButton
                  color="inherit"
                  aria-label="open drawer"
                  edge="start"
                  onClick={handleDrawerToggle}
                  className={classes.appBarButton}
                  style={{"outline": "none"}}
                >
                  <ForumIcon />
                </IconButton>
              </Hidden>

              <IconButton
                color='inherit'
                className={classes.appBarButton}
                onClick={e => setHelpOpen(true)}
                aria-label="help">
                <MoreVertIcon fontSize="inherit" />
              </IconButton>
            </Toolbar>
          </AppBar>
          
          <nav className={classes.drawer}>
            <Hidden mdDown implementation="css">
              <Drawer
                variant="temporary"
                anchor='right'
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
          <main className={classes.content} style={{"background": prefersDarkMode ? "#323232" : "#eeeeee"}}>
            { renderOpponents() }
            { inProgress ? (
              <Paper className={`row ${classes.gameTable}`} style={{"background": prefersDarkMode ? "#424242" : "#f5f5f5"}}>
                <div style={{ margin: 'auto' }} className='col-8'>
                  <Scoreboard />
                </div>
                <div className={`${classes.deck} col-4`}>
                  <Deck pattern={pattern} />
                </div>
              </Paper>
            ) : (
              <StartMenu />
            )}
            <Player name={name} />
          </main>

        </Dialog>
        <Hidden mdUp>
          {latestMessage && latestMessage.name !== name && <Snackbar
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            open={snackBarOpen}
            onClose={handleSnackbarClose}
            autoHideDuration={5000}
            TransitionComponent={TransitionDown}
            message={latestMessage.name === 'game-updater' ? `${latestMessage.message}`: `${latestMessage.name}: ${latestMessage.message}`}
            classes={classes.snackBarMessage}
            key='latest-message'
            action={
              <IconButton size="small" aria-label="close" color="inherit" onClick={handleSnackbarClose}>
                <CloseIcon fontSize="small" />
              </IconButton>
            } />
          }
        </Hidden>
      </Grid>
    </ThemeProvider>
  );
}