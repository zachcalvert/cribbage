import React, { useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import { TextField, Checkbox } from "@material-ui/core";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";
import { useSocket } from "use-socketio";
import FormControlLabel from "@material-ui/core/FormControlLabel";

const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%',
  },
  backButton: {
    marginRight: theme.spacing(2),
  },
  instructions: {
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },
  actions: {
    padding: "20px 0",
  }
}));

export default function GameSettings() {
  const classes = useStyles();
  const game = sessionStorage.getItem('game');

  const gameType = 'cribbage';
  const [cribSize, setCribSize] = useState(4);
  const [winningScore, setWinningScore] = useState(121);
  const [jokers, setJokers] = useState(false);

  const { socket } = useSocket("setup_started");

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
  };

  return (
    <div className={classes.root}>
      <div className={classes.instructions}>
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
                disabled={true}
              />
            }
            label="Play with Jokers"
          />
        </>
        <div className={classes.actions}>
          <Button variant="contained" color="primary" onClick={event => handleStartGame(event)}>Play</Button>
        </div>
      </div>
    </div>
  );
};