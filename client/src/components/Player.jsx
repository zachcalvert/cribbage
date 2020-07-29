import React, {useEffect, useState} from "react";
import { ReactSVG } from 'react-svg'
import { makeStyles, Divider } from "@material-ui/core";

const styles = makeStyles((theme) => ({
  ' svg': {
    height: 120,
  }
}));

export const Player = (name) => {

  return (
      <div className="player">
        <div className="player-name">{ name.name }</div>
        <Divider variant="middle" />
        <div className="cards">
          <ReactSVG src="cards/2H.svg" {...styles} />
        </div>
      </div>
  );
}