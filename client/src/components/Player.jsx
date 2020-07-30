import React, {useEffect, useState} from "react";
import { ReactSVG } from 'react-svg'
import { makeStyles, Divider } from "@material-ui/core";

const styles = makeStyles((theme) => ({
  playingCard: {
    height : 160,
    borderRadius: '5px'
  },
  ' svg': {
    height: 160,
    width: 'auto'
  },
  ' rect': {
    height: 'auto'
  }
}));

export const Player = (name) => {

  return (
    <div className="player">
      <div className="player-name">{ name.name }</div>
      <Divider variant="middle" />
      <span className={styles.cardRow}>
        <ReactSVG wrapper='span' src="cards/2H.svg" { ...styles } />
        <ReactSVG wrapper='span' src="cards/AS.svg" { ...styles } />
        <ReactSVG wrapper='span' src="cards/JD.svg" { ...styles } />
        <ReactSVG wrapper='span' src="cards/JD.svg" { ...styles } />
        <ReactSVG wrapper='span' src="cards/JD.svg" { ...styles } />
        <ReactSVG wrapper='span' src="cards/JD.svg" { ...styles } />
      </span>
    </div>
  );
}