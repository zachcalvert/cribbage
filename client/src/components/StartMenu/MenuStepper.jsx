import React, { useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Stepper from '@material-ui/core/Stepper';
import Step from '@material-ui/core/Step';
import StepLabel from '@material-ui/core/StepLabel';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import { TextField } from "@material-ui/core";
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

export default function MenuStepper() {
  const classes = useStyles();
  const game = sessionStorage.getItem('game');
  const [activeStep, setActiveStep] = useState(0);

  const [gameType, setGameType] = useState('cribbage');
  const [cribSize, setCribSize] = useState(4);
  const [winningScore, setWinningScore] = useState(121);
  const [deck, setDeck] = useState('standard');

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
    return ['Game', 'Settings'];
  }

  function getStepContent(stepIndex, gameType) {

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
              <MenuItem value="war">War (coming soon)</MenuItem>
            </Select>
          </FormControl>
        );
      case 1:
        switch (gameType) {
          case 'cribbage':
            return (
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
            </>
          );
          case 'war':
            return (
              <>
                <FormControl>
                <InputLabel>
                  Deck
                </InputLabel>
                <Select
                  defaultValue="standard"
                  onChange={e => setDeck(e.target.value)}
                >
                  <MenuItem value="standard">Standard</MenuItem>
                  <MenuItem value="pinochle">Pinochle</MenuItem>
                </Select>
              </FormControl>
            </>
          );
          default:
            return 'Unknown game type'
        }

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
        crib_size: cribSize,
        deck: deck
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
        {activeStep === steps.length - 1 ? (
          <div>
            <div className={classes.instructions}>{getStepContent(activeStep, gameType)}</div>
            <div className={classes.actions}>
              <Button onClick={handleReset}>Reset</Button>
              <Button variant="contained" color="primary" onClick={event => handleStartGame(event)}>Play</Button>
            </div>
          </div>
        ) : (
          <div>
            <div className={classes.instructions}>{getStepContent(activeStep, gameType)}</div>
            <div className={classes.actions}>
              <Button
                disabled={activeStep === 0}
                onClick={handleBack}
                className={classes.backButton}
              >
                Back
              </Button>
              <Button variant="contained" color="primary" onClick={handleNext}>Next</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}