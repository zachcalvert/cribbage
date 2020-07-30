import React, {useEffect, useState} from "react";
import { ReactSVG } from 'react-svg'
import { makeStyles, Divider } from "@material-ui/core";
import './Cards.css'

export const Player = (name) => {

  return (
    <div className="player">
      <div className="player-name">{ name.name }</div>
      <Divider variant="middle" />
      <span>
        <ReactSVG wrapper='span' src="cards/2H.svg" />
        <ReactSVG wrapper='span' src="cards/AS.svg" />
        <ReactSVG wrapper='span' src="cards/JD.svg" />
        <ReactSVG wrapper='span' src="cards/JD.svg" />
        <ReactSVG wrapper='span' src="cards/JD.svg" />
        <ReactSVG wrapper='span' src="cards/JD.svg" />
      </span>
    </div>
  );
}