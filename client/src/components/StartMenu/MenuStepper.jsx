import React, { useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Stepper from '@material-ui/core/Stepper';
import Step from '@material-ui/core/Step';
import StepLabel from '@material-ui/core/StepLabel';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import {DialogActions, DialogContent, Fab, TextField} from "@material-ui/core";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";
import {useSocket} from "use-socketio";

const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%',
  },
  backButton: {
    marginRight: theme.spacing(1),
  },
  instructions: {
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },
}));

export default function MenuStepper() {
  const classes = useStyles();
  const game = sessionStorage.getItem('game');
  const [activeStep, setActiveStep] = useState(0);

  const [gameType, setGameType] = useState('cribbage')
  const [cribSize, setCribSize] = useState(4);
  const [winningScore, setWinningScore] = useState(121);
  const steps = getSteps();

  const { socket } = useSocket("setup_started");

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
  };

  function getSteps() {
    return ['Select Game', 'Select Settings', 'Confirm'];
  }

  function getStepContent(stepIndex) {

    switch (stepIndex) {
      case 0:
        return (
           <FormControl>
            <InputLabel>
              Game
            </InputLabel>
            <Select
              defaultValue="cribbage"
              onChange={e => setGameType(e.target.value)}
            >
              <MenuItem value="cribbage">Cribbage</MenuItem>
              <MenuItem value="war">War</MenuItem>
            </Select>
          </FormControl>
        );
      case 1:
        return (
            <>
              <TextField
                defaultValue="121"
                id="name"
                onChange={e => setWinningScore(e.target.value)}
                label="Winning score"
              />
              <FormControl><br /><br />
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
          </>
        )
      case 2:
        return (
          <form style={{"width": "100%"}} onSubmit={event => handleStartGame(event)}>
            <Fab variant="extended" type="submit">Start game</Fab>
          </form>
        );
      default:
        return 'Unknown stepIndex';
    }
  }

  const handleStartGame = e => {
    e.preventDefault();
    if (Number.isInteger(parseInt(winningScore))) {
      socket.emit('start_game', {
        game: game,
        type: gameType,
        winning_score: winningScore,
        crib_size: cribSize
      });
    }
  };

  return (
    <div className={classes.root}>
      <Stepper activeStep={activeStep} alternativeLabel>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      <div>
        {activeStep === steps.length ? (
          <div>
            <Typography className={classes.instructions}>All steps completed</Typography>
            <Button onClick={handleReset}>Reset</Button>
          </div>
        ) : (
          <div>
            <Typography className={classes.instructions}>{getStepContent(activeStep)}</Typography>
            <div>
              <Button
                disabled={activeStep === 0}
                onClick={handleBack}
                className={classes.backButton}
              >
                Back
              </Button>
              <Button variant="contained" color="primary" onClick={handleNext}>
                {activeStep === steps.length - 1 ? 'Start game' : 'Next'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}