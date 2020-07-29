import React, {useEffect, useState} from "react";

import TwoHearts  from '../svg/cards/2H.svg';
import SvgIcon from "@material-ui/core/SvgIcon";
import Divider from "@material-ui/core/Divider";


export const Player = (name) => {

  return (
      <div className="player">
        <div className="player-name">{ name.name }</div>
        <Divider variant="middle" />
        <div className="cards">
           <SvgIcon>
              <img src={TwoHearts} alt="" width="300" height="200" />
           </SvgIcon>
        </div>
      </div>
  );
}