import React from "react";
import ReactDOM from "react-dom";
import PropTypes from 'prop-types';

import {IconButton, Modal} from "@material-ui/core";
import CloseIcon from "@material-ui/icons/Close";
import makeStyles from "@material-ui/core/styles/makeStyles";
import { useSpring, animated } from 'react-spring';

import { StartMenuContext } from "./StartMenuContext";
import './StartMenu.css'
import Backdrop from "@material-ui/core/Backdrop";

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
  let { modalContent, handleModal, modal } = React.useContext(StartMenuContext);
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
            <h2 id="spring-modal-title">Spring modal</h2>
            <p id="spring-modal-description">react-spring animates me.</p>
          </div>
        </Fade>
      </Modal>,
      document.querySelector("#modal-root")
    );
  } else return null;
};

export default StartMenu;