import React, { useState } from "react";
import '../Player/Player.css'

export const Opponents = (props) => {
  const opponents = props.opponents;

  const renderedOpponents = opponents.map((opponent) =>
      <li key={opponent}>
        {opponent}
      </li>
  );

  return (
      <ul>{renderedOpponents}</ul>
  )
}