import React, { useState } from "react";
import ReactDOM from "react-dom";
import PropTypes from 'prop-types';

import {IconButton, Modal} from "@material-ui/core";
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

const useStyles = makeStyles((theme) => ({
  modal: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paper: {
    backgroundColor: theme.palette.background.paper,
    border: '2px solid #000',
    boxShadow: theme.shadows[5],
    padding: theme.spacing(2, 4, 3),
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
  const classes = useStyles();
  const [game, setGame] = useState('');
  const [winningScore, setWinningScore] = useState(121);
  const [jokers, setJokers] = useState(false);
  let { modalContent, handleModal, modal } = React.useContext(StartMenuContext);

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

  const showGameSettings = () => {

    const handleWinningScoreSettingChange = (event) => {
      setWinningScore(event.target.value);
    };

    const handleJokerSettingChange = (event) => {
      setJokers(event.target.value);
    };

    return game ? (
      <div className='start-menu'>
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
          <Select
            labelId="demo-simple-select-label"
            id="demo-simple-select"
            value={jokers}
            onChange={handleJokerSettingChange}>
            <MenuItem value={false}>No jokers</MenuItem>
            <MenuItem value={true}>Play with jokers</MenuItem>
          </Select>
        </FormControl>
      </div>
    ) : (
      <span />
    );
  };

  if (modal) {
    return ReactDOM.createPortal(
      <Modal open={true}
             className={classes.modal}
             closeAfterTransition
             BackdropComponent={Backdrop}
             BackdropProps={{
               timeout: 500,
             }}
      >
        <Fade in={true}>
          <div className={classes.paper}>
            <IconButton className="close-start-menu" onClick={() => handleModal()} aria-label="close-start-menu">
              <CloseIcon fontSize="inherit" />
            </IconButton>
            <h2 id="spring-modal-title">Start a game</h2>
            { showGameSelect() }
            { showGameSettings() }
          </div>
        </Fade>
      </Modal>,
      document.querySelector("#modal-root")
    );
  } else return null;
};

export default StartMenu;