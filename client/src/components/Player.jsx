import React, {useEffect, useState} from "react";

export const Player = (name) => {

  return (
      <div className="player">
        <span>{ name.name }</span>
      </div>
  );
}