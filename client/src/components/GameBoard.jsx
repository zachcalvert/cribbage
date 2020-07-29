import React, {useEffect, useState} from "react";
import { ReactSVG } from 'react-svg'

export const GameBoard = (game) => {

  return (
    <div className="game-board">
      <ReactSVG src="2H.svg" />
    </div>
  );
}