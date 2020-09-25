import React from "react";
import PropTypes from 'prop-types';

import {IconButton} from "@material-ui/core";
import CloseIcon from "@material-ui/icons/Close";
import makeStyles from "@material-ui/core/styles/makeStyles";
import { useSpring, animated } from 'react-spring';

import './StartMenu.css'


const StartMenu = () => {

  return (
    <div>
      <div className='start-menu'>
        <h2 id="spring-modal-title">Spring modal</h2>
        <p id="spring-modal-description">react-spring animates me.</p>
      </div>
    </div>
  );
};

export default StartMenu;