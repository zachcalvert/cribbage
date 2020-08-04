import React, { useState } from "react";
import ReactDOM from "react-dom";
import PropTypes from 'prop-types';

import {Button, IconButton, Modal} from "@material-ui/core";
import CloseIcon from "@material-ui/icons/Close";
import makeStyles from "@material-ui/core/styles/makeStyles";
import { useSpring, animated } from 'react-spring';

import { StartMenuContext } from "./StartMenuContext";
import './StartMenu.css'
import Backdrop from "@material-ui/core/Backdrop";
import FormControl from "@material-ui/core/FormControl";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";
import TextField from "@material-ui/core/TextField";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Switch from "@material-ui/core/Switch";

const useStyles = makeStyles((theme) => ({
  modal: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paper: {
    backgroundColor: theme.palette.background.paper,
    width: '300px',
    height: '400px',
    border: 'none',
    borderRadius: '10px',
    boxShadow: theme.shadows[5],
    padding: theme.spacing(2, 4, 3)
  },
}));

const Fade = React.forwardRef(function Fade(props, ref) {
  const { in: open, children, onEnter, onExited, ...other } = props;
  const style = useSpring({
    from: { opacity: 0 },
    to: { opacity: open ? 1 : 0 },
    onStart: () => {
      if (open && onEnter) {
        onEnter();
      }
    },
    onRest: () => {
      if (!open && onExited) {
        onExited();
      }
    },
  });

  return (
    <animated.div ref={ref} style={style} {...other}>
      {children}
    </animated.div>
  );
});

Fade.propTypes = {
  children: PropTypes.element,
  in: PropTypes.bool.isRequired,
  onEnter: PropTypes.func,
  onExited: PropTypes.func,
};

const StartMenu = () => {
  const gameName = sessionStorage.getItem('game');
  const classes = useStyles();
  const [game, setGame] = useState('');
  const [winningScore, setWinningScore] = useState(121);
  const [jokers, setJokers] = useState(false);
  let { socket, handleModal, modal } = React.useContext(StartMenuContext);

  const showGameSelect = () => {
    const handleChange = (event) => {
      setGame(event.target.value);
    };

    return !game ? (
      <div className='start-menu'>
        <FormControl className='stepper-form-control'>
          <Select
              labelId="demo-simple-select-label"
              id="demo-simple-select"
              value={game}
              onChange={handleChange}
          >
            <MenuItem value={'cribbage'}>Cribbage</MenuItem>
            <MenuItem value={'pinochle'}>Pinochle</MenuItem>
            <MenuItem value={'thirteen'}>Thirteen</MenuItem>
          </Select>
        </FormControl>
      </div>
    ) : (
      <span />
    )
  };

  const GameSettings = () => {
    const handleWinningScoreSettingChange = (event) => {setWinningScore(event.target.value);};
    const handleJokerSettingChange = (event) => {setJokers(event.target.value);};
    const [state, setState] = useState({
      winningScore: 121,
      jokers: false,
    });

    const handleJokerChange = (event) => {
      setState({ ...state, [event.target.name]: event.target.checked });
    };

    return game ? (
      <div className='start-menu'>
        <form onSubmit={event => handleStart(event)}>
        <p>{ game }</p>
        <FormControl className='stepper-form-control'>
          <Select
            labelId="demo-simple-select-label"
            id="demo-simple-select"
            defaultValue="121"
            value={winningScore}
            onChange={handleWinningScoreSettingChange}>
            <TextField id="standard-basic" label="Winning score" />
          </Select>

         <FormControlLabel
            control={
              <Switch
                checked={state.jokers}
                onChange={handleJokerChange}
                name="jokers"
                color="primary"
              />
            }
            label="Play with Jokers"
          />
        </FormControl>
        <Button color="primary" type="submit">Submit</Button>
        </form>
      </div>
    ) : (
      <span />
    );
  };

  const handleStart = e => {
    e.preventDefault();
    socket.emit('start_game', {game: gameName, winning_score: winningScore, jokers: jokers});
  };

  if (modal) {
    return ReactDOM.createPortal(
      <Modal
        open={true}
        className={classes.modal}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{
          timeout: 500,
        }}
      >
        <Fade in={true}>
          <div className={classes.paper}>
            <div className="row">
              <span class="col-10">
                <h4 id="spring-modal-title">Start a game</h4>
              </span>
              <IconButton className="col-2 close-start-game" onClick={() => handleModal()} aria-label="close-start-menu">
                <CloseIcon fontSize="inherit" />
              </IconButton>
            </div>
            { showGameSelect() }
            <GameSettings />
          </div>
        </Fade>
      </Modal>,
      document.querySelector("#modal-root")
    );
  } else return null;
};

export default StartMenu;