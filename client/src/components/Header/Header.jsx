import React, {useState} from 'react';

import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';

import CancelPresentationRoundedIcon from '@mui/icons-material/CancelPresentationRounded';
import StyleIcon from '@mui/icons-material/Style';
import Brightness4Icon from '@mui/icons-material/Brightness4';

import { socket } from '../../socket';

export function Header({ darkMode, handleDarkMode, roomCreated, setRoomCreated }) {
  const [showLeaveGameModal, setShowLeaveGameModal] = useState(false);

  const name = sessionStorage.getItem('name');
  const room = sessionStorage.getItem('room');

  const handleLeave = e => {
    e.preventDefault();
    socket.emit(
      "player_leave", {
        name: sessionStorage.getItem('name'),
        game: sessionStorage.getItem('room')
      }
    );
    sessionStorage.removeItem('name');
    sessionStorage.removeItem('room');
    setShowLeaveGameModal(false);
    setRoomCreated(false);
  };

  return (
    <>
    <AppBar position="static" enableColorOnDark>
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          <StyleIcon sx={{ display: { xs: 'none', md: 'flex', marginRight: '1rem' } }} />
          <Typography
            variant="h6"
            noWrap
            sx={{
              mr: 2,
              display: { xs: 'none', md: 'flex' },
              fontWeight: 700,
              letterSpacing: '.2rem',
              color: 'inherit',
              textDecoration: 'none',
            }}
          >
            {roomCreated ? ` Cribbage: ${room}` : 'Cribbage'}
          </Typography>

          <Box sx={{ flexGrow: 1 }} />

          <Box sx={{ flexGrow: 0, marginRight: "2rem" }}>
            { roomCreated && (
              <Grid container spacing={2}>
                <Grid item xs={7} sx={{  marginTop: "4px" }}>
                  <Typography variant="h6">Welcome, {name}</Typography>
                </Grid>
                <Grid item xs={2}>
                  <IconButton onClick={handleDarkMode} style={{borderRadius: 0}}>
                    {darkMode ? 
                      <Brightness4Icon sx={{ color: "#eceff1", transform: "scale(1.7)", marginTop: "0px", marginRight: '6px' }} /> :
                      <Brightness4Icon sx={{ color: "#fff9c4", transform: "scale(1.7)", marginTop: "0px", marginRight: '6px' }} />}
                  </IconButton>
                </Grid>
                <Grid item xs={1}></Grid>
                <Grid item xs={2}>
                  <IconButton className="leave-game" onClick={() => setShowLeaveGameModal(true)} aria-label="leave">
                    <CancelPresentationRoundedIcon sx={{ color: "#f44336", transform: "scale(1.9)", marginTop: "0px" }} />
                  </IconButton>
                </Grid>
              </Grid>
            )}
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
