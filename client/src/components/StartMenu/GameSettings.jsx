import React, { useState } from 'react';

import { TextField, Checkbox, Button, FormControl, FormControlLabel, InputLabel, Select, MenuItem } from "@mui/material";

import { socket } from '../../socket';
// const useStyles = makeStyles((theme) => ({
//   root: {
//     width: '100%',
//   },
//   backButton: {
//     marginRight: theme.spacing(2),
//   },
//   instructions: {
//     marginTop: theme.spacing(1),
//     marginBottom: theme.spacing(1),
//   },
//   actions: {
//     padding: "20px 0",
//   }
// }));

export default function GameSettings({setShowStartGameModal}) {
  const game = sessionStorage.getItem('game');

  const gameType = 'cribbage';
  const [cribSize, setCribSize] = useState(4);
  const [winningScore, setWinningScore] = useState(121);
  const [jokers, setJokers] = useState(false);

  const handleStartGame = e => {
    e.preventDefault();
    if (Number.isInteger(parseInt(winningScore))) {
      socket.emit('start_game', {
        game: game,
        type: gameType,
        winning_score: winningScore,
        crib_size: cribSize,
        jokers: jokers
      });
    }
    setShowStartGameModal(false);
  };

  return (
    <div>
      <div>
        <>
          <TextField
            defaultValue="121"
            id="name"
            onChange={e => setWinningScore(e.target.value)}
            label="Winning score"
          />
          <br /><br />
          <FormControl>
            <InputLabel>
              Cribs
            </InputLabel>
            <Select
              defaultValue="4"
              onChange={e => setCribSize(e.target.value)}
            >
              <MenuItem value={4}>Standard (4 cards)</MenuItem>
              <MenuItem value={5}>Spicy (5 cards)</MenuItem>
              <MenuItem value={6}>Chaotic (6 cards)</MenuItem>
            </Select>
          </FormControl>
          <br /><br />
          <FormControlLabel
            control={
              <Checkbox
                checked={jokers}
                onChange={e => setJokers(e.target.checked)}
                name="checkedB"
                color="primary"
              />
            }
            label="Play with Jokers"
          />
        </>
        <div>
          <Button variant="contained" color="primary" onClick={event => handleStartGame(event)}>Play</Button>
        </div>
      </div>
    </div>
  );
};