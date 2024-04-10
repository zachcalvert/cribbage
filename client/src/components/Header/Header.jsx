import React, {useState} from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';

import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import CancelPresentationIcon from '@mui/icons-material/CancelPresentation';
import StyleIcon from '@mui/icons-material/Style';

import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';

import { socket } from '../../socket';
import { useTheme } from '@mui/material';

export function Header({ toggleColorMode, gameInProgress, setGameInProgress }) {
  const name = sessionStorage.getItem('name');
  const room = sessionStorage.getItem('game');
  const [showLeaveGameModal, setShowLeaveGameModal] = useState(false);
  const theme = useTheme();

  const handleLeave = e => {
    e.preventDefault();
    socket.emit(
      "player_leave", {
        name: sessionStorage.getItem('name'),
        game: sessionStorage.getItem('game')
      }
    );
    sessionStorage.removeItem('name');
    sessionStorage.removeItem('game');
    setShowLeaveGameModal(false);
    setGameInProgress(false);
  };

  return (
    <>
    <AppBar position="static" enableColorOnDark>
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          <StyleIcon sx={{ display: { xs: 'none', md: 'flex' }, mr: 1 }} />
          <Typography
            variant="h6"
            noWrap
            component="a"
            href="#app-bar-with-responsive-menu"
            sx={{
              mr: 2,
              display: { xs: 'none', md: 'flex' },
              fontFamily: 'monospace',
              fontWeight: 700,
              letterSpacing: '.2rem',
              color: 'inherit',
              textDecoration: 'none',
            }}
          >
            {gameInProgress ? `Game: ${room}` : 'Cribbage'}
          </Typography>

          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }} />

          <Box sx={{ flexGrow: 0 }}>
            <Grid container spacing={2}>
              <Grid item xs={2}>
                <IconButton onClick={toggleColorMode} color="inherit">
                  {theme.palette.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
                </IconButton>
              </Grid>
              { gameInProgress && (
                <>
                  <Grid item xs={8} sx={{  marginTop: "8px" }}>
                    {name}
                  </Grid>
                  <Grid item xs={2}>
                  <IconButton className="leave-game" onClick={() => setShowLeaveGameModal(true)} aria-label="leave">
                    <CancelPresentationIcon color="error" sx={{ transform: "scale(2)", marginTop: "0px" }} />
                  </IconButton>
                  </Grid>
                </>
              )}
            </Grid>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
    {showLeaveGameModal && 
      <Dialog open={showLeaveGameModal} onClose={() => setShowLeaveGameModal(false)}>
        <DialogTitle>Leave Game</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-slide-description">
            Are you sure you want to exit this game?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleLeave}>Yes</Button>
        </DialogActions>
      </Dialog>
    }
    </>
  );
}
