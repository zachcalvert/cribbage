import React, {useEffect, useState} from "react";

import TwoHearts  from '../svg/cards/2H.svg';
import SvgIcon from "@material-ui/core/SvgIcon";
import Divider from "@material-ui/core/Divider";

export const GameBoard = (game) => {

  return (
      <div className="game-board">
        This is the { game.game } game board
      </div>
  );
}