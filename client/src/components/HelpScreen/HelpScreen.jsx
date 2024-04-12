import React from "react";
import { Divider, Typography } from '@material-ui/core';

export const HelpScreen = () => {

  return (
    <>
      <Divider />

        <Typography variant='subtitle2'>
          <br />
          <ul style={{"text-align": "left"}} >
            <li>If the game ever appears to be stuck, please try refreshing the page.</li>
            <li>If you ever notice anything broken, or have ideas on how to make the game better, please email me at zach@cribbage.live</li>
          </ul>
        </Typography>
        <Typography variant='subtitle1'>   
          Thank you for playing!
        </Typography>
    </>
  );
};