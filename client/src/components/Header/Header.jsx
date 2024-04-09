import React, {useState} from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';

import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import StyleIcon from '@mui/icons-material/Style';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';

import { socket } from '../../socket';

function Header({ isConnected, gameInProgress, setGameInProgress, name, room, setRoom }) {
  const [showLeaveGameModal, setShowLeaveGameModal] = useState(false);

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
            Cribbage
          </Typography>

          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }} />

          <Box sx={{ flexGrow: 0 }}>
            { gameInProgress && (
              <Grid container spacing={1}>
                <Grid>
                  <Typography>game name: {room}</Typography>
                  <Typography>username: {name}</Typography>
                </Grid>
                <Grid>
                <IconButton className="leave-game" onClick={() => setShowLeaveGameModal(true)} aria-label="leave">
                  <CloseOutlinedIcon fontSize="32" color="error" />
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
export default Header;
